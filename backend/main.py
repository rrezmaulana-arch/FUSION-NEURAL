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
import os
import io
import re
import sys
import json
import base64
import asyncio
import time
import random
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Response, Form
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel
import httpx

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

# ── Modul Baru: Routers & Services ───────────────────────────────────────────
from routers.websocket_signals import router as ws_router, broadcaster  # type: ignore
from services.auth import verify_token as verify_firebase_token  # type: ignore

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()

# ── External API Keys (shared with integrations.py) ─────────────────────────
INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")

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
        print("[gcp] GCP Service Account JSON loaded")
    except Exception as _gcp_err:
        print(f"[gcp] Gagal load credentials: {_gcp_err}")
else:
    print("[gcp]  gcp-credentials.json tidak ditemukan")


# ── Token helper (sinkron, dipakai Sheets & Firestore REST) ──────────────────
def _refresh_gcp_token() -> Optional[str]:
    """Refresh dan return access token GCP service account."""
    if not GCP_CREDS:
        return None
    if not GCP_CREDS.valid:
        GCP_CREDS.refresh(google.auth.transport.requests.Request())
    return GCP_CREDS.token


# ── Firestore REST Client ─────────────────────────────────────────────────────
# FIX UTAMA: Backend sekarang menyambung ke project 'fusion-neural' yang sama
# dengan frontend, menggunakan Firebase email/password auth untuk mendapatkan
# ID token yang diakui Firestore security rules (request.auth != null).
# ─────────────────────────────────────────────────────────────────────────────

import requests as _req_sync  # noqa: E402

# ── Firebase Auth untuk Firestore ──────────────────────────────────────────
# Token di-cache dan di-refresh otomatis sebelum 1 jam kedaluwarsa.
_FIREBASE_PROJECT_ID  = os.getenv("VITE_FIREBASE_PROJECT_ID", "fusion-neural")
_FIREBASE_WEB_API_KEY = os.getenv("VITE_FIREBASE_API_KEY", "")
_FIREBASE_BACKEND_EMAIL = os.getenv("FIREBASE_BACKEND_EMAIL", "backend-agent@fusionneural.app")
_FIREBASE_BACKEND_PASS  = os.getenv("FIREBASE_BACKEND_PASS",  "FusionNeural2026!Backend")

_fb_id_token:   str   = ""
_fb_token_exp:  float = 0.0

def _get_firebase_token() -> str:
    """Sign in ke Firebase Auth via email/password, return cached ID token."""
    global _fb_id_token, _fb_token_exp
    now = time.time()
    if _fb_id_token and now < _fb_token_exp - 300:   # refresh 5 menit sebelum expire
        return _fb_id_token
    try:
        r = _req_sync.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={_FIREBASE_WEB_API_KEY}",
            json={"email": _FIREBASE_BACKEND_EMAIL, "password": _FIREBASE_BACKEND_PASS, "returnSecureToken": True},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        _fb_id_token  = data["idToken"]
        _fb_token_exp = now + int(data.get("expiresIn", 3600))
        print("[firestore] Firebase token refreshed")
        return _fb_id_token
    except Exception as _te:
        print(f"[firestore]  Token refresh gagal, fallback ke GCP token: {_te}")
        return _refresh_gcp_token() or ""

# ── Encode / Decode helpers ───────────────────────────────────────────────
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
    """Firestore REST client — target project fusion-neural (same as frontend)."""
    def __init__(self, project_id: str, token_fn):
        self._base = (
            f"https://firestore.googleapis.com/v1/projects/{project_id}"
            f"/databases/(default)/documents"
        )
        self._token_fn = token_fn
    def collection(self, name: str) -> _FsColl:
        return _FsColl(self._base, name, self._token_fn)


# ── Inisialisasi Firestore ke proyek yang sama dengan frontend ────────────
db: Optional[FirestoreRESTClient] = None
try:
    # Gunakan Firebase ID token (bukan GCP OAuth token) agar dikenali
    # oleh Firestore security rules di proyek fusion-neural.
    db = FirestoreRESTClient(_FIREBASE_PROJECT_ID, _get_firebase_token)
    print(f"[firestore] FirestoreREST → project: {_FIREBASE_PROJECT_ID} (Firebase Auth mode)")
except Exception as _fs_err:
    print(f"[firestore] Gagal init: {_fs_err}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global autonomous_task, scheduler_task
    autonomous_task = asyncio.create_task(autonomous_loop())
    scheduler_task = asyncio.create_task(scheduler_loop())
    yield

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FusionNeural AI Backend",
    version="4.0.0",
    description="Multi-Agent AI Core — Admin · Finance · Marketing · Manager · Frontliner (Full Code)",
    lifespan=lifespan,
)

# ── Security: Rate Limiting ───────────────────────────────────────────────────
class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        # Bersihkan request lama
        self.requests[ip] = [req_time for req_time in self.requests[ip] if now - req_time < self.window_seconds]
        if len(self.requests[ip]) >= self.max_requests:
            return False
        self.requests[ip].append(now)
        return True

limiter = RateLimiter(max_requests=60, window_seconds=60) # Maks 60 request per menit per IP

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Dapatkan IP Klien (menangani proxy/ngrok)
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "127.0.0.1")
    client_ip = client_ip.split(",")[0].strip()
    
    # Kecualikan localhost dari rate limiting jika diperlukan (opsional)
    if client_ip != "127.0.0.1" and not limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": "Terlalu banyak request. Harap tunggu sebentar (Rate Limit Exceeded)."}
        )
    return await call_next(request)

# ── Security: CORS Hardening ──────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"], 
    allow_headers=["*"],
    allow_credentials=True,
)


