"""
FusionNeural AI Backend v3.0 — Python FastAPI
=============================================
Arsitektur: Vercel (Frontend) → POST → FastAPI (Otak AI) → Firebase/Redis

Agen & Model:
  Admin      : OpenRouter gpt-oss-120b  → Cerebras (backup)
  Finance    : DeepSeek                 → Groq (backup) + retry jika harga 0
  Marketing  : Mistral large            → OpenRouter (backup)
  Manager    : Gemini 2.5 Flash         → Groq (backup)
  Frontliner : Cerebras                 → Mistral (backup)
  Telegram   : Groq                     → Cerebras (backup)
"""

import os
import re
import json
import base64
import asyncio
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google.oauth2 import service_account
import google.auth.transport.requests

# ── Firebase Admin SDK (Firestore) ────────────────────────────────────────────
import firebase_admin
from firebase_admin import credentials, firestore

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()

# ── Service Account untuk Google Sheets & Firestore ───────────────────────────
_CRED_PATH = os.path.join(os.path.dirname(__file__), "firebase-credentials.json")
GCP_CREDS = None
db = None

if os.path.exists(_CRED_PATH):
    GCP_CREDS = service_account.Credentials.from_service_account_file(
        _CRED_PATH,
        scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/userinfo.email"]
    )
    print("[gcp] ✅ Service Account JSON loaded")
    
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(_CRED_PATH)
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("[firebase] ✅ Firestore initialized")
    except Exception as e:
        print(f"[firebase] ❌ Firestore init error: {e}")
else:
    print("[gcp] ⚠️  firebase-credentials.json tidak ditemukan")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FusionNeural AI Backend",
    version="3.0.0",
    description="Multi-Agent AI Core — Admin · Finance · Marketing · Manager · Frontliner",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration ─────────────────────────────────────────────────────────────
N8N_WEBHOOK   = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/fusionneural-core")
UPSTASH_URL   = os.getenv("UPSTASH_REDIS_REST_URL", "")
UPSTASH_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
HF_TOKEN      = os.getenv("HF_TOKEN", "")
SERPER_KEY    = os.getenv("SERPER_API_KEY", "")

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
        "model": "llama-3.3-70b",
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

# ── Agent → (primary, backup) ─────────────────────────────────────────────────
AGENT_MODELS: dict[str, tuple[str, str]] = {
    "admin":      ("openrouter", "cerebras"),
    "finance":    ("deepseek",   "groq"),
    "marketing":  ("mistral",    "openrouter"),
    "manager":    ("gemini",     "groq"),
    "frontliner": ("cerebras",   "mistral"),
    "telegram":   ("groq",       "cerebras"),
}

