#!/bin/bash

# Smart Safety Detection - Backend Startup Script
# This script handles backend initialization and startup

set -e

echo "================================"
echo "Smart Safety Detection Backend"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python version
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Python ${PYTHON_VERSION} found${NC}"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"
echo "Working directory: $(pwd)"
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment found${NC}"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Install dependencies if requirements.txt is newer than venv marker
if [ ! -f "venv/.installed" ] || [ "requirements.txt" -nt "venv/.installed" ]; then
    echo "Installing dependencies..."
    pip install -q -r requirements.txt
    touch venv/.installed
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Check if models can be loaded
echo "Checking ML models..."
python3 << 'EOF'
import sys
try:
    from ultralytics import YOLO
    import mediapipe as mp
    import cv2
    
    print("[v0] Checking YOLOv10-n model availability...")
    model = YOLO('yolov10n.pt')
    print("[v0] ✓ YOLOv10-n model ready")
    
    print("[v0] Checking MediaPipe...")
    mp.solutions.holistic
    print("[v0] ✓ MediaPipe ready")
    
except Exception as e:
    print(f"[v0] Warning: {e}", file=sys.stderr)
    print("[v0] Models will be downloaded on first run...")
EOF
echo ""

# Start the backend
echo -e "${YELLOW}Starting backend server...${NC}"
echo "================================================"
echo "Backend API:  http://localhost:8000"
echo "WebSocket:    ws://localhost:8000/ws"
echo "Documentation: http://localhost:8000/docs"
echo "================================================"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

python3 main.py
