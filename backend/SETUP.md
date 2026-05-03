# FusionNeural Backend Setup Guide
# =================================
# Jalankan perintah ini SATU PER SATU di terminal (PowerShell / CMD)

# ── STEP 1: Install Python ─────────────────────────────────────────────────────
# Download & install Python 3.11+ dari: https://www.python.org/downloads/
# PENTING: Centang "Add Python to PATH" saat instalasi!
# Setelah install, restart terminal, lalu cek:
#   python --version

# ── STEP 2: Buat virtual environment ──────────────────────────────────────────
# Jalankan dari folder root proyek (c:\Olivia\FUSION NEURAL):
#   python -m venv backend\venv

# ── STEP 3: Aktifkan virtual environment ──────────────────────────────────────
# Windows PowerShell:
#   backend\venv\Scripts\Activate.ps1
# Windows CMD:
#   backend\venv\Scripts\activate.bat

# ── STEP 4: Install dependencies ──────────────────────────────────────────────
#   pip install -r backend\requirements.txt

# ── STEP 5: Test backend berjalan ─────────────────────────────────────────────
#   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# Buka browser: http://localhost:8000
# Harusnya tampil: {"status": "🔥 FusionNeural Python Backend v3.0 aktif", ...}

# ── STEP 6: Mulai localtunnel ─────────────────────────────────────────────────
# Di terminal BARU (biarkan uvicorn tetap jalan):
#   lt --port 8000 --subdomain fusionneural
# Pastikan PYTHON_BACKEND_URL=https://fusionneural.loca.lt di Vercel Dashboard

# ── SETELAH SEMUANYA JALAN ────────────────────────────────────────────────────
# Cukup jalankan: START_FUSIONNEURAL.bat
# Script ini akan otomatis melakukan semua langkah di atas.
