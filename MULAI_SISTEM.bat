@echo off
title FusionNeural - Full Stack Launcher
color 0b

echo ==========================================
echo    FUSIONNEURAL NEURAL ENGINE STARTING
echo ==========================================
echo.

:: 1. Jalankan Backend FastAPI di jendela baru
echo [1/2] Menjalankan Python FastAPI Backend...
start "FastAPI Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

:: 2. Jalankan Ngrok dengan Domain Statis
echo [2/2] Menyalakan Ngrok Tunnel Permanen...
echo Link: https://confined-simple-handiwork.ngrok-free.dev
echo.
ngrok http --domain=confined-simple-handiwork.ngrok-free.dev 8000

pause
