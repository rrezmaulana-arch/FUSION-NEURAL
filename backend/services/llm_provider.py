# Project: FUSION NEURAL
# services/llm_provider.py — AI Provider Registry & Caller

import os
import re
import httpx
from typing import Optional
from fastapi import HTTPException

# ── AI Provider Registry ──────────────────────────────────────────────────────
PROVIDERS: dict[str, dict] = {
    "groq": {
        "key":   os.getenv("GROQ_API_KEY", ""),
        "base":  "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
    },
    "deepseek": {
        "key":   os.getenv("DEEPSEEK_API_KEY", ""),
        "base":  "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
    },
    "mistral": {
        "key":   os.getenv("MISTRAL_API_KEY", ""),
        "base":  "https://api.mistral.ai/v1",
        "model": "mistral-large-latest",
    },
    "gemini": {
        "key":   os.getenv("GEMINI_API_KEY", ""),
        "base":  "https://generativelanguage.googleapis.com/v1beta/openai",
        "model": "gemini-2.0-flash",
    },
    "cerebras": {
        "key":   os.getenv("CEREBRAS_API_KEY", ""),
        "base":  "https://api.cerebras.ai/v1",
        "model": "llama3.1-70b",
    },
    "openrouter": {
        "key":   os.getenv("OPENROUTER_API_KEY", ""),
        "base":  "https://openrouter.ai/api/v1",
        "model": "openai/gpt-oss-120b:free",
        "extra_headers": {
            "HTTP-Referer": "https://fusion-neural.vercel.app",
            "X-Title": "FusionNeural",
        },
    },
    "cohere": {
        "key":   os.getenv("COHERE_API_KEY", ""),
        "base":  "https://api.cohere.ai/compatibility/v1",
        "model": "command-r-plus",
    },
}


async def call_llm(
    provider_key: str,
    messages: list[dict],
    temperature: float = 0.5,
    max_tokens: int = 800,
) -> Optional[str]:
    """Panggil satu AI provider. Return None jika gagal."""
    p = PROVIDERS.get(provider_key)
    if not p or not p.get("key"):
        print(f"[{provider_key}] Tidak ada API key, skip.")
        return None

    headers = {
        "Authorization": f"Bearer {p['key']}",
        "Content-Type": "application/json",
        **p.get("extra_headers", {}),
    }
    body = {
        "model": p["model"],
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.post(f"{p['base']}/chat/completions", json=body, headers=headers)
        if r.status_code != 200:
            print(f"[{provider_key}] HTTP {r.status_code}: {r.text[:300]}")
            return None
        content = r.json()["choices"][0]["message"]["content"]
        print(f"[{provider_key}] ✅ OK ({len(content)} chars)")
        return content
    except httpx.TimeoutException:
        print(f"[{provider_key}] ⏱ Timeout")
        return None
    except Exception as e:
        print(f"[{provider_key}] ❌ Error: {e}")
        return None


async def call_with_fallback(
    primary: str,
    backup: str,
    messages: list[dict],
    temperature: float = 0.5,
) -> tuple[str, str]:
    """Coba primary → fallback ke backup jika gagal. Raise 503 jika keduanya gagal."""
    result = await call_llm(primary, messages, temperature)
    if result:
        return result, primary

    print(f"[fallback] {primary} gagal → mencoba {backup}...")
    result = await call_llm(backup, messages, temperature)
    if result:
        return result, backup

    raise HTTPException(
        status_code=503,
        detail=f"Semua provider AI tidak tersedia ({primary}, {backup}). Cek API key dan koneksi.",
    )


def has_zero_price(text: str) -> bool:
    """Deteksi apakah respons finance mengandung harga 0 yang tidak valid."""
    return bool(re.search(r"Rp\s*0[^,\.\d]|0\s*Rupiah|harga[:\s]*0|HPP[:\s]*0", text, re.IGNORECASE))


async def call_finance_agent(
    messages: list[dict],
    max_retries: int = 3,
) -> tuple[str, str, int]:
    """Panggil Finance agent dengan retry otomatis jika harga = 0 Rp."""
    msgs = messages.copy()
    last_result, last_provider = "", "deepseek"

    for attempt in range(1, max_retries + 1):
        result, provider = await call_with_fallback("deepseek", "gemini", msgs, temperature=0.2)
        last_result, last_provider = result, provider

        if not has_zero_price(result):
            print(f"[finance] ✅ Valid pada attempt {attempt} via {provider}")
            return result, provider, attempt

        print(f"[finance] ⚠️  Attempt {attempt}: harga 0 terdeteksi, retry...")
        msgs.append({"role": "assistant", "content": result})
        msgs.append({
            "role": "user",
            "content": (
                "PERHATIAN SISTEM: Respons sebelumnya mengandung harga 0 Rp — TIDAK VALID. "
                "Tolong hitung ulang dengan benar. HPP dan Harga Jual wajib lebih dari 0 Rp."
            ),
        })

    print(f"[finance] ⚠️  Max retries tercapai, mengembalikan hasil terakhir.")
    return last_result, last_provider, max_retries
