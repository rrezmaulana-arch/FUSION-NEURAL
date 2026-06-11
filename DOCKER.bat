@echo off
title FUSION NEURAL — Docker
color 0A

echo.
echo  ========================================
echo   FUSION NEURAL — Docker Setup
echo  ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Copying .env.example to .env...
    copy .env.example .env
    echo.
    echo [IMPORTANT] Please edit .env file with your actual API keys before continuing.
    echo.
    pause
)

echo [1/3] Building Docker images...
docker-compose build

echo.
echo [2/3] Starting services...
docker-compose up -d

echo.
echo [3/3] Waiting for services to be ready...
timeout /t 5 /nobreak >nul

echo.
echo  ========================================
echo   FUSION NEURAL is running!
echo  ========================================
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8001
echo   Health:    http://localhost:8001/health
echo.
echo   Commands:
echo     docker-compose logs -f    (view logs)
echo     docker-compose down       (stop)
echo     docker-compose restart    (restart)
echo.
echo  ========================================
echo.

pause