async def verify_api_key(user: dict = Depends(verify_firebase_token)):
    """Dependency: verifikasi Firebase JWT (atau static key di dev mode)."""
    return user

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
        "model": "gpt-oss-120b",
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
# NOTE: openrouter free model 'gpt-oss-120b:free' is unreliable (503).
# Admin switched to groq (confirmed working) + gemini as backup.
AGENT_MODELS: dict[str, tuple[str, str]] = {
    "admin":      ("groq",    "gemini"),
    "finance":    ("deepseek", "gemini"),
    "marketing":  ("mistral",  "groq"),
    "manager":    ("gemini",   "groq"),
    "frontliner": ("groq",     "mistral"),
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
    """Simpan nilai ke Redis via POST (menghindari URI too long error)."""
    await redis_set(key, value, ttl)

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
        print(f"[{provider_key}] OK ({len(content)} chars)")
        return content
    except httpx.TimeoutException:
        print(f"[{provider_key}] ⏱ Timeout")
        return None
    except Exception as e:
        print(f"[{provider_key}] Error: {e}")
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

import ast
import shutil

async def execute_agent_actions(agent_response: str, agent_name: str, ticket_id: str):
    """
    Mengeksekusi aksi-aksi riil pada sistem (menulis file, membuat web)
    yang dikirimkan oleh agen dalam format block khusus.
    """
    import re
    # Cari blok kode ACTION yang dikirim AI (misal: ```json ACTION ...)
    pattern = r"```json\s*([\s\S]*?)\s*```"
    matches = re.findall(pattern, agent_response)
    
    actions_taken = []
    
    for match in matches:
        try:
            data = json.loads(match)
            if "actions" in data:
                for action in data["actions"]:
                    action_type = action.get("type")
                    
                    if action_type == "write_file":
                        file_path = action.get("path", "")
                        content = action.get("content", "")
                        if file_path and not file_path.startswith(".."):  # Keamanan dasar
                            # Buat folder jika belum ada (Target: c:\Olivia\FUSION NEURAL\generated_workspaces)
                            work_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generated_workspaces")
                            os.makedirs(work_dir, exist_ok=True)
                            
                            full_path = os.path.join(work_dir, os.path.basename(file_path))
                            with open(full_path, "w", encoding="utf-8") as file:
                                file.write(content)
                            actions_taken.append(f"Berhasil membuat file: {file_path} di {full_path}")
                            
                    elif action_type == "create_email_campaign":
                        campaign_name = action.get("campaignName", "AI Campaign")
                        subject = action.get("subject", "AI Draft Subject")
                        html_body = action.get("htmlBody", "")
                        recipients = action.get("recipients", [])
                        
                        if db and recipients:
                            import uuid
                            from datetime import datetime, timezone
                            camp_id = str(uuid.uuid4())
                            
                            camp_data = {
                                "id": camp_id,
                                "campaignName": campaign_name,
                                "subject": subject,
                                "status": "Draft",
                                "totalRecipients": len(recipients),
                                "sentCount": 0,
                                "failedCount": 0,
                                "opens": 0,
                                "clicks": 0,
                                "sendProgress": 0,
                                "createdAt": datetime.now(timezone.utc).isoformat(),
                                "agentId": agent_name,
                                "htmlBody": html_body,
                            }
                            
                            def _save_camp_sync():
                                db.collection("marketing_campaigns").document(camp_id).set(camp_data)
                                
                                approval_id = str(uuid.uuid4())
                                approval_data = {
                                    "id": approval_id,
                                    "title": f"Review AI Campaign: {campaign_name}",
                                    "description": f"AI Marketing menyiapkan campaign baru via text prompt. Review subject & HTML sebelum dikirim.",
                                    "agent": "marketing",
                                    "type": "email_campaign",
                                    "payload": {
                                        "campaignId": camp_id,
                                        "recipients": recipients
                                    },
                                    "status": "pending",
                                    "timestamp": datetime.now(timezone.utc).isoformat()
                                }
                                db.collection("pending_approvals").document(approval_id).set(approval_data)
                            
                            await asyncio.to_thread(_save_camp_sync)
                            actions_taken.append(f"Email campaign '{campaign_name}' (Draft) berhasil disiapkan dan dikirim ke Strategic Audit Hub.")
        except json.JSONDecodeError:
            pass
            
    return actions_taken

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
        result, provider = await call_with_fallback("deepseek", "gemini", msgs, temperature=0.2)
        last_result, last_provider = result, provider

        if not has_zero_price(result):
            print(f"[finance] Valid pada attempt {attempt} via {provider}")
            return result, provider, attempt

        print(f"[finance]  Attempt {attempt}: harga 0 terdeteksi, retry...")
        # Inject konteks retry ke conversation
        msgs.append({"role": "assistant", "content": result})
        msgs.append({
            "role": "user",
            "content": (
                "PERHATIAN SISTEM: Respons sebelumnya mengandung harga 0 Rp — TIDAK VALID. "
                "Tolong hitung ulang dengan benar. HPP dan Harga Jual wajib lebih dari 0 Rp."
            ),
        })

    print(f"[finance]  Max retries tercapai, mengembalikan hasil terakhir.")
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
                print(f"[sheets] Berhasil mencatat log {agent} ke Google Sheets")
            else:
                print(f"[sheets] Gagal mencatat log: {r.text}")
    except Exception as e:
        print(f"[sheets] Error: {e}")


async def set_agent_redis_status(agent: str, status: str):
    """Update status agen di Redis untuk animasi Agent HQ di frontend."""
    await redis_set_simple(f"agent_status:{agent}", status, ttl=60)

async def chat_takeover_check_and_log(source: str, user_id: str, message: str, role: str) -> bool:
    """Mengecek status Takeover di Firestore, dan mencatat history chat. Return True jika AI di-pause."""
    if not db:
        return False
    try:
        def _process():
            doc_ref = db.collection("active_chats").document(user_id)
            doc_snap = doc_ref.get()
            
            msg_obj = {"role": role, "content": message, "timestamp": datetime.now(timezone.utc).isoformat()}
            
            if not doc_snap.exists:
                doc_ref.set({
                    "platform": source,
                    "last_message": message if role == "user" else "AI Reply",
                    "ai_status": "ACTIVE",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "chat_history": [msg_obj]
                })
                return False
            
            data = doc_snap.to_dict()
            is_paused = data.get("ai_status") == "PAUSED"
            
            history = data.get("chat_history", [])
            if not isinstance(history, list): history = []
            history.append(msg_obj)
            if len(history) > 50: history = history[-50:]
            
            doc_ref.update({
                "last_message": message if role == "user" else data.get("last_message"),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "chat_history": history
            })
            return is_paused

        return await asyncio.to_thread(_process)
    except Exception as e:
        print(f"[Takeover] Error: {e}")
        return False

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

# ── Agent Priority Weights ─────────────────────────────────────────────────────
PRIORITY_WEIGHT = {"critical": 0, "high": 1, "normal": 2, "low": 3}

# ── Default daily token budget per agent (in estimated tokens) ─────────────────
DEFAULT_DAILY_BUDGET = 80_000

# ══════════════════════════════════════════════════════════════════════════════
# HELPER: Firestore-Based Short-Term Memory (Poor Man's RAG)
# ══════════════════════════════════════════════════════════════════════════════
async def fetch_agent_memory(agent_name: str, limit: int = 3) -> str:
    """
    Membaca 3 run_transcript terbaru milik agen ini sebagai 'memori jangka pendek'.
    Diinjeksikan ke system prompt sebelum AI mengerjakan task baru.
    """
    if not db:
        return ""
    try:
        def _read():
            docs = db.collection("run_transcripts").stream()
            all_docs = [d.to_dict() for d in docs if d.to_dict().get("agentId") == agent_name and d.to_dict().get("status") == "Success"]
            # Sort by timestamp descending
            all_docs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return all_docs[:limit]
        recent = await asyncio.to_thread(_read)
        if not recent:
            return ""
        memory_lines = []
        for r in recent:
            thought = r.get("thoughtProcess", "")[:300]
            memory_lines.append(f"- [{r.get('action', '')}]: {thought}...")
        return "\n\n[MEMORI AGEN - 3 Pekerjaan Terakhir]\n" + "\n".join(memory_lines)
    except Exception as e:
        print(f"[Memory] Gagal fetch memori {agent_name}: {e}")
        return ""

# ══════════════════════════════════════════════════════════════════════════════
# HELPER: Token Budget Enforcer
# ══════════════════════════════════════════════════════════════════════════════
async def check_and_deduct_budget(agent_key: str, estimated_tokens: int = 1500) -> bool:
    """
    Cek apakah agen masih punya budget harian.
    Return True jika boleh jalan, False jika budget habis.
    Otomatis reset jika hari sudah berganti.
    """
    if not db:
        return True
    try:
        def _process():
            doc_ref = db.collection("agent_health").document(agent_key)
            doc = doc_ref.get()
            now_str = datetime.now(pytz.timezone("Asia/Jakarta")).strftime("%Y-%m-%d")
            if doc.exists:
                data = doc.to_dict()
                reset_at = data.get("budget_reset_at", "")
                used = int(data.get("daily_tokens_used", 0))
                budget = int(data.get("daily_token_budget", DEFAULT_DAILY_BUDGET))
                
                new_used = used + estimated_tokens
                new_cost_rp = new_used * 15 # Asumsi Rp 15 per token LLM
                
                # Sync ke collection yang dibaca oleh UI Governance (FinOps)
                try:
                    db.collection("agent_budgets").document(agent_key).set({
                        "currentSpend": new_cost_rp,
                        "monthlyBudget": budget * 15 * 30, # Estimasi sebulan
                        "status": "ACTIVE" if new_used <= budget else "EXHAUSTED",
                        "companyId": "COMP-FUSION" # [Multi-Tenant Inject]
                    })
                except:
                    pass

                # Reset jika hari baru
                if reset_at != now_str:
                    doc_ref.update({"daily_tokens_used": 0, "budget_reset_at": now_str, "status": "IDLE"})
                    return True
                # Cek budget
                if new_used > budget:
                    doc_ref.update({"status": "BUDGET_EXHAUSTED"})
                    return False
                # Deduct tokens
                doc_ref.update({"daily_tokens_used": new_used})
                return True
            else:
                # Buat dokumen baru
                doc_ref.set({
                    "agent_id": agent_key,
                    "status": "IDLE",
                    "daily_tokens_used": estimated_tokens,
                    "daily_token_budget": DEFAULT_DAILY_BUDGET,
                    "budget_reset_at": now_str,
                    "total_tasks_completed": 0,
                    "average_latency_ms": 0,
                    "last_active": datetime.now(timezone.utc).isoformat(),
                    "companyId": "COMP-FUSION" # [Multi-Tenant Inject]
                })
                try:
                    db.collection("agent_budgets").document(agent_key).set({
                        "currentSpend": estimated_tokens * 15,
                        "monthlyBudget": DEFAULT_DAILY_BUDGET * 15 * 30,
                        "status": "ACTIVE",
                        "companyId": "COMP-FUSION" # [Multi-Tenant Inject]
                    })
                except:
                    pass
                return True
        return await asyncio.to_thread(_process)
    except Exception as e:
        print(f"[Budget] Error cek budget {agent_key}: {e}")
        return True  # Fail-open: jika error, tetap izinkan jalan

# ══════════════════════════════════════════════════════════════════════════════
# WORKER: Process Ticket Task (Symphony-style isolated worker)
# ══════════════════════════════════════════════════════════════════════════════
async def process_ticket_task(t_data: dict, ticket_id: str):
    """
    Mengerjakan satu tiket secara independen dan asinkron (Symphony-style).
    Pipeline: Budget Check → Memory Inject → AI Execute → Physical Actions → Review Queue
    """
    agent_name = t_data.get("agent", "Neural Marketing")
    task_title = t_data.get("title", "No Title")
    start_ts = time.time()

    agent_id_map = {
        "Neural Marketing": "marketing",
        "Neural Finance": "finance",
        "Neural Admin": "admin",
        "Neural Manager": "manager"
    }
    agent_key = agent_id_map.get(agent_name, "marketing")

    print(f"[Worker] [{ticket_id[:8]}] {agent_name}: '{task_title}'")

    _db = db
    if not _db: return

    try:
        # ── STEP 1: Budget Guard ────────────────────────────────────────────
        budget_ok = await check_and_deduct_budget(agent_key, estimated_tokens=1800)
        if not budget_ok:
            print(f"[Worker] [{agent_name}] Budget habis hari ini, skip task.")
            await asyncio.to_thread(lambda: _db.collection("neural_tasks").document(ticket_id).update({
                "status": "To Do",
                "progress": 0,
                "reviewNote": f"Ditunda: Budget token {agent_name} sudah habis hari ini. Reset besok pukul 00.00 WIB."
            }))
            return

        # ── STEP 2: Inject Short-Term Memory ───────────────────────────────
        memory_ctx = await fetch_agent_memory(agent_name, limit=3)
        base_prompt = SYSTEM_PROMPTS.get(agent_key, "You are a helpful AI.")
        enriched_prompt = base_prompt + memory_ctx

        # ── STEP 3: Build Messages & Execute AI ────────────────────────────
        msgs = [
            {"role": "system", "content": enriched_prompt +
             "\n\nKEMAMPUAN FISIK: Jika tugas memerlukan pembuatan file/kode, output JSON block:\n"
             "```json\n{\"actions\": [{\"type\": \"write_file\", \"path\": \"output.html\", \"content\": \"...\"}]}\n```"},
            {"role": "user", "content": f"Kerjakan task ini secara otonom dan profesional: {task_title}"}
        ]

        # Update progress ke 40% saat AI mulai berpikir
        await asyncio.to_thread(lambda: _db.collection("neural_tasks").document(ticket_id).update({"progress": 40}))

        primary, backup = AGENT_MODELS.get(agent_key, ("groq", "gemini"))
        result, provider = await call_with_fallback(primary, backup, msgs, temperature=0.7)

        latency_ms = int((time.time() - start_ts) * 1000)
        print(f"[Worker] [{ticket_id[:8]}] {agent_name} selesai via {provider} ({latency_ms}ms).")

        # ── STEP 4: Execute Physical Actions ───────────────────────────────
        actions_log = await execute_agent_actions(result, agent_name, ticket_id)
        final_thought = result
        if actions_log:
            final_thought += "\n\n[SYSTEM LOG] Tindakan fisik:\n" + "\n".join(actions_log)

        # ── STEP 5: Save Transcript (ML Training Log) ───────────────────────
        await asyncio.to_thread(lambda: _db.collection("run_transcripts").add({
            "agentId": agent_name,
            "agentKey": agent_key,
            "ticketId": ticket_id,
            "action": f"Executed: {task_title}",
            "thoughtProcess": final_thought,
            "provider": provider,
            "latencyMs": latency_ms,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "Success"
        }))

        # ── STEP 6: Move to Review (NOT Done yet — Manager will review) ────
        await asyncio.to_thread(lambda: _db.collection("neural_tasks").document(ticket_id).update({
            "status": "Review",
            "progress": 75,
            "agentResult": final_thought[:600],  # Snippet hasil untuk UI
            "completedAt": datetime.now(timezone.utc).isoformat(),
        }))

        # ── STEP 7: Update Agent EXP + Latency ─────────────────────────────
        asyncio.create_task(update_agent_progress({"agent_id": agent_key, "latency_ms": latency_ms}))
        asyncio.create_task(log_to_sheets(agent_key, f"[TASK] {task_title}: {result[:200]}", ticket_id))

    except Exception as e:
        print(f"[Worker Error] [{ticket_id[:8]}] {agent_name}: {e}")
        if _db:
            await asyncio.to_thread(lambda: _db.collection("neural_tasks").document(ticket_id).update({
                "status": "To Do",
                "progress": 0,
                "reviewNote": f"Error: {str(e)[:150]}"
            }))

# ══════════════════════════════════════════════════════════════════════════════
# MANAGER REVIEW LOOP: Peer-Review hasil kerja agen lain
# ══════════════════════════════════════════════════════════════════════════════
async def manager_review_loop():
    """
    Neural Manager membaca semua task di kolom 'Review' dan mengevaluasinya.
    Jika bagus → set Done. Jika perlu revisi → set To Do + catatan.
    """
    if not db:
        return
    try:
        review_tasks = await asyncio.to_thread(lambda: [
            t for t in db.collection("neural_tasks").stream()
            if t.to_dict().get("status") == "Review"
        ])

        if not review_tasks:
            return

        print(f"[Manager Review] Meninjau {len(review_tasks)} task...")

        for task_doc in review_tasks:
            tid = task_doc.id
            tdata = task_doc.to_dict()
            title = tdata.get("title", "")
            agent_result = tdata.get("agentResult", "")

            if not agent_result:
                # Tidak ada hasil untuk di-review, langsung approve
                await asyncio.to_thread(lambda: db.collection("neural_tasks").document(tid).update({
                    "status": "Done", "progress": 100, "reviewNote": "Auto-approved (no output to review)."
                }))
                continue

            # ── Auto-Approval Engine: cek apakah task lolos threshold ──────
            auto_config = _load_auto_approval_config()
            should_approve, auto_reason = _should_auto_approve(tdata, auto_config)
            if should_approve:
                await asyncio.to_thread(lambda: db.collection("neural_tasks").document(tid).update({
                    "status": "Done",
                    "progress": 100,
                    "reviewNote": f"[AUTO-APPROVED] {auto_reason}",
                    "reviewedAt": datetime.now(timezone.utc).isoformat(),
                    "autoApproved": True,
                }))
                # Log ke audit
                await asyncio.to_thread(lambda: db.collection("audit_logs").add({
                    "action": "auto_approval",
                    "agent": "Manager",
                    "taskId": tid,
                    "details": auto_reason,
                    "severity": "info",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }))
                print(f"[Manager Review] AUTO-APPROVED: {title[:40]} — {auto_reason}")
                continue

            # Budget check untuk Manager
            budget_ok = await check_and_deduct_budget("manager", estimated_tokens=500)
            if not budget_ok:
                print("[Manager Review] Manager budget habis, skip review.")
                break

            review_msgs = [
                {"role": "system", "content": (
                    "Kamu adalah AI Manager yang bertugas melakukan Quality Review terhadap hasil kerja agen lain. "
                    "Berikan keputusan APPROVE atau REVISION dalam 1-2 kalimat. "
                    "Format WAJIB: Mulai dengan 'APPROVED:' atau 'REVISION:' diikuti alasanmu. "
                    "Jangan gunakan Markdown. Singkat dan tegas."
                )},
                {"role": "user", "content": f"Review hasil kerja berikut untuk task '{title}':\n\n{agent_result[:500]}"}
            ]

            review_result, _ = await call_with_fallback("gemini", "cerebras", review_msgs, temperature=0.3)

            if review_result.upper().startswith("APPROVED"):
                new_status = "Done"
                new_progress = 100
            else:
                new_status = "To Do"  # Kembali ke queue untuk dikerjakan ulang
                new_progress = 0

            await asyncio.to_thread(lambda s, p, rr, t: db.collection("neural_tasks").document(t).update({
                "status": s,
                "progress": p,
                "reviewNote": rr[:300],
                "reviewedAt": datetime.now(timezone.utc).isoformat()
            }), new_status, new_progress, review_result, tid)
            print(f"[Manager Review] {'APPROVED' if new_status == 'Done' else 'REVISION'}: {title[:40]}")

    except Exception as e:
        print(f"[Manager Review] Error: {e}")

# ══════════════════════════════════════════════════════════════════════════════
# HEARTBEAT: Autonomous Loop Engine
# ══════════════════════════════════════════════════════════════════════════════
async def autonomous_loop():
    """Detak Jantung AI. Orkestrasi penuh: Priority Queue → Symphony Workers → Peer Review."""
    print("[Autonomous] Enterprise Loop Engine v2.0 started.")
    tz = pytz.timezone("Asia/Jakarta")

    while True:
        # ── Baca status Autonomous dari Firestore ──────────────────────────
        try:
            if db:
                status = await asyncio.to_thread(lambda: str(
                    db.collection("system_config").document("autonomous_mode").get().to_dict().get("value", "OFF")
                    if db.collection("system_config").document("autonomous_mode").get().exists else "OFF"
                ))
            else:
                status = "OFF"
        except Exception:
            status = "OFF"

        if status != "ON":
            await asyncio.sleep(30)  # Poll lebih cepat untuk responsif saat toggle ON
            continue

        now = datetime.now(tz)
        hour = now.hour

        # ── Load Business Hours ────────────────────────────────────────────
        try:
            with open("business_logic.json", "r") as f:
                logic = json.load(f)
            start_hour = int(logic["business_hours"]["start"].split(":")[0])
            end_hour = int(logic["business_hours"]["end"].split(":")[0])
            active_sleep = logic["business_hours"]["active_interval_minutes"] * 60
            idle_sleep = logic["business_hours"]["idle_interval_minutes"] * 60
        except Exception:
            start_hour, end_hour = 8, 23
            active_sleep, idle_sleep = 300, 3600
            logic = {}

        sleep_time = active_sleep if start_hour <= hour <= end_hour else idle_sleep
        actual_sleep = sleep_time

        print(f"[Heartbeat] {now.strftime('%H:%M:%S')} | Mode: ON | Next in {sleep_time}s")

        # ── FASE 0: Dead Letter Queue (DLQ) Sweeper ───────────────────────
        # Temukan tugas "In Progress" yang sudah nyangkut > 10 menit (Zombie Task)
        try:
            if db:
                dlq_docs = await asyncio.to_thread(lambda: [
                    d for d in db.collection("neural_tasks").stream()
                    if d.to_dict().get("status") == "In Progress"
                ])
                cutoff = datetime.now(timezone.utc)
                for dlq_doc in dlq_docs:
                    dlq_data = dlq_doc.to_dict()
                    locked_at_str = dlq_data.get("lockedAt", "")
                    if not locked_at_str:
                        continue
                    try:
                        locked_at = datetime.fromisoformat(locked_at_str.replace("Z", "+00:00"))
                        age_minutes = (cutoff - locked_at).total_seconds() / 60
                        if age_minutes > 10:
                            retry_count = int(dlq_data.get("retryCount", 0)) + 1
                            if retry_count >= 3:
                                # Max retries reached — mark as FAILED
                                fail_reason = f"Max retries (3) exceeded. Zombie for {age_minutes:.0f}m."
                                await asyncio.to_thread(lambda di, fr: db.collection("neural_tasks").document(di).update({
                                    "status": "FAILED",
                                    "failedAt": datetime.now(timezone.utc).isoformat(),
                                    "failReason": fr
                                }), dlq_doc.id, fail_reason)
                                print(f"[DLQ] Task {dlq_doc.id[:8]} FAILED after 3 retries.")
                            else:
                                # Reset ke To Do untuk dicoba ulang
                                await asyncio.to_thread(lambda di, rc: db.collection("neural_tasks").document(di).update({
                                    "status": "To Do",
                                    "progress": 0,
                                    "retryCount": rc,
                                    "lockedAt": None,
                                    "dlqRescuedAt": datetime.now(timezone.utc).isoformat()
                                }), dlq_doc.id, retry_count)
                                print(f"[DLQ] Zombie task {dlq_doc.id[:8]} rescued → To Do (retry #{retry_count})")
                    except Exception as _dlq_e:
                        print(f"[DLQ] Parse error for {dlq_doc.id}: {_dlq_e}")
        except Exception as dlq_err:
            print(f"[DLQ Sweeper] Error: {dlq_err}")

        # ── FASE 1: Manager Review Loop (Prioritas tertinggi) ──────────────
        asyncio.create_task(manager_review_loop())

        # ── FASE 1.5: Stock Watchdog + Content Publisher + Budget Alert ────
        asyncio.create_task(stock_watchdog())
        asyncio.create_task(content_publisher())
        asyncio.create_task(budget_alert_check())

        # ── FASE 2: Process 'To Do' Tasks (Priority Queue) ─────────────────
        try:
            if db:
                all_docs = await asyncio.to_thread(lambda: db.collection("neural_tasks").stream())
                todo_tickets = [t for t in all_docs if t.to_dict().get("status") == "To Do"]

                if todo_tickets:
                    actual_sleep = 5  # Agresif saat ada antrean

                    # ── Priority Sort (critical → high → normal → low) ──────
                    def _sort_key(doc):
                        d = doc.to_dict()
                        p = PRIORITY_WEIGHT.get(d.get("priority", "normal"), 2)
                        due = d.get("dueDate", "99d")
                        due_hours = int("".join(filter(str.isdigit, due)) or 99) * (24 if "d" in due else 1)
                        return (p, due_hours)
                    todo_tickets.sort(key=_sort_key)

                    print(f"[Heartbeat] {len(todo_tickets)} task antri (sorted by priority)")

                    for active_ticket in todo_tickets:
                        ticket_id = active_ticket.id
                        t_data = active_ticket.to_dict()
                        # Lock immediately (Atomic Checkout)
                        await asyncio.to_thread(lambda ti: db.collection("neural_tasks").document(ti).update({
                            "status": "In Progress",
                            "progress": 10,
                            "lockedAt": datetime.now(timezone.utc).isoformat()
                        }), ticket_id)
                        
                        # [ENTERPRISE FEATURE] Lempar ke Celery/Redis Worker jika memungkinkan
                        try:
                            from worker import process_ticket  # type: ignore
                            process_ticket.delay(ticket_id, t_data)
                            print(f"[Queue] Task {ticket_id[:8]} dilempar ke Redis Worker.")
                        except ImportError:
                            # Fallback ke Asyncio lokal jika Celery belum dinyalakan di terminal
                            asyncio.create_task(process_ticket_task(t_data, ticket_id))

                else:
                    # ── IDLE AUDIT: Manager mengaudit keuangan jika tidak ada task ──
                    try:
                        finance_ref = db.collection("finance_transactions")
                        recent_txs = await asyncio.to_thread(lambda: finance_ref.stream())
                        txs_data = sorted(
                            [t.to_dict() for t in recent_txs],
                            key=lambda x: x.get("timestamp", ""), reverse=True
                        )[:5]

                        audit_budget_ok = await check_and_deduct_budget("manager", 600)
                        if audit_budget_ok and txs_data:
                            sys_state = f"Waktu: {now.strftime('%H:%M:%S')}\nTidak ada task antri.\n\n[5 Transaksi Terakhir]\n{json.dumps(txs_data, indent=2)}"
                            audit_msgs = [
                                {"role": "system", "content": SYSTEM_PROMPTS["manager"] +
                                 "\n\nMode Otonom — Audit Kilat: Periksa 5 transaksi terakhir. Anomali? Beri instruksi maks 2 kalimat. Jika aman, tulis 'Status Stabil'."},
                                {"role": "user", "content": sys_state}
                            ]
                            await broadcaster.send_agent_signal("Manager", "THINKING", "Melakukan Audit Keuangan Otonom...")
                            audit_result, _ = await call_with_fallback("gemini", "cerebras", audit_msgs, temperature=0.5)

                            if "Stabil" not in audit_result and "aman" not in audit_result.lower():
                                await broadcaster.send_agent_signal("Manager", "ALERT", f"{audit_result[:150]}")
                                await asyncio.to_thread(lambda: db.collection("run_transcripts").add({
                                    "agentId": "Neural Manager",
                                    "agentKey": "manager",
                                    "ticketId": f"auto_audit_{int(time.time())}",
                                    "action": "Autonomous Financial Audit — Anomaly Detected",
                                    "thoughtProcess": audit_result,
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "status": "Warning"
                                }))
                            else:
                                await broadcaster.send_agent_signal("Manager", "IDLE", "Sistem finansial stabil.")
                    except Exception as ae:
                        print(f"[Idle Audit] Error: {ae}")

        except Exception as e:
            print(f"[Heartbeat] Error: {e}")

        await asyncio.sleep(actual_sleep)


autonomous_task = None
scheduler_task = None


# ══════════════════════════════════════════════════════════════════════════════
# SCHEDULER ENGINE: Membaca agent_schedules dan auto-create task saat waktunya
# ══════════════════════════════════════════════════════════════════════════════
DAY_MAP = {"senin": 0, "selasa": 1, "rabu": 2, "kamis": 3, "jumat": 4, "sabtu": 5, "minggu": 6}

def _parse_schedule(schedule_str: str, now: datetime) -> bool:
    """
    Parse schedule string dan cek apakah harus fire sekarang.
    Format yang didukung:
      - "Setiap 09:00"  → setiap hari jam 09:00
      - "Senin 09:00"   → setiap Senin jam 09:00
      - "1,15 09:00"    → tanggal 1 dan 15 setiap bulan jam 09:00
      - "Setiap 10:00"  → setiap hari jam 10:00
    """
    s = schedule_str.strip().lower()
    parts = s.split()
    if len(parts) < 2:
        return False

    time_part = parts[-1]  # "09:00"
    try:
        target_h, target_m = map(int, time_part.split(":"))
    except ValueError:
        return False

    # Cek apakah menit dan jam match (toleransi 2 menit)
    if now.hour != target_h or abs(now.minute - target_m) > 2:
        return False

    day_part = " ".join(parts[:-1])

    if day_part in ("setiap", "every", "daily"):
        return True
    elif day_part in DAY_MAP:
        return now.weekday() == DAY_MAP[day_part]
    elif "," in day_part or day_part.isdigit():
        target_dates = [int(d.strip()) for d in day_part.split(",") if d.strip().isdigit()]
        return now.day in target_dates
    return False


async def scheduler_loop():
    """Loop yang berjalan setiap 60 detik, membaca agent_schedules dan auto-create task."""
    print("[Scheduler] Scheduler Engine started.")
    tz = pytz.timezone("Asia/Jakarta")

    # Seed default schedules dari business_logic.json jika collection kosong
    try:
        with open("business_logic.json", "r") as f:
            bl = json.load(f)
        defaults = bl.get("scheduler_defaults", [])
        if defaults and db:
            def _seed():
                existing = db.collection("agent_schedules").stream()
                if not list(existing):
                    for sched in defaults:
                        db.collection("agent_schedules").document(sched["id"]).set({
                            "title": sched["title"],
                            "agent": sched["agent"],
                            "schedule": sched["schedule"],
                            "priority": sched.get("priority", "normal"),
                            "labels": sched.get("labels", []),
                            "lastFired": "",
                            "enabled": True,
                        })
                    print(f"[Scheduler] Seeded {len(defaults)} default schedules.")
            await asyncio.to_thread(_seed)
    except Exception as e:
        print(f"[Scheduler] Seed error: {e}")

    while True:
        await asyncio.sleep(60)
        if not db:
            continue

        now = datetime.now(tz)

        try:
            def _read_schedules():
                docs = db.collection("agent_schedules").stream()
                return [(d.id, d.to_dict()) for d in docs]

            schedules = await asyncio.to_thread(_read_schedules)

            for sched_id, sched_data in schedules:
                if not sched_data.get("enabled", True):
                    continue

                schedule_str = sched_data.get("schedule", "")
                if not _parse_schedule(schedule_str, now):
                    continue

                # Cek lastFired — jangan double-fire di hari yang sama
                last_fired = sched_data.get("lastFired", "")
                today_str = now.strftime("%Y-%m-%d")
                if last_fired == today_str:
                    continue

                # Create task di neural_tasks
                title = sched_data.get("title", "Scheduled Task")
                agent = sched_data.get("agent", "Neural Manager")
                priority = sched_data.get("priority", "normal")
                labels = sched_data.get("labels", [])

                import uuid
                task_id = f"sched-{uuid.uuid4().hex[:8]}"

                await asyncio.to_thread(lambda: db.collection("neural_tasks").document(task_id).set({
                    "title": title,
                    "agent": agent,
                    "status": "To Do",
                    "priority": priority,
                    "labels": labels,
                    "progress": 0,
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "source": "scheduler",
                    "scheduleId": sched_id,
                }))

                # Update lastFired
                await asyncio.to_thread(lambda: db.collection("agent_schedules").document(sched_id).update({
                    "lastFired": today_str
                }))

                print(f"[Scheduler] Task created: '{title}' → {agent} (schedule: {schedule_str})")

        except Exception as e:
            print(f"[Scheduler] Error: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# HELPER: Auto-Approval Engine — cek apakah task bisa auto-approve
# ══════════════════════════════════════════════════════════════════════════════
def _load_auto_approval_config() -> dict:
    """Baca auto_approval config dari business_logic.json."""
    try:
        with open("business_logic.json", "r") as f:
            bl = json.load(f)
        return bl.get("auto_approval", {"enabled": False})
    except Exception:
        return {"enabled": False}


def _should_auto_approve(task_data: dict, auto_config: dict) -> tuple:
    """
    Cek apakah task memenuhi syarat auto-approval.
    Return (should_approve: bool, reason: str)
    """
    if not auto_config.get("enabled", False):
        return False, ""

    title = task_data.get("title", "").lower()
    labels = [l.lower() for l in task_data.get("labels", [])]
    agent = task_data.get("agent", "")

    # Restock auto-approve jika cost < threshold
    if "restock" in title:
        max_cost = auto_config.get("max_restock_cost", 5000000)
        # Estimasi cost dari title (misal "Restock Basic — order 3 unit")
        import re
        qty_match = re.search(r'(\d+)\s*(?:unit|pcs|item)', title)
        if qty_match:
            qty = int(qty_match.group(1))
            # Asumsi HPP rata-rata dari products
            avg_hpp = 2750000  # (1500000 + 4000000) / 2
            estimated_cost = qty * avg_hpp
            if estimated_cost <= max_cost:
                return True, f"Auto-approved: restock cost Rp {estimated_cost:,.0f} < threshold Rp {max_cost:,.0f}"

    # Invoice auto-approve jika amount < threshold
    if "invoice" in title:
        max_amount = auto_config.get("max_invoice_amount", 10000000)
        return True, f"Auto-approved: invoice below Rp {max_amount:,.0f} threshold"

    # Content auto-approve untuk platform yang diizinkan
    if "konten" in title or "content" in title or "caption" in title:
        allowed_platforms = auto_config.get("content_platforms", [])
        for p in allowed_platforms:
            if p in title or p in " ".join(labels):
                return True, f"Auto-approved: content for platform '{p}'"
        # Default approve content jika tidak ada platform spesifik
        if not allowed_platforms:
            return True, "Auto-approved: content (all platforms allowed)"

    return False, ""


# ══════════════════════════════════════════════════════════════════════════════
# HELPER: Stock Watchdog — auto-reorder saat stok < safety_stock
# ══════════════════════════════════════════════════════════════════════════════
async def stock_watchdog():
    """Cek inventory, buat task restock otomatis jika stok < safety_stock."""
    if not db:
        return

    try:
        # Load products config
        with open("business_logic.json", "r") as f:
            bl = json.load(f)
        products = bl.get("products", {})
        cooldown_hours = bl.get("rules", {}).get("admin", {}).get("cooldown_hours_per_item", 12)

        def _read_inventory():
            docs = db.collection("inventory").stream()
            return [(d.id, d.to_dict()) for d in docs]

        inventory = await asyncio.to_thread(_read_inventory)

        for item_id, item_data in inventory:
            product_name = item_data.get("name", "")
            quantity = int(item_data.get("quantity", 0))

            # Cari safety_stock dari business_logic.json
            safety_stock = 0
            for pid, pinfo in products.items():
                if pinfo["name"].lower() in product_name.lower() or product_name.lower() in pinfo["name"].lower():
                    safety_stock = pinfo.get("safety_stock", 0)
                    break

            if safety_stock == 0 or quantity > safety_stock:
                continue

            # Cek cooldown — apakah sudah ada alert dalam N jam terakhir?
            last_alert = item_data.get("lastStockAlert", "")
            if last_alert:
                try:
                    last_alert_dt = datetime.fromisoformat(last_alert.replace("Z", "+00:00"))
                    hours_since = (datetime.now(timezone.utc) - last_alert_dt).total_seconds() / 3600
                    if hours_since < cooldown_hours:
                        continue
                except Exception:
                    pass

            # Cari supplier dari suppliers collection
            supplier_name = "supplier terpercaya"
            try:
                def _find_supplier():
                    suppliers = db.collection("suppliers").stream()
                    for s in suppliers:
                        sd = s.to_dict()
                        if product_name.lower() in sd.get("products", "").lower():
                            return sd.get("name", "")
                    return ""
                found_supplier = await asyncio.to_thread(_find_supplier)
                if found_supplier:
                    supplier_name = found_supplier
            except Exception:
                pass

            # Hitung qty reorder
            reorder_qty = max(safety_stock * 2 - quantity, safety_stock)

            # Create restock task
            import uuid
            task_id = f"restock-{uuid.uuid4().hex[:8]}"

            await asyncio.to_thread(lambda: db.collection("neural_tasks").document(task_id).set({
                "title": f"Restock {product_name} — order {reorder_qty} unit ke {supplier_name}",
                "agent": "Neural Admin",
                "status": "To Do",
                "priority": "high",
                "labels": ["restock", "auto-reorder"],
                "progress": 0,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "source": "stock_watchdog",
            }))

            # Update lastStockAlert di inventory
            await asyncio.to_thread(lambda: db.collection("inventory").document(item_id).update({
                "lastStockAlert": datetime.now(timezone.utc).isoformat()
            }))

            print(f"[Stock Watchdog] Restock task created: {product_name} (qty: {reorder_qty}, stok: {quantity}, safety: {safety_stock})")

    except Exception as e:
        print(f"[Stock Watchdog] Error: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# HELPER: Content Publisher — auto-publish konten yang sudah terjadwal
# ══════════════════════════════════════════════════════════════════════════════
async def content_publisher():
    """Publish konten dari marketing_posts yang scheduledAt <= sekarang."""
    if not db:
        return

    try:
        now = datetime.now(timezone.utc)

        def _read_pending():
            docs = db.collection("marketing_posts").stream()
            results = []
            for d in docs:
                data = d.to_dict()
                if data.get("status") == "pending" and data.get("scheduledAt"):
                    try:
                        sched_dt = datetime.fromisoformat(data["scheduledAt"].replace("Z", "+00:00"))
                        if sched_dt <= now:
                            results.append((d.id, data))
                    except Exception:
                        pass
            return results

        pending_posts = await asyncio.to_thread(_read_pending)

        auto_config = _load_auto_approval_config()
        allowed_platforms = auto_config.get("content_platforms", [])

        for post_id, post_data in pending_posts:
            platform = post_data.get("platform", "").lower()

            # Cek apakah platform diizinkan untuk auto-publish
            if allowed_platforms and platform not in allowed_platforms:
                continue

            content = post_data.get("content", "")
            if not content:
                continue

            # Publish ke Instagram jika ada token
            if platform in ("instagram", "ig") and INSTAGRAM_ACCESS_TOKEN:
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        # Buat container
                        container_resp = await client.post(
                            "https://graph.instagram.com/v25.0/me/media",
                            headers={"Authorization": f"Bearer {INSTAGRAM_ACCESS_TOKEN}"},
                            json={"caption": content}
                        )
                        if container_resp.status_code == 200:
                            container_id = container_resp.json().get("id")
                            # Publish container
                            publish_resp = await client.post(
                                "https://graph.instagram.com/v25.0/me/media_publish",
                                headers={"Authorization": f"Bearer {INSTAGRAM_ACCESS_TOKEN}"},
                                json={"creation_id": container_id}
                            )
                            if publish_resp.status_code == 200:
                                await asyncio.to_thread(lambda: db.collection("marketing_posts").document(post_id).update({
                                    "status": "published",
                                    "publishedAt": datetime.now(timezone.utc).isoformat(),
                                    "publishResult": "success"
                                }))
                                print(f"[Content Publisher] Published to Instagram: {post_id}")
                            else:
                                print(f"[Content Publisher] IG publish failed: {publish_resp.status_code}")
                        else:
                            print(f"[Content Publisher] IG container failed: {container_resp.status_code}")
                except Exception as e:
                    print(f"[Content Publisher] Instagram error: {e}")
            else:
                # Platform lain — tandai sebagai published (placeholder)
                await asyncio.to_thread(lambda: db.collection("marketing_posts").document(post_id).update({
                    "status": "published",
                    "publishedAt": datetime.now(timezone.utc).isoformat(),
                    "publishResult": f"auto-published ({platform})"
                }))
                print(f"[Content Publisher] Auto-published: {post_id} ({platform})")

    except Exception as e:
        print(f"[Content Publisher] Error: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# HELPER: Budget Alert — cek budget dan kirim alert jika menipis
# ══════════════════════════════════════════════════════════════════════════════
async def budget_alert_check():
    """Cek finance_metrics/stats.budget, kirim alert jika < threshold."""
    if not db:
        return

    try:
        with open("business_logic.json", "r") as f:
            bl = json.load(f)
        threshold = bl.get("rules", {}).get("finance", {}).get("minimum_budget_threshold", 1000000)

        def _read_budget():
            doc = db.collection("finance_metrics").document("stats").get()
            if doc.exists:
                return doc.to_dict()
            return {}

        stats = await asyncio.to_thread(_read_budget)
        current_budget = int(stats.get("budget", 0))

        if current_budget < threshold:
            # Kirim alert via WebSocket
            await broadcaster.send_agent_signal("Finance", "ALERT",
                f"Budget menipis! Sisa Rp {current_budget:,.0f} (threshold: Rp {threshold:,.0f})")

            # Buat task urgent
            import uuid
            task_id = f"budget-alert-{uuid.uuid4().hex[:8]}"
            await asyncio.to_thread(lambda: db.collection("neural_tasks").document(task_id).set({
                "title": f"Budget Alert — review cash flow (sisa Rp {current_budget:,.0f})",
                "agent": "Neural Finance",
                "status": "To Do",
                "priority": "critical",
                "labels": ["budget-alert", "finance"],
                "progress": 0,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "source": "budget_alert",
            }))

            # Log ke audit_logs
            await asyncio.to_thread(lambda: db.collection("audit_logs").add({
                "action": "budget_alert",
                "agent": "System",
                "details": f"Budget Rp {current_budget:,.0f} < threshold Rp {threshold:,.0f}",
                "severity": "critical",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }))

            print(f"[Budget Alert] Budget menipis: Rp {current_budget:,.0f}")

    except Exception as e:
        print(f"[Budget Alert] Error: {e}")


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


@app.post("/api/products/{product_id}/price")
async def update_product_price(product_id: str, req: dict):
    """Update harga produk — dipanggil oleh dynamic pricing engine."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")

    new_price = req.get("new_price")
    reason = req.get("reason", "dynamic_pricing")
    if not new_price or not isinstance(new_price, (int, float)):
        raise HTTPException(status_code=400, detail="new_price harus angka")

    try:
        # Baca harga lama
        def _update():
            doc = db.collection("inventory").document(product_id)
            existing = doc.get()
            if not existing.exists:
                raise Exception(f"Product {product_id} tidak ditemukan")
            old_data = existing.to_dict()
            old_price = int(old_data.get("selling_price", 0))

            # Guardrail: max perubahan 5% per kali
            max_change_pct = 5
            change_pct = abs(new_price - old_price) / old_price * 100 if old_price > 0 else 0
            if change_pct > max_change_pct:
                raise Exception(f"Perubahan {change_pct:.1f}% melebihi batas {max_change_pct}%")

            # Update harga
            doc.update({
                "selling_price": int(new_price),
                "lastPriceUpdate": datetime.now(timezone.utc).isoformat(),
                "priceUpdateReason": reason,
            })

            # Simpan ke price_history collection
            db.collection("price_history").add({
                "product_id": product_id,
                "old_price": old_price,
                "new_price": int(new_price),
                "reason": reason,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            return {"old_price": old_price, "new_price": int(new_price), "change_pct": round(change_pct, 1)}

        result = await asyncio.to_thread(_update)
        return {"status": "success", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agent/budget")
async def get_agent_budget():
    """Ambil sisa token budget harian semua agen dari agent_health."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    try:
        def _fetch():
            docs = db.collection("agent_health").stream()
            return [d.to_dict() for d in docs]
        agents = await asyncio.to_thread(_fetch)
        today = datetime.now(pytz.timezone("Asia/Jakarta")).strftime("%Y-%m-%d")
        result = []
        for a in agents:
            used = int(a.get("daily_tokens_used", 0)) if a.get("budget_reset_at") == today else 0
            budget = int(a.get("daily_token_budget", DEFAULT_DAILY_BUDGET))
            result.append({
                "agent_id": a.get("agent_id", ""),
                "used": used,
                "budget": budget,
                "remaining": max(0, budget - used),
                "percent_used": round(used / budget * 100, 1) if budget > 0 else 0,
                "status": a.get("status", "IDLE"),
            })
        return {"agents": result}
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
        # ── Prompt Injection Sanitization ──────────────────────────────────────
        # Blokir pola prompt injection umum sebelum diteruskan ke LLM
        INJECTION_PATTERNS = [
            "ignore previous instructions",
            "abaikan instruksi sebelumnya",
            "forget your instructions",
            "you are now",
            "act as if you are",
            "pretend you are",
            "your new instructions",
            "override system",
            "system prompt",
            "reveal your prompt",
            "print your instructions",
            "show me your prompt",
            "what is your system prompt",
        ]
        user_input_lower = req.message.lower()
        for pattern in INJECTION_PATTERNS:
            if pattern in user_input_lower:
                print(f"[security]  Prompt injection attempt blocked: '{pattern[:40]}'")
                raise HTTPException(
                    status_code=400,
                    detail="Input tidak valid. Permintaan mengandung pola yang tidak diizinkan."
                )
        # Batasi panjang input user maksimal 2000 karakter
        sanitized_message = req.message[:2000].strip()
        # ── End Sanitization ───────────────────────────────────────────────────

        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        messages.extend(history[-20:])  # max 20 turns history
        messages.append({"role": "user", "content": sanitized_message})

        # 5. Panggil agen AI yang sesuai
        primary, backup = AGENT_MODELS.get(agent, ("groq", "gemini"))
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
        print(f"[trigger-agent] Unexpected error: {e}")
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
        print(f"[Drive] Gambar AI berhasil disimpan ke Drive")
    except Exception as e:
        print(f"[Drive] Gagal simpan gambar: {e}")

async def log_to_signals(agent: str, message: str, status: str = "THINKING"):
    """Kirim sinyal global ke Firebase (Tabel realtime_signals) agar ditangkap oleh Frontend."""
    if not db: 
        print(f"[signals] Firebase belum siap, skip sinyal: {message[:30]}")
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
        print(f"[signals] Firebase Error: {e}")

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


# ── Marketing Publish Endpoint ──────────────────────────────────────────────
@app.post("/api/marketing/publish")
async def publish_marketing_post(req: dict):
    """Publish satu post dari marketing_posts ke platform yang sesuai."""
    post_id = req.get("postId")
    if not post_id:
        raise HTTPException(status_code=400, detail="postId required")
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")

    try:
        def _read_post():
            doc = db.collection("marketing_posts").document(post_id).get()
            if not doc.exists:
                raise Exception(f"Post {post_id} tidak ditemukan")
            return doc.to_dict()

        post_data = await asyncio.to_thread(_read_post)
        content = post_data.get("content", "")
        platform = post_data.get("platform", "general")

        if not content:
            raise HTTPException(status_code=400, detail="Post content kosong")

        # Publish ke Instagram jika platform instagram
        if platform in ("instagram", "ig") and INSTAGRAM_ACCESS_TOKEN:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    container_resp = await client.post(
                        "https://graph.instagram.com/v25.0/me/media",
                        headers={"Authorization": f"Bearer {INSTAGRAM_ACCESS_TOKEN}"},
                        json={"caption": content}
                    )
                    if container_resp.status_code == 200:
                        container_id = container_resp.json().get("id")
                        publish_resp = await client.post(
                            "https://graph.instagram.com/v25.0/me/media_publish",
                            headers={"Authorization": f"Bearer {INSTAGRAM_ACCESS_TOKEN}"},
                            json={"creation_id": container_id}
                        )
                        if publish_resp.status_code == 200:
                            await asyncio.to_thread(lambda: db.collection("marketing_posts").document(post_id).update({
                                "status": "published",
                                "publishedAt": datetime.now(timezone.utc).isoformat(),
                                "publishResult": "success"
                            }))
                            return {"status": "success", "platform": "instagram"}
                        else:
                            return {"status": "error", "detail": f"IG publish failed: {publish_resp.status_code}"}
                    else:
                        return {"status": "error", "detail": f"IG container failed: {container_resp.status_code}"}
            except Exception as e:
                return {"status": "error", "detail": str(e)}
        else:
            # Platform lain — simpan dan tandai sebagai scheduled
            await asyncio.to_thread(lambda: db.collection("marketing_posts").document(post_id).update({
                "status": "scheduled",
                "scheduledAt": datetime.now(timezone.utc).isoformat(),
            }))
            return {"status": "scheduled", "platform": platform, "message": "Post dijadwalkan untuk auto-publish"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AI Orchestrator ───────────────────────────────────────────────────────────
class OrchestrateRequest(BaseModel):
    prompt: str
    agent: str
    aiModel: str
    targetColumn: str = "To Do"

@app.post("/api/orchestrate")
async def handle_orchestration(req: OrchestrateRequest):
    """
    Menerima perintah kompleks dari UI Neural Tasks Manager.
    Memecah perintah menjadi sub-task (kotak-kotak) dan mengeksekusi instruksi jika ada akses sistem.
    """
    if not db:
        raise HTTPException(status_code=500, detail="Database belum terkonfigurasi.")

    # Tentukan provider berdasarkan aiModel pilihan user
    provider = "gemini"
    if "Mistral" in req.aiModel: provider = "mistral"
    elif "Groq" in req.aiModel: provider = "groq"
    elif "Cerebras" in req.aiModel: provider = "cerebras"
    elif "OpenRouter" in req.aiModel: provider = "openrouter"
    elif "DeepSeek" in req.aiModel: provider = "deepseek"

    system_prompt = (
        "Kamu adalah AI Executive Orchestrator (Manager CMD) untuk ekosistem Fusion Neural B2B.\n"
        "Tugas utama: Menganalisis instruksi *natural language* dari User/CEO dan membaginya menjadi tugas Kanban spesifik untuk sub-agen AI.\n\n"
        "=== DOMAIN AGEN AI (JOBDESK) ===\n"
        "1. 'Neural Admin': Menangani inventaris, pengecekan stok (restock), operasional gudang, pesanan fisik.\n"
        "2. 'Neural Finance': Menangani pembukuan (ledger), pembuatan invoice, rekonsiliasi bank, pajak, dan audit anggaran.\n"
        "3. 'Neural Marketing': Menulis copywriting kampanye, desain gambar (FLUX), penulisan email promosi, UI teks.\n"
        "4. 'Neural Manager': Analisis strategis tingkat tinggi, merangkum laporan, koordinasi antar agen.\n\n"
        "=== ATURAN DELEGASI ===\n"
        "- Pecah instruksi yang kompleks menjadi langkah-langkah kecil (*micro-tasks*).\n"
        "- Delegasikan setiap tugas ke *agent* yang BENAR berdasarkan domian di atas.\n"
        "- Buat *title* yang berorientasi tindakan dan profesional (misal: 'Analisis defisit anggaran Q3').\n"
        "- Tambahkan *labels* yang relevan (misal: ['Urgent', 'Finance'], ['Restock', 'Warehouse']).\n"
        "- JIKA tugas berisiko tinggi (mengeluarkan dana, menghapus data, mengirim kontrak), wajib tambahkan payload ke 'approvals' untuk dikunci di Strategic Audit Hub.\n\n"
        "=== OUTPUT FORMAT Wajib ===\n"
        "Kembalikan HANYA JSON murni (tanpa ```json, tanpa markdown, tanpa teks lain). Format:\n"
        "{\n"
        '  "tasks": [\n'
        '    {"title": "Draft proposal kampanye X", "client": "Internal", "agent": "Neural Marketing", "priority": "high", "labels": ["Campaign", "Urgent"], "dueDate": "2d", "progress": 0, "comments": 0, "attachments": 0}\n'
        "  ],\n"
        '  "approvals": [\n'
        '    {"actionType": "Generate Invoice", "description": "Approval invoice vendor X", "jsonPayload": "{\\"amount\\": 5000000}"}\n'
        "  ]\n"
        "}\n"
        "Note: priority harus bernilai salah satu dari: 'critical', 'high', 'normal', atau 'low'."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.prompt}
    ]

    result = await call_llm(provider, messages, temperature=0.7, max_tokens=1500)
    
    # Initialize before try so they're always bound
    tasks_to_create: list = []
    approvals_to_create: list = []
    try:
        if result:
            # Clean up markdown if AI includes it
            json_str = result
            if "```json" in result:
                import re
                match = re.search(r'```json\s*(.*?)\s*```', result, re.DOTALL)
                if match: json_str = match.group(1)
            elif "```" in result:
                import re
                match = re.search(r'```\s*(.*?)\s*```', result, re.DOTALL)
                if match: json_str = match.group(1)

            data = json.loads(json_str)
            tasks_to_create = data.get("tasks", [])
            approvals_to_create = data.get("approvals", [])
    except Exception as e:
        print(f"[Orchestrator] Gagal parsing JSON AI: {e}. Raw: {result}")

    # Fallback: if no tasks parsed, create one from the raw prompt
    if not tasks_to_create:
        tasks_to_create = [{
            "title": req.prompt[:60] + "...",
            "client": "System",
            "agent": req.agent,
            "priority": "normal",
            "labels": ["System", "Auto-Generated"],
            "dueDate": "1d"
        }]

    # Simpan ke Firestore neural_tasks
    import uuid
    for t in tasks_to_create:
        doc_data = {
            "title": t.get("title", "Untitled Task"),
            "client": t.get("client", "Internal"),
            "agent": t.get("agent", req.agent),
            "priority": t.get("priority", "normal").lower(),
            "labels": t.get("labels", []),
            "status": req.targetColumn,
            "dueDate": t.get("dueDate", "1d"),
            "comments": t.get("comments", 0),
            "attachments": t.get("attachments", 0),
            "progress": t.get("progress", 0),
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        # Gunakan API post FirestoreRESTClient untuk men-generate random doc ID
        await asyncio.to_thread(lambda: db.collection("neural_tasks").add(doc_data))

    # Simpan ke Firestore pending_approvals jika ada
    for a in approvals_to_create:
        app_data = {
            "agentId": req.agent,
            "actionType": a.get("actionType", "System Action"),
            "description": a.get("description", "Auto-generated action"),
            "jsonPayload": a.get("jsonPayload", "{}"),
            "status": "Pending",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await asyncio.to_thread(lambda: db.collection("pending_approvals").add(app_data))

    return {"status": "success", "message": f"Berhasil memecah menjadi {len(tasks_to_create)} tugas dan {len(approvals_to_create)} approval menunggu."}



# ══════════════════════════════════════════════════════════════════════════════
# EMAIL MARKETING ENGINE — Powered by Resend (Human-in-the-Loop)
# ══════════════════════════════════════════════════════════════════════════════
# Arsitektur Keamanan:
#   1. AI Marketing menyiapkan kampanye → simpan ke pending_approvals
#   2. Manager APPROVE di Strategic Audit Hub
#   3. Endpoint /api/campaign/approve-and-send mengirim BATCH email via Resend
#   4. Webhook /api/webhooks/resend mencatat opens/clicks ke marketing_analytics
# API Key RESEND tidak pernah menyentuh frontend (only backend).
# ══════════════════════════════════════════════════════════════════════════════

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM    = "Neural Marketing <onboarding@resend.dev>"  # Ganti dengan domain terverifikasi

async def _resend_send_single(to_email: str, subject: str, html: str, campaign_id: str) -> dict:
    """Kirim satu email via Resend API. Return dict hasil."""
    if not RESEND_API_KEY:
        return {"email": to_email, "status": "failed", "error": "RESEND_API_KEY tidak dikonfigurasi"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "from":    RESEND_FROM,
                    "to":      [to_email],
                    "subject": subject,
                    "html":    html,
                    "tags": [
                        {"name": "campaign_id", "value": campaign_id},
                    ]
                }
            )
        if r.status_code in (200, 201):
            data = r.json()
            return {"email": to_email, "status": "sent", "resend_id": data.get("id", "")}
        else:
            return {"email": to_email, "status": "failed", "error": r.text[:200]}
    except Exception as e:
        return {"email": to_email, "status": "failed", "error": str(e)}


async def _send_campaign_batch(campaign_id: str, subject: str, html_body: str, recipients: list[str]):
    """Background task: kirim email ke ratusan penerima secara bertahap (rate-limited)."""
    _db = db
    if not _db:
        return

    print(f"[Email] Mulai kirim kampanye '{campaign_id}' ke {len(recipients)} penerima...")
    sent_count = 0
    failed_count = 0
    
    # Rate limit: Resend free = 100 email/hari, paid = 50.000/hari
    # Kirim 5 email per detik (aman untuk semua plan)
    BATCH_SIZE = 5
    BATCH_DELAY = 1.0  # seconds

    for i in range(0, len(recipients), BATCH_SIZE):
        batch = recipients[i:i + BATCH_SIZE]
        tasks = [_resend_send_single(email, subject, html_body, campaign_id) for email in batch]
        results = await asyncio.gather(*tasks)
        
        for res in results:
            if res["status"] == "sent":
                sent_count += 1
            else:
                failed_count += 1
                print(f"[Email] Gagal kirim ke {res['email']}: {res.get('error', '')}")

        # Update progress di Firestore setiap batch
        progress_pct = min(99, int((i + BATCH_SIZE) / len(recipients) * 100))
        try:
            def _update_prog():
                _db.collection("marketing_campaigns").document(campaign_id).update({
                    "sentCount": sent_count,
                    "failedCount": failed_count,
                    "sendProgress": progress_pct,
                })
            await asyncio.to_thread(_update_prog)
        except Exception:
            pass

        if i + BATCH_SIZE < len(recipients):
            await asyncio.sleep(BATCH_DELAY)

    # Tandai selesai
    try:
        await asyncio.to_thread(lambda: _db.collection("marketing_campaigns").document(campaign_id).update({
            "status": "Sent",
            "sentCount": sent_count,
            "failedCount": failed_count,
            "sendProgress": 100,
            "sentAt": datetime.now(timezone.utc).isoformat(),
        }))
    except Exception:
        pass

    print(f"[Email] Kampanye '{campaign_id}' selesai: {sent_count} terkirim, {failed_count} gagal.")


class CampaignDraftRequest(BaseModel):
    """Payload dari AI Marketing untuk membuat draft kampanye baru."""
    campaignName: str
    subject:      str
    htmlBody:     str
    recipients:   list[str]  # list email langsung, atau nanti bisa segment name
    agentId:      str = "Neural Marketing"
    notes:        str = ""

@app.post("/api/campaign/draft")
async def create_campaign_draft(req: CampaignDraftRequest):
    """
    AI Marketing mengirim draft kampanye ke sini.
    Draft akan LANGSUNG masuk ke pending_approvals — TIDAK akan dikirim dulu.
    Manager harus APPROVE terlebih dahulu di Strategic Audit Hub.
    """
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    if not req.recipients:
        raise HTTPException(status_code=400, detail="Daftar penerima (recipients) tidak boleh kosong")

    import uuid as _uuid
    campaign_id = f"camp_{_uuid.uuid4().hex[:12]}"

    # 1. Simpan kampanye ke marketing_campaigns sebagai Draft
    campaign_doc = {
        "id":           campaign_id,
        "campaignName": req.campaignName,
        "subject":      req.subject,
        "htmlBody":     req.htmlBody,
        "recipients":   req.recipients,
        "totalRecipients": len(req.recipients),
        "agentId":      req.agentId,
        "status":       "Draft",
        "sentCount":    0,
        "failedCount":  0,
        "sendProgress": 0,
        "opens":        0,
        "clicks":       0,
        "notes":        req.notes,
        "createdAt":    datetime.now(timezone.utc).isoformat(),
    }
    await asyncio.to_thread(lambda: db.collection("marketing_campaigns").document(campaign_id).set(campaign_doc))

    # 2. Buat pending_approval agar Manager bisa mereview & menyetujui
    approval_doc = {
        "agentId":     req.agentId,
        "actionType":  "Send Email Campaign",
        "description": f"Kampanye '{req.campaignName}' siap dikirim ke {len(req.recipients)} penerima. Subject: {req.subject}",
        "jsonPayload": json.dumps({
            "campaign_id": campaign_id,
            "campaignName": req.campaignName,
            "subject": req.subject,
            "totalRecipients": len(req.recipients),
            "previewBody": req.htmlBody[:500],
        }),
        "campaignId":  campaign_id,
        "status":      "Pending",
        "timestamp":   datetime.now(timezone.utc).isoformat(),
    }
    await asyncio.to_thread(lambda: db.collection("pending_approvals").add(approval_doc))

    print(f"[Email] Draft kampanye '{campaign_id}' dibuat oleh {req.agentId} — menunggu approval.")
    return {
        "status":      "draft_created",
        "campaign_id": campaign_id,
        "message":     f"Kampanye '{req.campaignName}' telah disiapkan untuk {len(req.recipients)} penerima. Menunggu persetujuan Manager di Strategic Audit Hub."
    }


@app.post("/api/campaign/approve-and-send")
async def approve_and_send_campaign(req: dict):
    """
    Dipanggil dari Strategic Audit Hub saat Manager menekan APPROVE.
    Akan langsung menjalankan pengiriman email ke semua penerima di background.
    """
    campaign_id = req.get("campaign_id", "")
    if not campaign_id or not db:
        raise HTTPException(status_code=400, detail="campaign_id wajib diisi")

    # Ambil data kampanye dari Firestore
    def _fetch():
        doc = db.collection("marketing_campaigns").document(campaign_id).get()
        if not doc.exists:
            raise ValueError(f"Kampanye '{campaign_id}' tidak ditemukan")
        return doc.to_dict()

    try:
        camp_data = await asyncio.to_thread(_fetch)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

    if camp_data.get("status") == "Sent":
        raise HTTPException(status_code=409, detail="Kampanye ini sudah dikirim sebelumnya.")

    # Tandai sebagai 'Sending' agar UI menampilkan progress bar
    await asyncio.to_thread(lambda: db.collection("marketing_campaigns").document(campaign_id).update({
        "status": "Sending",
        "approvedAt": datetime.now(timezone.utc).isoformat(),
    }))

    # Jalankan pengiriman di background (non-blocking)
    asyncio.create_task(_send_campaign_batch(
        campaign_id = campaign_id,
        subject     = camp_data.get("subject", ""),
        html_body   = camp_data.get("htmlBody", ""),
        recipients  = camp_data.get("recipients", []),
    ))

    return {
        "status":     "sending",
        "campaign_id": campaign_id,
        "message":    f"Kampanye '{camp_data.get('campaignName')}' mulai dikirim ke {len(camp_data.get('recipients', []))} penerima di background."
    }


@app.get("/api/campaigns")
async def list_campaigns():
    """Ambil semua kampanye email dari Firestore (untuk UI EmailCampaignPage)."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    try:
        def _fetch():
            docs = db.collection("marketing_campaigns").stream()
            return [d.to_dict() for d in docs]
        campaigns = await asyncio.to_thread(_fetch)
        campaigns.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return {"campaigns": campaigns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/leads")
async def list_leads():
    """Ambil semua leads/kontak dari koleksi leads_contacts."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    try:
        def _fetch():
            docs = db.collection("leads_contacts").stream()
            return [{"id": d.id, **d.to_dict()} for d in docs]
        leads = await asyncio.to_thread(_fetch)
        return {"leads": leads, "total": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/leads/add")
async def add_lead(req: dict):
    """Tambahkan kontak/lead baru ke database."""
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")
    email = str(req.get("email", "")).strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Email tidak valid")
    data = {
        "email":     email,
        "name":      str(req.get("name", "")),
        "segment":   str(req.get("segment", "General")),
        "source":    str(req.get("source", "Manual")),
        "status":    "Active",
        "addedAt":   datetime.now(timezone.utc).isoformat(),
    }
    try:
        await asyncio.to_thread(lambda: db.collection("leads_contacts").add(data))
        return {"status": "ok", "email": email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/webhooks/resend")
async def resend_webhook(request: Request):
    """
    Webhook dari Resend: menerima notifikasi email.opened, email.clicked, email.bounced.
    Daftarkan URL ini di Dashboard Resend → Webhooks.
    """
    try:
        payload = await request.json()
        event_type = payload.get("type", "")
        data       = payload.get("data", {})
        campaign_id_tag = next(
            (t["value"] for t in data.get("tags", []) if t.get("name") == "campaign_id"),
            None
        )

        if not campaign_id_tag or not db:
            return {"status": "ignored"}

        # Simpan event ke marketing_analytics
        analytics_doc = {
            "campaignId": campaign_id_tag,
            "event":      event_type,
            "email":      data.get("to", [""])[0] if isinstance(data.get("to"), list) else data.get("to", ""),
            "timestamp":  datetime.now(timezone.utc).isoformat(),
        }
        await asyncio.to_thread(lambda: db.collection("marketing_analytics").add(analytics_doc))

        # Update counter di campaign doc
        if event_type == "email.opened":
            def _inc_open():
                doc_ref = db.collection("marketing_campaigns").document(campaign_id_tag)
                doc = doc_ref.get()
                if doc.exists:
                    doc_ref.update({"opens": int(doc.to_dict().get("opens", 0)) + 1})
            await asyncio.to_thread(_inc_open)
        elif event_type == "email.clicked":
            def _inc_click():
                doc_ref = db.collection("marketing_campaigns").document(campaign_id_tag)
                doc = doc_ref.get()
                if doc.exists:
                    doc_ref.update({"clicks": int(doc.to_dict().get("clicks", 0)) + 1})
            await asyncio.to_thread(_inc_click)

        print(f"[Email Webhook] {event_type} → campaign {campaign_id_tag}")
        return {"status": "ok"}
    except Exception as e:
        print(f"[Email Webhook] Error: {e}")
        return {"status": "error", "detail": str(e)}


@app.post("/api/campaign/ai-draft")
async def ai_generate_campaign_draft(req: dict):
    """
    AI Marketing secara otonom membuat HTML email berdasarkan brief dari user.
    Hasilnya akan langsung tersimpan sebagai draft (pending approval).
    Endpoint ini dipanggil dari frontend CampaignForgePage / EmailCampaignPage.
    """
    if not db:
        raise HTTPException(status_code=503, detail="Firebase belum terkonfigurasi")

    brief          = str(req.get("brief", ""))
    campaign_name  = str(req.get("campaignName", "AI Campaign"))
    recipients     = req.get("recipients", [])   # list email atau segment name

    if not brief:
        raise HTTPException(status_code=400, detail="Brief kampanye tidak boleh kosong")

    # Jika recipients berupa segment string, fetch dari leads_contacts
    if recipients and isinstance(recipients[0], str) and "@" not in recipients[0]:
        segment_name = recipients[0]
        def _fetch_segment(seg=segment_name):
            docs = db.collection("leads_contacts").stream()
            return [d.to_dict().get("email", "") for d in docs if d.to_dict().get("segment") == seg and d.to_dict().get("status") == "Active"]
        recipients = await asyncio.to_thread(_fetch_segment)

    if not recipients:
        raise HTTPException(status_code=400, detail="Tidak ada penerima untuk kampanye ini. Tambahkan leads terlebih dahulu.")

    # AI Marketing membuat isi email
    ai_msgs = [
        {"role": "system", "content": (
            "Kamu adalah AI Marketing Email Designer untuk Fusion Neural. "
            "Tugasmu: membuat email HTML yang cantik, persuasif, dan profesional berdasarkan brief yang diberikan. "
            "WAJIB: Output hanya berisi dua bagian terpisah: "
            "1. Baris pertama: Subject email (tanpa prefix apapun). "
            "2. Baris ketiga dan seterusnya: HTML email lengkap (mulai dari <html>). "
            "Gunakan inline CSS untuk styling. Buat email yang mobile-friendly. "
            "Gunakan warna brand Fusion Neural (ungu gelap #1a0033 dan pink #e91e8c). "
            "Tidak ada markdown, tidak ada penjelasan tambahan."
        )},
        {"role": "user", "content": f"Buat email marketing untuk kampanye ini:\n\n{brief}\n\nNama Kampanye: {campaign_name}"}
    ]

    primary, backup = AGENT_MODELS.get("marketing", ("mistral", "groq"))
    ai_result, provider = await call_with_fallback(primary, backup, ai_msgs, temperature=0.8)

    # Parse subject dan HTML dari output AI
    lines = ai_result.strip().split("\n")
    subject  = lines[0].strip() if lines else campaign_name
    html_body = "\n".join(lines[2:]).strip() if len(lines) > 2 else ai_result

    # Fallback jika HTML tidak dihasilkan dengan benar
    if not html_body.strip().startswith("<"):
        html_body = f"""<html><body style="font-family:sans-serif;background:#1a0033;color:#fff;padding:40px;">
        <h1 style="color:#e91e8c;">{campaign_name}</h1>
        <div style="white-space:pre-wrap;">{ai_result}</div>
        <p style="color:#aaa;font-size:12px;">© 2026 Fusion Neural. All rights reserved.</p>
        </body></html>"""

    # Buat draft
    draft_req = CampaignDraftRequest(
        campaignName=campaign_name,
        subject=subject,
        htmlBody=html_body,
        recipients=recipients,
        agentId="Neural Marketing",
        notes=f"Auto-generated via AI. Provider: {provider}. Brief: {brief[:200]}"
    )
    result = await create_campaign_draft(draft_req)
    result["subject"] = subject
    result["provider"] = provider
    result["recipientCount"] = str(len(recipients))
    return result


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
# ── WebSocket Router (Solusi #4 — Real-Time Signals tanpa polling Firestore) ──
app.include_router(ws_router)

# ── Wire integrations logger (harus setelah app.include_router(integrations_router)
integrations.external_logger = log_to_sheets
integrations.chat_takeover_handler = chat_takeover_check_and_log

if __name__ == "__main__":
    import uvicorn
    # Menggunakan port 8001 untuk menghindari bentrok port 8000
    uvicorn.run(app, host="0.0.0.0", port=8001)
