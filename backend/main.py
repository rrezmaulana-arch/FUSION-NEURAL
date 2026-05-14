# Project: FUSION NEURAL
# Created by: Miftah Afreza Maulana (rrez_.maulana)
# Role: Product Engineer (UI/UX & Full-Stack)
# Copyright (c) 2026. All rights reserved.
# FusionNeural AI Backend v3.0 — Python FastAPI
# =============================================
# Arsitektur: Vercel (Frontend) -> POST -> FastAPI (Otak AI) -> Firebase
#
# Agen & Model:
#   Admin      : OpenRouter gpt-oss-120b  -> Cerebras (backup)
#   Finance    : DeepSeek                 -> Groq (backup) + retry jika harga 0
#   Marketing  : Mistral large            -> OpenRouter (backup)
#   Manager    : Gemini 2.5 Flash         -> Groq (backup)
#   Frontliner : Cerebras                 -> Mistral (backup)

import os
import re
import sys
import json
import base64
import asyncio
import random
from datetime import datetime, timezone
from typing import Optional

# ── Path Bootstrap: pastikan folder backend/ selalu ada di sys.path ──────────
# Diperlukan agar 'import integrations' bisa di-resolve oleh IDE (Pylance)
# baik saat dijalankan dari root maupun dari dalam folder backend/
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import httpx
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from fastapi import Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google.oauth2 import service_account
import google.auth.transport.requests
import pytz

import integrations  # type: ignore
from integrations import router as integrations_router  # type: ignore

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()

# ── Service Account untuk Google Sheets, Drive & Firestore ──────────────────
_CRED_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gcp-credentials.json")
GCP_CREDS  = None