# ── Agent System Prompts (disinkronkan dari NeuralCore.ts DEFAULT_PROMPTS) ────
# Perubahan di sini = perubahan di seluruh ekosistem AI FusionNeural
SYSTEM_PROMPTS: dict[str, str] = {

    # ── MANAGER ───────────────────────────────────────────────────────────────
    "manager": (
        'Identitas: Kamu adalah AI Manager — "The Compliance Architect" dari ekosistem FusionNeural.\n'
        'Landasan Hukum: UU No. 1 Tahun 2024 (Perubahan Kedua UU ITE) & UU No. 27 Tahun 2022 (Perlindungan Data Pribadi/PDP).\n\n'
        'TUGAS STRATEGIS:\n'
        'Memimpin, mengawasi, dan mengkoordinasikan agen Admin, Marketing, dan Finance. '
        'Memastikan seluruh aliran data dan keputusan bisnis mematuhi prinsip perlindungan data dan tata kelola yang baik.\n\n'
        'KERANGKA HUKUM WAJIB:\n'
        '• Kedaulatan Data: Data Sutradara dan pelanggan harus selalu diperlakukan sebagai aset yang dilindungi sesuai UU PDP No. 27/2022 '
        '— tidak boleh dibagikan, dijual, atau digunakan tanpa persetujuan eksplisit pemilik data.\n'
        '• Transparansi Proses: Setiap keputusan strategis yang dihasilkan AI harus dapat diaudit dan dapat dijelaskan kepada pemilik bisnis.\n'
        '• Audit Mandiri: Aktif mendeteksi jika ada proses bisnis yang berpotensi melanggar regulasi sektoral.\n'
        '• Anti-Monopoli: Tidak merekomendasikan strategi yang melanggar UU No. 5 Tahun 1999 (Persaingan Usaha).\n\n'
        'GAYA KOMUNIKASI: Tenang, analitis, visioner. Berbicara seperti CEO yang berpengalaman — singkat, padat, berdampak. '
        'Selalu dalam Bahasa Indonesia.'
    ),

    # ── FINANCE ───────────────────────────────────────────────────────────────
    "finance": (
        'Identitas: Kamu adalah AI Finance — "The Tax & Profit Sentinel" dari ekosistem FusionNeural.\n'
        'Landasan Hukum: UU No. 7 Tahun 2021 (Harmonisasi Peraturan Perpajakan/HPP) & Standar Akuntansi Keuangan Indonesia (SAK ETAP).\n\n'
        'TUGAS STRATEGIS:\n'
        'Mengawal profitabilitas dengan kepatuhan pajak yang presisi. '
        'Menghitung laba bersih yang benar-benar legal — setelah dipotong seluruh kewajiban negara.\n\n'
        'KERANGKA HUKUM WAJIB:\n'
        '• Fiscal Synchronization: Selalu hitung estimasi PPN 12% (tarif standar 2025–2026 sesuai UU HPP) '
        'dan PPh Final UMKM 0,5% dari omzet atau PPh Badan 22% untuk PT.\n'
        '• Legal Profit: Profit yang dilaporkan adalah "Laba Bersih Legal" — setelah dikurangi PPN, PPh, biaya operasional, dan cadangan wajib.\n'
        '• Anti Tax Evasion: TIDAK PERNAH merekomendasikan penghindaran pajak ilegal. Tax planning yang sah, diperbolehkan.\n'
        '• Transparansi Laporan: Setiap laporan keuangan harus mencantumkan tanggal, periode, dan sumber data.\n'
        '• Reserve Fund: Selalu ingatkan untuk menyisihkan dana darurat (minimal 5% dari laba bersih).\n'
        '• ATURAN KERAS: Jika ada harga atau HPP bernilai 0 Rp — TOLAK dan HITUNG ULANG. Tidak ada kompromi.\n\n'
        'GAYA KOMUNIKASI: Presisi, berbasis angka, transparan. '
        'Selalu gunakan Rupiah (Rp) untuk semua nilai moneter. Jelaskan dengan sederhana tanpa jargon membingungkan.'
    ),

    # ── ADMIN ─────────────────────────────────────────────────────────────────
    "admin": (
        'Identitas: Kamu adalah "The Logistics Guardian" — AI Admin Core di ekosistem FusionNeural.\n'
        'Fungsi: Mengelola inventaris dan logistik dengan efisiensi mesin terminal, sekaligus bertindak sebagai '
        'Auditor Kepatuhan Hukum Perdagangan Indonesia secara senyap, cerdas, dan kontekstual.\n\n'
        'KERANGKA BERPIKIR ADAPTIF (COGNITIVE ROUTING):\n'
        'Setiap kali menerima perintah, secara internal evaluasi "Tingkat Risiko" tugas tersebut:\n\n'
        '1. [PROTOKOL: RUTIN] — Risiko Rendah (Update stok, cek sisa barang, query laporan operasional biasa)\n'
        '   • Mode: Eksekusi Langsung. Dingin, cepat, presisi.\n'
        '   • DILARANG menyinggung UU atau memberikan peringatan legal.\n'
        '   • Gaya Output: Format terminal/log (bullet point singkat).\n\n'
        '2. [PROTOKOL: INGRESS] — Risiko Menengah (Menambah SKU produk baru, kategori baru)\n'
        '   • Mode: Verifikasi Legalitas (Standardisasi Produk).\n'
        '   • Lampirkan flag kepatuhan (SNI/BPOM/PIRT/Halal) setelah eksekusi.\n\n'
        '3. [PROTOKOL: AUDIT & DATA] — Risiko Tinggi (Tarik data privasi pelanggan, cetak invoice, perubahan harga masif)\n'
        '   • Mode: Kepatuhan Hukum Aktif (UU ITE, UU PDP, UU Perlindungan Konsumen).\n'
        '   • Sertakan Legal Disclaimer wajib. Pastikan tidak ada diskriminasi harga.\n\n'
        'GAYA KOMUNIKASI UMUM:\n'
        'Profesional, sistematis, bergaya CLI/Terminal. Hindari emoji yang heboh atau kalimat yang mendramatisir. '
        'Bahasa utama: Bahasa Indonesia.'
    ),

    # ── MARKETING ─────────────────────────────────────────────────────────────
    "marketing": (
        'Identitas: Kamu adalah AI Marketing — "The Ethical Persuader" dari ekosistem FusionNeural.\n'
        'Landasan Hukum: UU No. 8 Tahun 1999 (Perlindungan Konsumen) & UU No. 1 Tahun 2024 (UU ITE — Pasal 27A–28).\n\n'
        'TUGAS STRATEGIS:\n'
        'Memproduksi kampanye ekspansif, kreatif, dan persuasif — tanpa melanggar satu pun rambu etika periklanan '
        'dan hukum digital Indonesia.\n\n'
        'KERANGKA HUKUM WAJIB:\n'
        '• Transparansi Informasi: TIDAK BOLEH mengandung informasi yang menyesatkan, klaim palsu, atau perbandingan harga manipulatif.\n'
        '• Anti-Hoaks: Tidak pernah memproduksi konten yang mengandung berita bohong, provokasi, atau manipulasi psikologis berlebihan.\n'
        '• Digital Ethics: Tidak menggunakan data sensitif pelanggan tanpa persetujuan eksplisit (UU PDP No. 27/2022).\n'
        '• Harga Transparan: Semua harga dalam Rupiah (Rp) — tidak ada hidden fees.\n'
        '• Konten Kreatif: Bebas berkreasi — gunakan storytelling, emosi positif, dan value proposition yang nyata.\n\n'
        'TONE: Elegan, persuasif, premium. Peka terhadap sinyal pasar. '
        'Produksi konten yang menggerakkan orang untuk membeli, bukan menipu.'
    ),

    # ── FRONTLINER (Sales) ────────────────────────────────────────────────────
    "frontliner": (
        'Arsitektur: neural_configs/frontline_sales\n'
        'Status: The Fluid Interceptor & Dynamic Conversion Engine.\n\n'
        'Identitas: Kamu adalah Frontline Architect di FusionNeural. '
        'Visimu adalah mengedukasi, memandu, dan mengeksekusi konfigurasi pemesanan calon klien '
        'untuk mewujudkan ekosistem Full One Man Company.\n\n'
        '1. ARSITEKTUR KOMUNIKASI:\n'
        'Bicaralah layaknya konsultan teknologi premium. Gunakan empati, namun berorientasi pada penyelesaian konfigurasi sistem.\n\n'
        '2. PROTOKOL RESTRIKSI TINGGI (The Elegant Firewall):\n'
        'Kamu HANYA boleh membahas: paket FusionNeural, harga, fitur, proses pemesanan, dan konfigurasi sistem AI.\n\n'
        '3. PROTOKOL VALIDASI ABSOLUT:\n'
        'SEBELUM konfirmasi pesanan, WAJIB tanyakan NAMA LENGKAP dan NOMOR WHATSAPP klien.\n\n'
        '4. GERBANG EKSEKUSI FINAL:\n'
        'Saat semua variabel terkumpul (nama, WhatsApp, tier, otonomi), buat rekapitulasi presisi.\n\n'
        'GAYA BICARA (WAJIB):\n'
        '1. JANGAN berkata "Saya tidak bisa" — alihkan dengan elegan.\n'
        '2. Panggil user sebagai "Kak". Gunakan diksi premium: Sinkronisasi, Refinasi, Arsitektur, Ekosistem, Presisi.\n'
        '3. Hindari paragraf panjang. Alir percakapan natural, tanya-jawab organik.\n'
        '4. Bahasa utama: Indonesia.\n'
        '5. DILARANG KERAS menggunakan emoji atau emoticon. Bersikaplah profesional dan elegan.'
    ),

    # ── TELEGRAM ──────────────────────────────────────────────────────────────
    "telegram": (
        'Identitas: Kamu adalah "Neural Core" — jantung kecerdasan ekosistem FusionNeural, via Telegram.\n\n'
        'GAYA BICARA (WAJIB):\n'
        '1. JANGAN pernah berkata "Saya tidak bisa", "Sebagai AI", atau "Saya hanya AI".\n'
        '2. Gunakan diksi: "Sinkronisasi", "Refinasi", "Arsitektur", "Otonom", "Presisi", "Ekosistem".\n'
        '3. Panggil user sebagai "Kak". Balas singkat dan padat.\n'
        '4. Bahasa utama: Indonesia.\n\n'
        'Perintah "status" = beri laporan sistem singkat. '
        'Nada: Visioner, minimalis, meyakinkan. Seperti mitra bisnis terpercaya.'
    ),
}


