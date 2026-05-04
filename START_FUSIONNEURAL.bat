@echo off
title FusionNeural AI Core v4.0 — n8n + Python + ngrok
color 0A
echo.
echo  =====================================================
echo   FUSION NEURAL AI CORE v4.0
echo   Stack: Python FastAPI + n8n + ngrok (domain tetap)
echo  =====================================================
echo.
echo  Arsitektur:
echo    Frontend (Vercel)
echo        ^|
echo        v
echo    Vercel API proxy
echo        ^|
echo        v
echo    n8n webhook (ngrok :5678)  ^<--- entry point
echo        ^|
echo        v (n8n workflow memanggil Python)
echo    Python FastAPI (ngrok :8000)
echo.
echo  Jika salah satu mati = semua mati. Tidak ada fallback.
echo  =====================================================
echo.

:: ── Step 1: Cek Python Launcher ──────────────────────────────────────
py --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Python Launcher 'py' tidak ditemukan.
  echo Pastikan Python sudah terinstal dari https://python.org
  pause & exit /b
)

:: ── Step 2: Setup virtualenv Python ──────────────────────────────────
if not exist "backend\venv\Scripts\activate.bat" (
  echo [SETUP] Membuat virtual environment Python...
  py -m venv backend\venv
  echo [SETUP] Menginstall dependencies...
  call backend\venv\Scripts\activate.bat
  pip install -r backend\requirements.txt
) else (
  call backend\venv\Scripts\activate.bat
)

:: ── Step 3: Cek ngrok tersedia ────────────────────────────────────────
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] ngrok tidak ditemukan. Download dari https://ngrok.com/download
  echo Pastikan ngrok.exe ada di PATH atau folder ini.
  pause & exit /b
)

:: ── Step 4: Cek n8n tersedia ──────────────────────────────────────────
where n8n >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [SETUP] Menginstall n8n global...
  npm install -g n8n
)

echo.
echo [1/4] Memulai Python FastAPI backend (localhost:8000)...
start "FusionNeural — Python Backend" cmd /k "cd /d %~dp0 && backend\venv\Scripts\activate.bat && uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/4] Menunggu Python siap (5 detik)...
timeout /t 5 /nobreak >nul

echo [3/4] Memulai n8n (localhost:5678)...
start "FusionNeural — n8n Orchestrator" cmd /k "n8n start"

echo [4/4] Menunggu n8n siap (8 detik)...
timeout /t 8 /nobreak >nul

echo.
echo [TUNNEL] Membuka ngrok dengan domain tetap...
echo   n8n  → https://confined-simple-handiwork.ngrok-free.dev
echo   Python tidak perlu port tersendiri — n8n yang panggil Python lokal.
echo.

:: ngrok expose port 5678 (n8n) dengan domain tetap
:: n8n di dalamnya memanggil Python di localhost:8000 (lokal, tidak perlu tunnel)
start "FusionNeural — ngrok Tunnel" cmd /k "ngrok http --domain=confined-simple-handiwork.ngrok-free.dev 5678"

echo.
echo  =====================================================
echo   SISTEM AKTIF — STATUS:
echo.
echo   Python FastAPI : http://localhost:8000
echo   n8n Dashboard  : http://localhost:5678
echo   ngrok Tunnel   : https://confined-simple-handiwork.ngrok-free.dev
echo.
echo   Vercel env yang dibutuhkan:
echo   N8N_AGENTS_WEBHOOK   = https://confined-simple-handiwork.ngrok-free.dev/webhook/fusionneural-agents
echo   N8N_MARKETING_WEBHOOK= https://confined-simple-handiwork.ngrok-free.dev/webhook/fusionneural-marketing
echo   N8N_SEARCH_WEBHOOK   = https://confined-simple-handiwork.ngrok-free.dev/webhook/fusionneural-search
echo   PYTHON_BACKEND_URL   = http://localhost:8000  (diakses oleh n8n, bukan Vercel langsung)
echo.
echo   !! Jika salah satu window ditutup = semua mati !!
echo  =====================================================
pause
