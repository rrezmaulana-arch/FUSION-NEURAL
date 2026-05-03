@echo off
title FusionNeural AI Core v3.0
color 0A
echo.
echo  =====================================================
echo   FUSION NEURAL AI CORE v3.0 — Python + Localtunnel
echo  =====================================================
echo.

:: ── Step 1: Cek Python Launcher ──────────────────────────────────
py --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Python Launcher 'py' tidak ditemukan. 
  echo Pastikan Python sudah terinstal dari https://python.org
  pause & exit /b
)

:: ── Step 2: Install dependencies jika belum ───────────────────────
if not exist "backend\venv\Scripts\activate.bat" (
  echo [SETUP] Membuat virtual environment Python...
  py -m venv backend\venv
  echo [SETUP] Menginstall dependencies...
  call backend\venv\Scripts\activate.bat
  pip install -r backend\requirements.txt
) else (
  call backend\venv\Scripts\activate.bat
)

:: ── Step 3: Install localtunnel jika belum ─────────────────────────
where lt >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [SETUP] Menginstall localtunnel...
  npm install -g localtunnel
)

echo.
echo [1/3] Memulai Python FastAPI backend (localhost:8000)...
start "FusionNeural Python Backend" cmd /k "cd /d %~dp0 && backend\venv\Scripts\activate.bat && uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Menunggu backend siap...
timeout /t 5 /nobreak >nul

echo [3/3] Membuka Localtunnel ke https://fusionneural.loca.lt ...
start "FusionNeural Tunnel" cmd /k "lt --port 8000 --subdomain fusionneural"

echo.
echo [OPSIONAL] Memulai n8n sebagai Visual Logger...
start "n8n Visual Logger" cmd /k "n8n start"

echo.
echo  =====================================================
echo   STATUS SISTEM:
echo.
echo   Python AI  : http://localhost:8000
echo   Tunnel URL : https://fusionneural.loca.lt
echo   n8n Visual : http://localhost:5678
echo.
echo   !! WAJIB di Vercel Dashboard !!
echo   Set env: PYTHON_BACKEND_URL = https://fusionneural.loca.lt
echo.
echo   Pertama kali buka tunnel, kunjungi:
echo   https://loca.lt/mytunnelpassword
echo   untuk mendapat bypass password
echo  =====================================================
pause