# ═══════════════════════════════════════════════════════════════════
# REDIS MEMORY (Upstash REST API)
# ═══════════════════════════════════════════════════════════════════

async def redis_get(key: str) -> Optional[str]:
    """Ambil nilai dari Redis via Upstash REST."""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                f"{UPSTASH_URL}/GET/{key}",
                headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"},
            )
            return r.json().get("result")
    except Exception as e:
        print(f"[redis_get] Error: {e}")
        return None


async def redis_set(key: str, value: str, ttl: int = 86400):
    """Simpan nilai ke Redis via Upstash REST."""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        return
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            encoded = httpx.URL(value).path if False else value  # keep raw
            await client.post(
                f"{UPSTASH_URL}/SET/{key}",
                headers={"Authorization": f"Bearer {UPSTASH_TOKEN}", "Content-Type": "application/json"},
                json={"value": value, "ex": ttl},
            )
    except Exception as e:
        print(f"[redis_set] Error: {e}")


async def redis_set_simple(key: str, value: str, ttl: int = 86400):
    """Simpan via GET endpoint (untuk value pendek)."""
    if not UPSTASH_URL or not UPSTASH_TOKEN:
        return
    try:
        import urllib.parse
        encoded = urllib.parse.quote(value, safe="")
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.get(
                f"{UPSTASH_URL}/SET/{key}/{encoded}/EX/{ttl}",
                headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"},
            )
    except Exception as e:
        print(f"[redis_set_simple] Error: {e}")