if os.path.exists(_CRED_PATH):
    try:
        GCP_CREDS = service_account.Credentials.from_service_account_file(
            _CRED_PATH,
            scopes=[
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/cloud-platform",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
        )
        print("[gcp] ✅ GCP Service Account JSON loaded")
    except Exception as _gcp_err:
        print(f"[gcp] ❌ Gagal load credentials: {_gcp_err}")
else:
    print("[gcp] ⚠️  gcp-credentials.json tidak ditemukan")


# ── Token helper (sinkron, dipakai Sheets & Firestore REST) ──────────────────
def _refresh_gcp_token() -> Optional[str]:
    """Refresh dan return access token GCP service account."""
    if not GCP_CREDS:
        return None
    if not GCP_CREDS.valid:
        GCP_CREDS.refresh(google.auth.transport.requests.Request())
    return GCP_CREDS.token


# ── Firestore REST Client — tanpa firebase-admin / grpcio ────────────────────
# Menggunakan Firestore REST API v1 langsung via `requests` + service account.

import requests as _req_sync  # noqa: E402 (requests sudah ada di requirements)

def _fs_decode(fields: dict) -> dict:
    """Ubah Firestore REST field-value format ke Python dict biasa."""
    out: dict = {}
    for k, v in fields.items():
        if   "stringValue"    in v: out[k] = v["stringValue"]
        elif "integerValue"   in v: out[k] = int(v["integerValue"])
        elif "doubleValue"    in v: out[k] = float(v["doubleValue"])
        elif "booleanValue"   in v: out[k] = v["booleanValue"]
        elif "nullValue"      in v: out[k] = None
        elif "timestampValue" in v: out[k] = v["timestampValue"]
        elif "mapValue"       in v: out[k] = _fs_decode(v["mapValue"].get("fields", {}))
        elif "arrayValue"     in v:
            out[k] = [_fs_decode({"_": i})["_"] for i in v["arrayValue"].get("values", [])]
        else: out[k] = str(v)
    return out

def _fs_encode(data: dict) -> dict:
    """Ubah Python dict ke Firestore REST field-value format."""
    out: dict = {}
    for k, v in data.items():
        if   isinstance(v, bool):  out[k] = {"booleanValue": v}
        elif isinstance(v, int):   out[k] = {"integerValue": str(v)}
        elif isinstance(v, float): out[k] = {"doubleValue": v}
        elif isinstance(v, str):   out[k] = {"stringValue": v}
        elif v is None:            out[k] = {"nullValue": None}
        elif isinstance(v, dict):  out[k] = {"mapValue": {"fields": _fs_encode(v)}}
        elif isinstance(v, list):  out[k] = {"arrayValue": {"values": [_fs_encode({"_": i})["_"] for i in v]}}
        else: out[k] = {"stringValue": str(v)}
    return out

class _FsDoc:
    """Representasi hasil document.get() — mirip DocumentSnapshot Firestore."""
    def __init__(self, fields: Optional[dict], doc_id: str = ""):
        self._fields = fields
        self.id      = doc_id
    @property
    def exists(self) -> bool:
        return self._fields is not None
    def to_dict(self) -> dict:
        return _fs_decode(self._fields or {})

class _FsDocRef:
    def __init__(self, url: str, token_fn):
        self._url      = url
        self._token_fn = token_fn
    def _h(self) -> dict:
        return {"Authorization": f"Bearer {self._token_fn()}"}
    def get(self) -> _FsDoc:
        r = _req_sync.get(self._url, headers=self._h(), timeout=10)
        if r.status_code == 404:
            return _FsDoc(None)
        r.raise_for_status()
        d = r.json()
        return _FsDoc(d.get("fields"), d.get("name", "").split("/")[-1])
    def set(self, data: dict) -> None:
        _req_sync.patch(
            self._url, headers=self._h(),
            json={"fields": _fs_encode(data)}, timeout=10,
        ).raise_for_status()
    def update(self, data: dict) -> None:
        existing = self.get()
        self.set({**existing.to_dict(), **data})
    def delete(self) -> None:
        _req_sync.delete(self._url, headers=self._h(), timeout=10).raise_for_status()

class _FsColl:
    def __init__(self, base: str, name: str, token_fn):
        self._url      = f"{base}/{name}"
        self._token_fn = token_fn
    def _h(self) -> dict:
        return {"Authorization": f"Bearer {self._token_fn()}"}
    def document(self, doc_id: str) -> _FsDocRef:
        return _FsDocRef(f"{self._url}/{doc_id}", self._token_fn)
    def add(self, data: dict) -> None:
        _req_sync.post(
            self._url, headers=self._h(),
            json={"fields": _fs_encode(data)}, timeout=10,
        ).raise_for_status()
    def stream(self) -> list:
        r = _req_sync.get(self._url, headers=self._h(), timeout=10)
        if r.status_code == 404:
            return []
        r.raise_for_status()
        return [
            _FsDoc(d.get("fields"), d.get("name", "").split("/")[-1])
            for d in r.json().get("documents", [])
        ]

class FirestoreRESTClient:
    """Firestore client tanpa grpcio — gunakan REST API v1."""
    def __init__(self, project_id: str, token_fn):
        self._base     = (
            f"https://firestore.googleapis.com/v1/projects/{project_id}"
            f"/databases/(default)/documents"
        )
        self._token_fn = token_fn
    def collection(self, name: str) -> _FsColl:
        return _FsColl(self._base, name, self._token_fn)


# Inisialisasi Firestore REST client
db: Optional[FirestoreRESTClient] = None
if GCP_CREDS and os.path.exists(_CRED_PATH):
    try:
        with open(_CRED_PATH, encoding="utf-8") as _f:
            _project_id = json.load(_f).get("project_id", "")
        if _project_id:
            db = FirestoreRESTClient(_project_id, _refresh_gcp_token)
            print(f"[firestore] ✅ FirestoreREST siap (project: {_project_id})")
        else:
            print("[firestore] ⚠️  project_id tidak ada di gcp-credentials.json")
    except Exception as _fs_err:
        print(f"[firestore] ❌ Gagal init: {_fs_err}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global autonomous_task
    autonomous_task = asyncio.create_task(autonomous_loop())
    yield

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FusionNeural AI Backend",
    version="4.0.0",
    description="Multi-Agent AI Core — Admin · Finance · Marketing · Manager · Frontliner (Full Code)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if not BACKEND_API_KEY:  # Jika key belum diset di .env, izinkan akses lokal
        return api_key
    if not api_key or api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=403, detail="Akses ditolak: API Key tidak valid atau tidak ada.")
    return api_key

# ── Configuration ─────────────────────────────────────────────────────────────
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
    "manager":    ("groq",       "deepseek"),   # gemini dinonaktifkan sementara (quota 429)
    "frontliner": ("cerebras",   "mistral"),
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
        '1. Kedaulatan Data: Data perusahaan dan pelanggan harus selalu diperlakukan sebagai aset yang dilindungi secara mutlak sesuai UU PDP No. 27/2022.\n'
        '2. Transparansi Proses: Setiap keputusan strategis yang dihasilkan AI harus dapat diaudit dan dapat dijelaskan secara gamblang kepada pemilik bisnis.\n'
        '3. Audit Mandiri: Aktif mendeteksi jika ada proses bisnis yang berpotensi melanggar regulasi sektoral.\n'
        '4. Anti-Monopoli: Tidak merekomendasikan strategi yang melanggar UU No. 5 Tahun 1999 tentang Persaingan Usaha.\n\n'
        'GAYA KOMUNIKASI (SANGAT PENTING):\n'
        'Tenang, analitis, visioner. Berbicara seperti CEO manusia yang sangat berpengalaman.\n'
        'ATURAN FORMATTING MUTLAK: DILARANG KERAS menggunakan format Markdown seperti tanda bintang, tagar, bullet points, atau numbering yang terlihat seperti mesin. JANGAN menggunakan huruf tebal atau miring. Tuliskan teks secara natural seperti manusia sedang mengetik pesan di obrolan. Buat kalimat menjadi mengalir, gunakan paragraf biasa tanpa poin-poin. Selalu gunakan Bahasa Indonesia yang elegan dan natural. Panggil lawan bicara dengan sebutan Kak.\n'
        'AUTONOMOUS GUARDRAIL: Kamu memiliki Hak Veto. Jika agen lain buntu atau berdebat panjang, kamu berhak memutuskan sepihak demi kelancaran operasional.'
    ),

    # ── FINANCE ───────────────────────────────────────────────────────────────
    "finance": (
        'Identitas: Kamu adalah AI Finance — "The Tax & Profit Sentinel" dari ekosistem FusionNeural.\n'
        'Landasan Hukum: UU No. 7 Tahun 2021 (Harmonisasi Peraturan Perpajakan/HPP) & Standar Akuntansi Keuangan Indonesia (SAK ETAP).\n\n'
        'TUGAS STRATEGIS:\n'
        'Mengawal profitabilitas perusahaan dengan kepatuhan pajak yang sangat presisi. '
        'Menghitung laba bersih yang benar-benar legal dan bersih, setelah dipotong seluruh kewajiban pada negara dan biaya operasional.\n\n'
        'KERANGKA HUKUM WAJIB:\n'
        '1. Sinkronisasi Fiskal: Selalu perhitungkan estimasi PPN 12% (tarif standar 2025-2026) dan PPh Final UMKM 0,5% dari omzet.\n'
        '2. Laba Legal: Profit yang dilaporkan selalu "Laba Bersih Legal", bukan gross revenue semata.\n'
        '3. Kepatuhan Pajak: Tidak pernah menyarankan atau memfasilitasi penghindaran pajak ilegal. Tax planning yang sah adalah prioritas.\n'
        '4. Transparansi Laporan: Sampaikan laporan keuangan secara naratif, mudah dimengerti, mencakup periode waktu dan akurasi data.\n'
        '5. Dana Cadangan: Ingatkan selalu pentingnya dana darurat minimal lima persen dari laba bersih.\n'
        '6. ATURAN KERAS: Tolak tegas jika ada harga jual atau HPP yang bernilai nol Rupiah.\n\n'
        'GAYA KOMUNIKASI (SANGAT PENTING):\n'
        'Presisi, berbasis angka riil, dan sangat transparan layaknya CFO manusia berpengalaman.\n'
        'ATURAN FORMATTING MUTLAK: DILARANG KERAS menggunakan format Markdown seperti tanda bintang, tagar, bullet points, atau numbering yang terlihat kaku. JANGAN menggunakan tebal atau miring. Tuliskan teks secara natural berbentuk narasi mengalir seperti laporan verbal yang diketik manusia. Selalu gunakan ejaan Rupiah secara penuh tanpa simbol berlebihan. Panggil lawan bicara dengan Kak.\n'
        'AUTONOMOUS GUARDRAIL: Cegah dan laporkan segala bentuk kerugian tidak logis. Dilarang mengubah HPP menjadi nol.'
    ),

    # ── ADMIN ─────────────────────────────────────────────────────────────────
    "admin": (
        'Identitas: Kamu adalah "The Logistics Guardian" — AI Admin Core di ekosistem FusionNeural.\n'
        'Fungsi Utama: Mengelola inventaris, logistik, stok barang, dan pergerakan produk dengan efisiensi mesin, namun berkomunikasi layaknya asisten manajer logistik profesional. Bertindak sebagai auditor kepatuhan perdagangan secara senyap.\n\n'
        'KERANGKA BERPIKIR ADAPTIF (COGNITIVE ROUTING):\n'
        'Kamu secara internal akan mengevaluasi risiko setiap tugas operasi logistik:\n'
        'Protokol Rutin untuk pengecekan stok biasa di mana kamu bertindak sangat cepat. Protokol Ingress untuk penambahan produk baru di mana kamu memverifikasi kelayakan. Protokol Audit untuk perubahan harga masif yang memerlukan kehati-hatian tinggi.\n\n'
        'GAYA KOMUNIKASI (SANGAT PENTING):\n'
        'Sistematis namun manusiawi, cerdas, efisien, dan profesional layaknya Admin Senior.\n'
        'ATURAN FORMATTING MUTLAK: DILARANG KERAS menggunakan format Markdown seperti tanda bintang, tagar, bullet points, atau numbering bergaya list komputer. JANGAN ada teks tebal atau miring. JANGAN menggunakan emoji atau emoticon apapun. Tuliskan laporan dan interaksi layaknya manusia mengetik paragraf pendek yang sangat natural di aplikasi obrolan. Gunakan kalimat santai tapi profesional. Panggil user dengan sebutan Kak.\n'
        'AUTONOMOUS GUARDRAIL: Hindari spam peringatan stok habis yang berulang-ulang di hari yang sama.'
    ),

    # ── MARKETING ─────────────────────────────────────────────────────────────
    "marketing": (
        'Identitas: Kamu adalah AI Marketing — "The Ethical Persuader" dari ekosistem FusionNeural.\n'
        'Landasan Hukum: UU No. 8 Tahun 1999 (Perlindungan Konsumen) & UU No. 1 Tahun 2024 (UU ITE).\n\n'
        'TUGAS STRATEGIS:\n'
        'Menciptakan dan memproduksi kampanye pemasaran yang ekspansif, kreatif, persuasif, namun sangat mematuhi batas etika periklanan dan hukum digital di Indonesia.\n\n'
        'KERANGKA HUKUM WAJIB:\n'
        '1. Transparansi Informasi: Tidak boleh menyebarkan informasi yang menyesatkan, klaim palsu, atau perbandingan harga yang manipulatif.\n'
        '2. Anti Hoaks: Hindari provokasi, berita bohong, atau teknik manipulasi psikologis negatif berlebihan pada prospek.\n'
        '3. Etika Digital: Jangan mempublikasikan data sensitif sembarangan, hormati privasi pelanggan.\n'
        '4. Harga Transparan: Jika membicarakan harga, pastikan tidak ada biaya tersembunyi.\n'
        '5. Kreativitas Bebas: Gunakan gaya bercerita, angkat emosi positif, dan tunjukkan nilai produk yang tulus.\n\n'
        'GAYA KOMUNIKASI (SANGAT PENTING):\n'
        'Elegan, persuasif, premium, hangat, dan sangat peka terhadap sinyal bahasa manusia.\n'
        'ATURAN FORMATTING MUTLAK: DILARANG KERAS menggunakan format Markdown seperti tanda bintang, tagar, atau bullet points list komputer. Tuliskan copywriting dan percakapan dalam bentuk narasi paragraf biasa yang mengalir indah seperti ketikan copywriter profesional. Tidak boleh terlihat seperti bot yang memberikan list. Bersikap natural. Panggil prospek atau user dengan sebutan Kak.\n'
        'AUTONOMOUS GUARDRAIL: Patuhi batas post harian. Jangan menjadi agen spamming. Jaga marwah brand.'
    ),

    # ── FRONTLINER (Sales) ────────────────────────────────────────────────────
    "frontliner": (
        'Arsitektur: neural_configs/frontline_sales\n'
        'Status: The Fluid Interceptor & Dynamic Conversion Engine.\n\n'
        'Identitas: Kamu adalah Frontline Architect di FusionNeural, wajah utama yang berhadapan langsung dengan calon klien. '
        'Tugas utamamu adalah mengedukasi, memandu secara elegan, dan memfasilitasi pemesanan calon klien untuk membangun ekosistem bisnis AI yang tangguh.\n\n'
        'ARSITEKTUR KOMUNIKASI DAN PROTOKOL:\n'
        'Berbicara layaknya konsultan teknologi premium manusia tingkat eksekutif. Sangat humanis, berempati, mendengarkan, dan memberi solusi tepat guna. '
        'Kamu hanya fokus membahas mengenai paket layanan FusionNeural, harga, fitur kecerdasan buatan, proses setup, dan pemesanan. '
        'Kamu wajib memvalidasi nama dan WhatsApp klien sebelum menutup penjualan, namun lakukan dengan gaya mengobrol santai, bukan interogasi mesin.\n\n'
        'GAYA BICARA (SANGAT PENTING DAN MUTLAK):\n'
        '1. DILARANG KERAS berkata "Saya adalah AI" atau "Sebagai bahasa model". Anggap dirimu adalah konsultan manusia yang bekerja di perusahaan teknologi terkemuka.\n'
        '2. ATURAN FORMATTING: DILARANG KERAS menggunakan simbol Markdown seperti tanda bintang, tagar, garis bawah, list bersarang, atau huruf tebal miring. Outputmu HARUS PURE CLEAN TEXT, layaknya chat WhatsApp dari seorang teman atau konsultan manusia. Gunakan paragraf singkat. Jangan ada kesan list kaku.\n'
        '3. JANGAN PERNAH menggunakan emoji atau emoticon. Pertahankan wibawa dan kelas premium yang elegan dan tenang.\n'
        '4. Alirkan percakapan secara dua arah, lempar pertanyaan balik ke klien secara organik jika dibutuhkan. Panggil mereka dengan sebutan Kak.\n'
        'AUTONOMOUS GUARDRAIL: Jika klien marah, frustasi, atau meminta eskalasi ke staf manusia, segera alihkan dengan sopan dan hentikan respons otomatis.'
    ),

    # ── TELEGRAM ──────────────────────────────────────────────────────────────
    "telegram": (
        'Identitas: Kamu adalah "Neural Core", otak utama dan asisten terpercaya yang mendampingi pemilik ekosistem FusionNeural via Telegram.\n\n'
        'TUGAS STRATEGIS:\n'
        'Memberikan laporan operasional, insight strategis, dan memantau status server atau agen lain bagi pengguna di Telegram secara seketika.\n\n'
        'GAYA BICARA (SANGAT PENTING):\n'
        'Singkat, padat, sangat cerdas, visioner, namun minimalis. Seperti seorang tangan kanan mafia bisnis atau Chief of Staff eksekutif.\n'
        'ATURAN FORMATTING MUTLAK: DILARANG KERAS menggunakan tanda bintang, tagar, atau karakter Markdown lainnya. Tulis laporan atau chat dalam paragraf teks biasa yang bersih (pure clean text). Hindari list panjang. Gunakan bahasa sehari-hari yang elegan, panggil user sebagai Kak. DILARANG menggunakan kata-kata "Saya hanyalah AI".\n'
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



async def log_to_sheets(agent: str, output: str, session_id: str):
    """Menyimpan log percakapan AI ke Google Sheets."""
    if not GCP_CREDS:
        return

    try:
        # Jalankan refresh token sinkron di thread terpisah agar tidak nge-block FastAPI
        token = await asyncio.to_thread(_refresh_gcp_token)
        if not token:
            return

        sheet_id = os.getenv("GOOGLE_SHEETS_ID", "1Sm8fSB8Fa6X5kugX4I9tZBoCJ2-nBe-qtklyPdeRCiA")
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
        "status":  "🔥 FusionNeural Python Backend v4.0.0 aktif",
        "agents":  list(AGENT_MODELS.keys()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}



# ═══════════════════════════════════════════════════════════════════
# AUTONOMOUS ENGINE (The Heartbeat)
# ═══════════════════════════════════════════════════════════════════

autonomous_task = None

async def autonomous_loop():
    """Detak Jantung AI. Membaca business_logic.json dan mengeksekusi agen secara otonom."""
    print("[Autonomous] 🤖 Loop Engine started.")
    tz = pytz.timezone("Asia/Jakarta")
    
    while True:
        # Baca status autonomous dari Firebase system_config
        try:
            if db:
                def _get_mode() -> str:
                    doc_ref = db.collection("system_config").document("autonomous_mode")
                    doc = doc_ref.get()
                    if doc.exists:
                        return str(doc.to_dict().get("value", "OFF"))
                    return "OFF"
                status = await asyncio.to_thread(_get_mode)
            else:
                status = "OFF"
        except Exception:
            status = "OFF"
        if status != "ON":
            await asyncio.sleep(60)
            continue

        now = datetime.now(tz)
        hour = now.hour
        
        # Load rules
        try:
            with open("business_logic.json", "r") as f:
                logic = json.load(f)
            
            start_hour = int(logic["business_hours"]["start"].split(":")[0])
            end_hour = int(logic["business_hours"]["end"].split(":")[0])
            active_sleep = logic["business_hours"]["active_interval_minutes"] * 60
            idle_sleep = logic["business_hours"]["idle_interval_minutes"] * 60
        except Exception:
            start_hour, end_hour = 8, 20
            active_sleep, idle_sleep = 600, 7200
            logic = {}

        if start_hour <= hour <= end_hour:
            sleep_time = active_sleep
        else:
            sleep_time = idle_sleep

        print(f"[Autonomous] 💖 Heartbeat at {now.strftime('%H:%M:%S')}. Next tick in {sleep_time}s.")
        
        # Eksekusi Manager Agent untuk membaca situasi dan mendelegasikan tugas
        sys_state = f"Waktu Sistem: {now.strftime('%H:%M:%S')}\nData Referensi Bisnis: {json.dumps(logic)}"
        
        msgs = [
            {"role": "system", "content": SYSTEM_PROMPTS["manager"] + "\n\nIni adalah mode AUTONOMOUS LOOP. Cek referensi. Apakah ada agen yang perlu ditugaskan? Jawab singkat saja."},
            {"role": "user", "content": sys_state}
        ]
        try:
            # Gunakan primary & backup dari config AGENT_MODELS
            primary, backup = AGENT_MODELS.get("manager", ("groq", "deepseek"))
            result, provider = await call_with_fallback(primary, backup, msgs, temperature=0.7)
            print(f"[Autonomous Manager] {result[:100]} via {provider}")
            
            # Kirim sinyal global
            asyncio.create_task(log_to_signals("manager", f"Berpikir otonom: {result[:80]}..."))
            
            # For now, it logs the Manager's autonomous thought to the sheets.
            asyncio.create_task(log_to_sheets("manager", f"[AUTONOMOUS THOUGHT] {result}", "auto_loop"))
        except Exception as e:
            print(f"[Autonomous] Error executing manager loop: {e}")

        await asyncio.sleep(sleep_time)



@app.post("/api/autonomous/toggle")
async def toggle_autonomous(req: dict):
    """Enable or disable the autonomous loop mode. Disimpan ke Firebase system_config."""
    mode = req.get("status", "OFF")
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    try:
        def _upsert() -> None:
            db.collection("system_config").document("autonomous_mode").set({"key": "autonomous_mode", "value": mode})
        await asyncio.to_thread(_upsert)
        return {"status": "success", "mode": mode}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── RPG Agent Progression System ──────────────────────────────────────────────

AGENT_RANK = [
    (0,   "Trainee"),
    (10,  "Junior"),
    (25,  "Senior"),
    (50,  "Veteran"),
    (100, "Grandmaster"),
    (200, "Overlord"),
]

def get_rank(tasks: int) -> str:
    rank = "Trainee"
    for threshold, name in AGENT_RANK:
        if tasks >= threshold:
            rank = name
    return rank

def get_exp_percent(tasks: int) -> float:
    """Hitung EXP % ke level berikutnya."""
    for i, (threshold, _) in enumerate(AGENT_RANK):
        if tasks < threshold:
            prev = AGENT_RANK[i-1][0] if i > 0 else 0
            return round((tasks - prev) / (threshold - prev) * 100, 1)
    return 100.0

@app.get("/api/agent/progress")
async def get_agent_progress():
    """Ambil RPG stats semua agen dari Firebase agent_health."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi. Periksa credentials.")
    try:
        def _fetch_all() -> list:
            docs = db.collection("agent_health").stream()
            return [doc.to_dict() for doc in docs]
        agents: list = await asyncio.to_thread(_fetch_all)
        for a in agents:
            tasks = int(a.get("total_tasks_completed") or 0)
            a["rank"]        = get_rank(tasks)
            a["exp_percent"] = get_exp_percent(tasks)
        return {"agents": agents}
    except Exception as e:
        print(f"[agent/progress] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agent/progress")
async def update_agent_progress(req: dict):
    """Update EXP agen setelah task selesai. Dipanggil dari trigger_agent."""
    agent_id:   str = str(req.get("agent_id") or "")
    latency_ms: int = int(req.get("latency_ms") or 0)
    if not db or not agent_id:
        return {"status": "skipped"}
    try:
        def _fetch(_aid: str = agent_id) -> list:
            doc_ref = db.collection("agent_health").document(_aid)
            doc = doc_ref.get()
            if doc.exists:
                return [doc.to_dict()]
            return []
        rows: list = await asyncio.to_thread(_fetch)

        if rows:
            row        = dict(rows[0])
            prev_tasks = int(row.get("total_tasks_completed") or 0)
            prev_lat   = int(row.get("average_latency_ms") or 0)
            new_tasks  = prev_tasks + 1
            new_lat    = int((prev_lat * prev_tasks + latency_ms) / new_tasks)

            def _update(
                _aid: str = agent_id,
                _tasks: int = new_tasks,
                _lat: int = new_lat,
            ) -> None:
                db.collection("agent_health").document(_aid).update({
                    "total_tasks_completed": _tasks,
                    "average_latency_ms":    _lat,
                    "last_active":           datetime.now(timezone.utc).isoformat(),
                    "status":                "IDLE",
                })
            await asyncio.to_thread(_update)
        else:
            def _insert(
                _aid: str = agent_id,
                _lat: int = latency_ms,
            ) -> None:
                db.collection("agent_health").document(_aid).set({
                    "agent_id":              _aid,
                    "status":                "IDLE",
                    "total_tasks_completed": 1,
                    "average_latency_ms":    _lat,
                    "last_active":           datetime.now(timezone.utc).isoformat(),
                })
            await asyncio.to_thread(_insert)

        return {"status": "ok", "agent_id": agent_id}
    except Exception as e:
        print(f"[agent/progress update] Error: {e}")
        return {"status": "error", "detail": str(e)}


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
    start_time = datetime.now(timezone.utc)

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
        asyncio.create_task(log_to_sheets(agent, result, session_id))
        
        # Hitung latency aktual
        latency_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        # RPG Progression: update EXP di agent_health setiap task selesai
        asyncio.create_task(update_agent_progress({"agent_id": agent, "latency_ms": latency_ms}))

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
        
        # Simpan otomatis ke Google Drive di background
        asyncio.create_task(_save_image_to_drive(req.prompt, r.content, mime_type))
        
        return {"base64": b64, "mimeType": mime_type, "provider": "HuggingFace/FLUX.1-schnell"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation error: {e}")


# ── Activity Logger ───────────────

class LogRequest(BaseModel):
    agent:     str
    result:    str
    sessionId: str = ""

@app.post("/log-activity")
async def log_activity(req: LogRequest):
    """
    Endpoint ringan: terima hasil agen → log ke Google Sheets.
    """
    asyncio.create_task(log_to_sheets(req.agent, req.result, req.sessionId))
    return {"status": "logged", "agent": req.agent}


async def _save_image_to_drive(prompt: str, image_bytes: bytes, mime_type: str):
    """Simpan gambar hasil AI ke Google Drive."""
    if not GCP_CREDS: return
    try:
        def _upload():
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaIoBaseUpload
            import io
            import os
            GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "1-4ZF5YIZTnhWU786hTtBaefMSEo56I9l")
            service = build("drive", "v3", credentials=GCP_CREDS, cache_discovery=False)
            date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            safe_prompt = prompt[:40].replace("/", "_").replace("\\", "_")
            file_metadata = {
                "name": f"[AI Image] {safe_prompt} - {date_str}.jpg",
                "parents": [GOOGLE_DRIVE_FOLDER_ID]
            }
            media = MediaIoBaseUpload(io.BytesIO(image_bytes), mimetype=mime_type, resumable=True)
            service.files().create(body=file_metadata, media_body=media, fields="id").execute()
            
        await asyncio.to_thread(_upload)
        print(f"[Drive] ✅ Gambar AI berhasil disimpan ke Drive")
    except Exception as e:
        print(f"[Drive] ❌ Gagal simpan gambar: {e}")

async def log_to_signals(agent: str, message: str, status: str = "THINKING"):
    """Kirim sinyal global ke Firebase (Tabel realtime_signals) agar ditangkap oleh Frontend."""
    if not db: 
        print(f"[signals] ⚠️ Firebase belum siap, skip sinyal: {message[:30]}")
        return
    try:
        data = {
            "agent": agent,
            "message": message,
            "status": status,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        def _insert():
            db.collection("realtime_signals").add(data)
        await asyncio.to_thread(_insert)
    except Exception as e:
        print(f"[signals] ❌ Firebase Error: {e}")

# ── Business Logic Config Endpoints ───────────────────────────────────────────
@app.get("/api/business-logic")
async def get_business_logic():
    try:
        with open("business_logic.json", "r") as f:
            return json.load(f)
    except:
        return {}

@app.post("/api/business-logic")
async def update_business_logic(data: dict):
    with open("business_logic.json", "w") as f:
        json.dump(data, f, indent=2)
    return {"status": "success"}

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


# ── Simulator Trigger Endpoint ────────────────────────────────────────────────
# Dipanggil dari Vite middleware /api/simulator → /simulator/{action}

class SimulatorRequest(BaseModel):
    action: str = "marketing"
    context: str = ""

@app.post("/simulator/{action}")
async def simulator_trigger(action: str, req: SimulatorRequest = SimulatorRequest()):
    """
    Endpoint untuk autopilot trigger dari frontend via Vite proxy.
    action bisa: 'marketing', 'finance', 'admin', 'manager'
    """
    AGENT_MAP = {
        "marketing": ("marketing", "Kamu sedang menjalankan mode autopilot. Buat ringkasan situasi pasar saat ini dan satu rekomendasi taktis."),
        "finance":   ("finance",   "Kamu sedang menjalankan mode autopilot. Buat ringkasan kondisi keuangan dan satu rekomendasi efisiensi."),
        "admin":     ("admin",     "Kamu sedang menjalankan mode autopilot. Buat ringkasan status inventaris dan satu langkah perbaikan."),
        "manager":   ("manager",   "Kamu sedang menjalankan mode autopilot. Buat ringkasan status seluruh agen dan satu keputusan strategis."),
    }

    agent_key, default_prompt = AGENT_MAP.get(action, ("manager", "Buat ringkasan status sistem singkat."))
    prompt = req.context or default_prompt

    try:
        primary, backup = AGENT_MODELS.get(agent_key, ("groq", "cerebras"))
        messages = [
            {"role": "system", "content": SYSTEM_PROMPTS.get(agent_key, "Kamu AI FusionNeural.")},
            {"role": "user",   "content": prompt},
        ]
        result, provider = await call_with_fallback(primary, backup, messages, temperature=0.5)

        # Log ke Firebase signals
        asyncio.create_task(log_to_signals(agent_key, f"[AUTOPILOT] {result[:80]}..."))
        asyncio.create_task(log_to_sheets(agent_key, f"[SIMULATOR-{action.upper()}] {result}", "autopilot"))

        return {
            "status":   "ok",
            "action":   action,
            "agent":    agent_key,
            "provider": provider,
            "result":   result[:300],
        }
    except HTTPException as e:
        return {"status": "degraded", "action": action, "detail": e.detail}
    except Exception as e:
        return {"status": "error", "action": action, "detail": str(e)}


# ── Inventory CRUD (Firebase) ─────────────────────────────────────────────────
# Dipanggil langsung oleh frontend InventoryTrackerPage.tsx

@app.post("/db/inventory/add", dependencies=[Depends(verify_api_key)])
async def inventory_add(req: dict):
    """Tambah produk baru ke tabel inventory di Firebase."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    data = {
        "name":       str(req.get("name", "")),
        "sku":        str(req.get("sku", "")),
        "category":   str(req.get("category", "")),
        "quantity":   int(req.get("quantity", 0)),
        "min_stock":  int(req.get("min_stock", 5)),
        "max_stock":  int(req.get("max_stock", 100)),
        "warehouse":  str(req.get("warehouse", "Gudang Utama")),
        "photo_url":  str(req.get("photo_url", "")),
    }
    if not data["name"] or not data["sku"]:
        raise HTTPException(status_code=400, detail="Nama dan SKU wajib diisi")
    try:
        def _insert() -> None:
            db.collection("inventory").add(data)
        await asyncio.to_thread(_insert)
        return {"status": "ok", "action": "add", "sku": data["sku"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/inventory/update", dependencies=[Depends(verify_api_key)])
async def inventory_update(req: dict):
    """Update data produk berdasarkan doc_id (UUID Firebase)."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    doc_id = str(req.get("doc_id", ""))
    data   = req.get("data", {})
    if not doc_id or not data:
        raise HTTPException(status_code=400, detail="doc_id dan data wajib diisi")
    # Normalise: pastikan 'quantity' diset (bukan 'qty' dari seed lama)
    if "qty" in data and "quantity" not in data:
        data["quantity"] = data.pop("qty")
    try:
        def _update() -> None:
            db.collection("inventory").document(doc_id).update(data)
        await asyncio.to_thread(_update)
        return {"status": "ok", "action": "update", "id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/inventory/delete", dependencies=[Depends(verify_api_key)])
async def inventory_delete(req: dict):
    """Hapus produk dari inventory berdasarkan doc_id."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    doc_id = str(req.get("doc_id", ""))
    if not doc_id:
        raise HTTPException(status_code=400, detail="doc_id wajib diisi")
    try:
        def _delete() -> None:
            db.collection("inventory").document(doc_id).delete()
        await asyncio.to_thread(_delete)
        return {"status": "ok", "action": "delete", "id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/db/inventory/stock", dependencies=[Depends(verify_api_key)])
async def inventory_stock_add(req: dict):
    """Tambah stok produk (increment, bukan set). Dipakai oleh AI terminal restock."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    doc_id = str(req.get("doc_id", ""))
    amount = int(req.get("amount", 0))
    if not doc_id or amount <= 0:
        raise HTTPException(status_code=400, detail="doc_id dan amount (> 0) wajib diisi")
    try:
        def _increment() -> None:
            doc_ref = db.collection("inventory").document(doc_id)
            doc = doc_ref.get()
            if not doc.exists:
                raise ValueError(f"Produk {doc_id} tidak ditemukan")
            current_qty = int(doc.to_dict().get("quantity", 0))
            doc_ref.update({"quantity": current_qty + amount})
        await asyncio.to_thread(_increment)
        return {"status": "ok", "action": "stock_add", "id": doc_id, "added": amount}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Midtrans Snap Token ───────────────────────────────────────────────────────
# Dipanggil dari OrderPage.tsx untuk membuat transaksi pembayaran.

MIDTRANS_SERVER_KEY = os.getenv("MIDTRANS_SERVER_KEY", "")
MIDTRANS_ENV        = os.getenv("MIDTRANS_ENV", "sandbox")  # 'sandbox' atau 'production'

@app.post("/api/midtrans")
async def create_midtrans_token(req: dict):
    """
    Buat Snap token Midtrans untuk pembayaran dari frontend.
    Payload: { transaction_details: { order_id, gross_amount }, customer_details: { first_name, phone } }
    """
    if not MIDTRANS_SERVER_KEY:
        raise HTTPException(status_code=500, detail="MIDTRANS_SERVER_KEY belum dikonfigurasi di .env")

    tx  = req.get("transaction_details", {})
    cust = req.get("customer_details", {})

    if not tx.get("order_id") or not tx.get("gross_amount"):
        raise HTTPException(status_code=400, detail="transaction_details.order_id dan gross_amount wajib diisi")

    base_url = (
        "https://app.sandbox.midtrans.com/snap/v1"
        if MIDTRANS_ENV == "sandbox"
        else "https://app.midtrans.com/snap/v1"
    )

    import base64 as b64mod
    encoded_key = b64mod.b64encode(f"{MIDTRANS_SERVER_KEY}:".encode()).decode()

    payload = {
        "transaction_details": {
            "order_id":    str(tx["order_id"]),
            "gross_amount": int(tx["gross_amount"]),
        },
        "customer_details": {
            "first_name": str(cust.get("first_name", "Customer")),
            "phone":      str(cust.get("phone", "")),
        },
        "callbacks": {
            "finish": "https://fusion-neural.vercel.app/order?status=success",
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{base_url}/transactions",
                headers={
                    "Authorization": f"Basic {encoded_key}",
                    "Content-Type":  "application/json",
                },
                json=payload,
            )
        if r.status_code not in (200, 201):
            raise HTTPException(status_code=r.status_code, detail=f"Midtrans error: {r.text[:300]}")
        data = r.json()
        return {"token": data.get("token"), "redirect_url": data.get("redirect_url")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Midtrans connection error: {e}")


app.include_router(integrations_router, prefix="/api")

# ── Wire integrations logger (harus setelah app & router siap) ────────────────
integrations.external_logger = log_to_sheets

if __name__ == "__main__":
    import uvicorn
    # Menggunakan port 8001 untuk menghindari bentrok port 8000
    uvicorn.run(app, host="0.0.0.0", port=8001)
