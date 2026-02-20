@echo off
REM Smart Safety Detection - Backend Startup Script (Windows)
REM This script handles backend initialization and startup

setlocal enabledelayedexpansion

echo ================================
echo Smart Safety Detection Backend
echo ================================
echo.

REM Check Python version
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python %PYTHON_VERSION% found
echo.

REM Navigate to backend directory
cd /d "%~dp0backend"
echo Working directory: %cd%
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment found
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo [OK] Virtual environment activated
echo.

REM Install dependencies
echo Installing dependencies...
pip install -q -r requirements.txt
echo [OK] Dependencies installed
echo.

REM Check if models can be loaded
echo Checking ML models...
python << 'EOF'
import sys
try:
    from ultralytics import YOLO
    import mediapipe as mp
    import cv2
    
    print("[v0] Checking YOLOv10-n model availability...")
    model = YOLO('yolov10n.pt')
    print("[v0] Model ready")
    
    print("[v0] Checking MediaPipe...")
    mp.solutions.holistic
    print("[v0] MediaPipe ready")
    
except Exception as e:
    print(f"[v0] Warning: {e}")
    print("[v0] Models will be downloaded on first run...")
EOF
echo.

REM Start the backend
echo Starting backend server...
echo ================================================
echo Backend API:  http://localhost:8000
echo WebSocket:    ws://localhost:8000/ws
echo Documentation: http://localhost:8000/docs
echo ================================================
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

pause