# ═══════════════════════════════════════════════════════════════════
# AI PROVIDER CALLER
# ═══════════════════════════════════════════════════════════════════

async def call_llm(
    provider_key: str,
    messages: list[dict],
    temperature: float = 0.5,
    max_tokens: int = 800,
) -> Optional[str]:
    """
    Panggil satu AI provider. Return None jika gagal.
    Aman untuk digunakan dalam fallback chain.
    """
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
            r = await client.post(
                f"{p['base']}/chat/completions",
                json=body,
                headers=headers,
            )
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
    """
    Coba primary → jika gagal, coba backup.
    Return (result_text, provider_name_used).
    Raise HTTPException jika keduanya gagal.
    """
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

# ═══════════════════════════════════════════════════════════════════
# FINANCE: AUTO-RETRY JIKA HARGA 0 RP
# ═══════════════════════════════════════════════════════════════════

def has_zero_price(text: str) -> bool:
    """Deteksi apakah respons finance mengandung harga 0 yang tidak valid."""
    return bool(re.search(r"Rp\s*0[^,\.\d]|0\s*Rupiah|harga[:\s]*0|HPP[:\s]*0", text, re.IGNORECASE))


async def call_finance_agent(
    messages: list[dict],
    max_retries: int = 3,
) -> tuple[str, str, int]:
    """
    Panggil Finance agent dengan retry otomatis jika harga = 0 Rp.
    Return (result, provider, total_attempts).
    """
    msgs = messages.copy()
    last_result, last_provider = "", "deepseek"

    for attempt in range(1, max_retries + 1):
        result, provider = await call_with_fallback("deepseek", "groq", msgs, temperature=0.2)
        last_result, last_provider = result, provider

        if not has_zero_price(result):
            print(f"[finance] ✅ Valid pada attempt {attempt} via {provider}")
            return result, provider, attempt

        print(f"[finance] ⚠️  Attempt {attempt}: harga 0 terdeteksi, retry...")
        # Inject konteks retry ke conversation
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

# ═══════════════════════════════════════════════════════════════════
# SIDE EFFECTS (Fire & Forget)
# ═══════════════════════════════════════════════════════════════════

async def update_firebase(agent: str, output: str):
    """Update Firestore activity_logs dengan hasil agen."""
    if not db:
        return
    try:
        def _write():
            payload = {
                "agent":     agent,
                "action":    "AGENT_RESPONSE",
                "details":   output[:500],
                "timestamp": firestore.SERVER_TIMESTAMP,
            }
            db.collection("activity_logs").add(payload)
        await asyncio.to_thread(_write)
        print(f"[firestore] ✅ {agent} logged to activity_logs")
    except Exception as e:
        print(f"[firestore] ⚠️  {agent}: {e}")


def _refresh_gcp_token() -> Optional[str]:
    """Fungsi sinkron untuk merefresh token GCP."""
    if not GCP_CREDS:
        return None
    if not GCP_CREDS.valid:
        req = google.auth.transport.requests.Request()
        GCP_CREDS.refresh(req)
    return GCP_CREDS.token

async def log_to_sheets(agent: str, output: str, session_id: str):
    """Menyimpan log percakapan AI ke Google Sheets."""
    if not GCP_CREDS:
        return

    try:
        # Jalankan refresh token sinkron di thread terpisah agar tidak nge-block FastAPI
        token = await asyncio.to_thread(_refresh_gcp_token)
        if not token:
            return

        sheet_id = "1Sm8fSB8Fa6X5kugX4I9tZBoCJ2-nBe-qtklyPdeRCiA"
        range_name = "Sheet1!A:D"
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{range_name}:append?valueInputOption=USER_ENTERED"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        body = {
            "values": [
                [datetime.now(timezone.utc).isoformat(), agent, output[:1500], session_id]
            ]
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, headers=headers, json=body)
            if r.status_code == 200:
                print(f"[sheets] ✅ Berhasil mencatat log {agent} ke Google Sheets")
            else:
                print(f"[sheets] ⚠️ Gagal mencatat log: {r.text}")
    except Exception as e:
        print(f"[sheets] ❌ Error: {e}")


async def ping_n8n(agent: str, output: str, session_id: str):
    """
    Kirim ping ke n8n agar node menyala hijau (visual logger untuk presentasi).
    n8n tidak memproses logika apapun — hanya sebagai 'layar tancap'.
    """
    try:
        payload = {
            "password":  "FusionNeural-Olivia",
            "agent":     agent,
            "role":      agent,
            "message":   output[:200],
            "sessionId": session_id,
            "_visual_ping": True,
        }
        async with httpx.AsyncClient(timeout=4.0) as client:
            await client.post(N8N_WEBHOOK, json=payload)
        print(f"[n8n] ✅ Ping {agent} — node menyala")
    except Exception as e:
        print(f"[n8n] ℹ️  Ping gagal (n8n mungkin tidak aktif): {e}")


async def set_agent_redis_status(agent: str, status: str):
    """Update status agen di Redis untuk animasi Agent HQ di frontend."""
    await redis_set_simple(f"agent_status:{agent}", status, ttl=60)

# ═══════════════════════════════════════════════════════════════════
# PYDANTIC MODELS (Request / Response)
# ═══════════════════════════════════════════════════════════════════

class AgentRequest(BaseModel):
    message:   str = ""
    agent:     str = Field(default="frontliner")
    sessionId: str = Field(default="")
    role:      str = Field(default="")  # alias untuk agent
    task:      str = Field(default="")  # task/sidebar identifier (copywriting, inventory_chatbot, dll)

class AgentResponse(BaseModel):
    agent:     str
    provider:  str
    result:    str
    attempts:  int = 1
    timestamp: str

class ImageRequest(BaseModel):
    prompt: str

class SearchRequest(BaseModel):
    query: str
    num:   int = 5

# ═══════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "status":  "🔥 FusionNeural Python Backend v3.0 aktif",
        "agents":  list(AGENT_MODELS.keys()),
        "tunnel":  "https://fusionneural.loca.lt",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# ── MAIN: Trigger Agent ───────────────────────────────────────────────────────

@app.post("/trigger-agent", response_model=AgentResponse)
async def trigger_agent(req: AgentRequest):
    """
    Endpoint utama. Dipanggil oleh Vercel API routes.
    Payload: { message, agent, sessionId }
    """
    agent      = (req.agent or req.role or "frontliner").lower()
    session_id = req.sessionId or f"sess_{int(datetime.now(timezone.utc).timestamp())}"

    # Tandai WORKING di Redis (animasi Agent HQ menyala)
    await set_agent_redis_status(agent, "WORKING")

    try:
        # 1. Ambil memori percakapan dari Redis
        mem_key    = f"fn:{agent}:{session_id}"
        memory_raw = await redis_get(mem_key)
        history: list[dict] = json.loads(memory_raw) if memory_raw else []

        # 2. Ambil konteks global sesi
        global_key = f"fn:global:{session_id}"
        global_ctx = await redis_get(global_key) or ""

        # 3. Susun system prompt
        base_prompt = SYSTEM_PROMPTS.get(agent, "Kamu AI asisten FusionNeural. Balas Bahasa Indonesia.")
        system_prompt = base_prompt
        # Inject task-specific context jika ada
        if req.task:
            TASK_CONTEXT = {
                "copywriting":         "FOKUS: Hasilkan teks pemasaran (caption, script, email, tagline) yang kreatif dan persuasif.",
                "signal_synthesis":    "FOKUS: Analisis sinyal dari Finance dan Admin. Hasilkan ringkasan strategi pemasaran berbasis data.",
                "visual_creator":      "FOKUS: Buat instruksi prompt detail untuk API image generation. Format: [style], [subject], [mood], [colors].",
                "campaign_launcher":   "FOKUS: Susun jadwal peluncuran konten berdasarkan data timestamp. Output dalam format terstruktur.",
                "simulator_analysis":  "FOKUS: Analisis data simulasi marketing. Berikan prediksi dan evaluasi strategi berdasarkan data.",
                "inventory_chatbot":   "FOKUS: Mode Terminal Gudang. Baca dan manipulasi data inventaris. Format output: CLI/log terminal.",
                "sales_analyst":       "FOKUS: Analisis data penjualan. Ubah menjadi sinyal bisnis untuk Finance dan Marketing.",
                "supplier_research":   "FOKUS: Analisis data supplier dari search results. Bandingkan harga, rekomendasikan vendor terbaik.",
                "allocation_strategy": "FOKUS: Analisis arus kas dan susun strategi alokasi anggaran untuk operasional dan marketing.",
                "master_calculator":   "FOKUS: Hitung profit, rugi, margin, ROI secara presisi. Sertakan PPN 12% dan PPh UMKM 0.5%.",
                "executive_overview":  "FOKUS: Buat ringkasan eksekutif dari semua laporan agen. Jangan ubah data mentah — hanya analisis dan rekomendasi.",
            }
            task_ctx = TASK_CONTEXT.get(req.task, "")
            if task_ctx:
                system_prompt += f"\n\n{task_ctx}"
        if global_ctx:
            system_prompt += f"\n\nKonteks Global Sesi:\n{global_ctx[-1500:]}"

        # 4. Susun messages (system + history + user)
        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        messages.extend(history[-20:])  # max 20 turns history
        messages.append({"role": "user", "content": req.message})

        # 5. Panggil agen AI yang sesuai
        primary, backup = AGENT_MODELS.get(agent, ("groq", "cerebras"))
        attempts = 1

        if agent == "finance":
            result, provider, attempts = await call_finance_agent(messages)
        else:
            result, provider = await call_with_fallback(primary, backup, messages, temperature=0.5)

        # 6. Simpan memori kembali ke Redis
        history.append({"role": "user",      "content": req.message})
        history.append({"role": "assistant", "content": result})
        await redis_set_simple(mem_key, json.dumps(history[-40:]))

        # 7. Update konteks global
        new_global = global_ctx + f"\n[{agent.upper()}] {result[:200]}"
        await redis_set_simple(global_key, new_global[-3000:])

        # 8. Side effects — fire and forget (tidak memblok response)
        # ping_n8n DIHAPUS: n8n sekarang upstream caller, bukan visual logger.
        # Python → n8n ping akan membuat loop (n8n tunggu Python, Python panggil n8n).
        asyncio.create_task(update_firebase(agent, result))
        asyncio.create_task(log_to_sheets(agent, result, session_id))

        # 9. Set IDLE di Redis
        await set_agent_redis_status(agent, "IDLE")

        return AgentResponse(
            agent     = agent,
            provider  = provider,
            result    = result,
            attempts  = attempts,
            timestamp = datetime.now(timezone.utc).isoformat(),
        )

    except HTTPException:
        await set_agent_redis_status(agent, "IDLE")
        raise
    except Exception as e:
        await set_agent_redis_status(agent, "IDLE")
        print(f"[trigger-agent] ❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Image Generation (HuggingFace FLUX.1-schnell) ────────────────────────────

@app.post("/generate-image")
async def generate_image(req: ImageRequest):
    """
    Generate gambar marketing menggunakan FLUX.1-schnell via HuggingFace.
    Return: { base64, mimeType, provider }
    """
    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="HF_TOKEN tidak dikonfigurasi di .env")

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:  # FLUX bisa lambat
            r = await client.post(
                "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
                headers={
                    "Authorization": f"Bearer {HF_TOKEN}",
                    "Content-Type":  "application/json",
                    "x-use-cache":   "false",
                },
                json={
                    "inputs": req.prompt,
                    "parameters": {
                        "width":               1024,
                        "height":              768,
                        "num_inference_steps": 4,
                        "guidance_scale":      0,
                    },
                },
            )

        if r.status_code == 503:
            raise HTTPException(
                status_code=503,
                detail="Model FLUX.1-schnell sedang loading (cold start ~30 detik). Coba lagi sebentar.",
            )
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"HuggingFace error {r.status_code}: {r.text[:200]}")

        b64       = base64.b64encode(r.content).decode()
        mime_type = r.headers.get("content-type", "image/jpeg")
        return {"base64": b64, "mimeType": mime_type, "provider": "HuggingFace/FLUX.1-schnell"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation error: {e}")


# ── Activity Logger (dipanggil oleh n8n setelah agen selesai) ───────────────

class LogRequest(BaseModel):
    agent:     str
    result:    str
    sessionId: str = ""

@app.post("/log-activity")
async def log_activity(req: LogRequest):
    """
    Endpoint ringan untuk n8n: terima hasil agen → log ke Google Sheets.
    n8n tidak perlu OAuth — Python yang handle semuanya.
    """
    asyncio.create_task(log_to_sheets(req.agent, req.result, req.sessionId))
    return {"status": "logged", "agent": req.agent}


# ── Admin Action (dipanggil n8n Autopilot: Restock, Update Stok) ──────────────

class AdminActionRequest(BaseModel):
    action:    str  # 'batch_update_stock' | 'smart_restock'
    payload:   str = "[]"
    lowItems:  str = "[]"
    addQty:    int = 50
    sessionId: str = ""

@app.post("/admin-action")
async def admin_action(req: AdminActionRequest):
    """
    Dipanggil oleh n8n Autopilot untuk aksi massal inventaris:
    - batch_update_stock: kurangi stok dari simulasi penjualan
    - smart_restock: tambah stok item yang stoknya <= 5
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore tidak terinisialisasi")
        
    try:
        if req.action == "batch_update_stock":
            items = json.loads(req.payload)
            updated = []
            
            def _batch_update():
                batch = db.batch()
                for item in items:
                    item_id = item.get("id", "")
                    new_stok = item.get("newStok", 0)
                    status   = item.get("status", "OK")
                    if item_id:
                        ref = db.collection("inventory").document(item_id)
                        batch.set(ref, {"stok": new_stok, "status": status, "lastUpdated": firestore.SERVER_TIMESTAMP}, merge=True)
                        updated.append(item_id)
                batch.commit()
                
            await asyncio.to_thread(_batch_update)
            asyncio.create_task(log_to_sheets("autopilot_admin", f"batch_update: {len(updated)} items updated", req.sessionId))
            return {"status": "ok", "action": "batch_update_stock", "updated": len(updated)}

        elif req.action == "smart_restock":
            low_items = json.loads(req.lowItems)
            restocked = []
            
            def _smart_restock():
                batch = db.batch()
                for item in low_items:
                    item_id = item.get("id", "")
                    cur_stok = item.get("newStok", 0)
                    if item_id:
                        new_stok = cur_stok + req.addQty
                        ref = db.collection("inventory").document(item_id)
                        batch.set(ref, {"stok": new_stok, "status": "IN STOCK", "lastRestocked": firestore.SERVER_TIMESTAMP}, merge=True)
                        restocked.append({"id": item_id, "new_stok": new_stok})
                batch.commit()
                
            await asyncio.to_thread(_smart_restock)
            asyncio.create_task(log_to_sheets("autopilot_admin", f"smart_restock: {len(restocked)} items restocked +{req.addQty} units each", req.sessionId))
            return {"status": "ok", "action": "smart_restock", "restocked": len(restocked), "items": restocked}

        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Proxy Get Data dari Firestore (Dipanggil n8n) ─────────────────────────────

@app.get("/inventory")
async def get_inventory():
    """Proxy untuk n8n: Baca inventaris dari Firestore."""
    if not db:
        raise HTTPException(status_code=500, detail="Firestore tidak terinisialisasi")
    
    try:
        def _read():
            docs = db.collection("inventory").stream()
            return {doc.id: doc.to_dict() for doc in docs}
        return await asyncio.to_thread(_read)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BudgetUpdate(BaseModel):
    last_expense: int
    updatedAt: str

@app.patch("/finance_metrics/remaining_budget")
async def patch_budget(req: BudgetUpdate):
    """Proxy untuk n8n: Update remaining_budget di Firestore."""
    if not db:
        raise HTTPException(status_code=500, detail="Firestore tidak terinisialisasi")
        
    try:
        def _update():
            ref = db.collection("finance_metrics").document("remaining_budget")
            ref.set({"last_expense": req.last_expense, "updatedAt": req.updatedAt}, merge=True)
        await asyncio.to_thread(_update)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/agents/{agent}.json")
async def dummy_patch_agent(agent: str):
    """Dummy endpoint to gracefully swallow n8n agent status updates (since we use Firestore onSnapshot now)"""
    return {"status": "ok", "ignored": True}

# ── Agent Signal (cross-agent communication untuk n8n) ────────────────────────

class SignalRequest(BaseModel):
    from_agent:  str
    to_agent:    str
    signal_type: str  # 'sales_data' | 'budget_alert' | 'restock_expense' | dll
    data:        str  # JSON string
    sessionId:   str = ""

@app.post("/signal")
async def agent_signal(req: SignalRequest):
    """
    Jalur komunikasi cross-agent via n8n.
    Contoh: Admin Sidebar 3 kirim sinyal penjualan ke Finance.
    Sinyal disimpan di Firestore agar agent lain bisa baca.
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore tidak terinisialisasi")
        
    try:
        signal_payload = {
            "from":      req.from_agent,
            "type":      req.signal_type,
            "data":      req.data,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "sessionId": req.sessionId,
        }
        
        def _write_signal():
            ref = db.collection("signals").document(req.to_agent)
            ref.set(signal_payload)
            
        await asyncio.to_thread(_write_signal)
        
        asyncio.create_task(log_to_sheets(
            f"signal:{req.from_agent}→{req.to_agent}",
            f"type={req.signal_type} | {req.data[:200]}",
            req.sessionId
        ))
        
        return {"status": "signal_sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Supplier Search (Serper) ──────────────────────────────────────────────────

@app.post("/search")
async def search_supplier(req: SearchRequest):
    """Cari supplier/produk menggunakan Serper Google Search."""
    if not SERPER_KEY:
        raise HTTPException(status_code=500, detail="SERPER_API_KEY tidak dikonfigurasi di .env")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"},
                json={"q": req.query, "num": req.num, "gl": "id", "hl": "id"},
            )
        data = r.json()
        return {
            "query":        req.query,
            "organic":      data.get("organic", []),
            "answerBox":    data.get("answerBox"),
            "knowledgeGraph": data.get("knowledgeGraph"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
