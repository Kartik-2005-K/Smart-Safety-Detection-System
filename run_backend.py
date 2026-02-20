#!/usr/bin/env python3
"""
Smart Safety Detection - Backend Startup Script
This script sets up and starts the FastAPI backend server.
"""

import subprocess
import sys
import os
import platform
import time
from pathlib import Path

def print_banner():
    """Print startup banner"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║       Smart Safety Detection - Backend Startup               ║
    ║       Real-time PPE & Drowsiness Detection                  ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def check_python_version():
    """Verify Python version is 3.8+"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required. Please upgrade Python.")
        sys.exit(1)
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def create_virtual_env():
    """Create virtual environment if it doesn't exist"""
    venv_path = Path("backend_venv")
    
    if not venv_path.exists():
        print("\n📦 Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", str(venv_path)], check=True)
        print("✓ Virtual environment created")
    else:
        print("✓ Virtual environment already exists")
    
    return venv_path

def get_activation_command(venv_path):
    """Get the command to activate virtual environment"""
    system = platform.system()
    
    if system == "Windows":
        return str(venv_path / "Scripts" / "activate.bat")
    else:
        return f"source {venv_path}/bin/activate"

def install_dependencies(venv_path):
    """Install required dependencies"""
    print("\n📚 Installing dependencies...")
    
    # Get pip executable path
    if platform.system() == "Windows":
        pip_exe = venv_path / "Scripts" / "pip.exe"
    else:
        pip_exe = venv_path / "bin" / "pip"
    
    # Install requirements
    req_file = Path("backend/requirements.txt")
    if req_file.exists():
        subprocess.run([str(pip_exe), "install", "-r", str(req_file)], check=True)
        print("✓ Dependencies installed")
    else:
        print(f"❌ requirements.txt not found at {req_file}")
        sys.exit(1)

def start_backend(venv_path):
    """Start the FastAPI backend"""
    print("\n🚀 Starting FastAPI backend...")
    print("   API: http://localhost:8000")
    print("   WebSocket: ws://localhost:8000/ws")
    print("   Docs: http://localhost:8000/docs")
    print("\n⏳ On first run, the YOLOv10-n model will download (~100MB)...\n")
    
    # Get python executable in venv
    if platform.system() == "Windows":
        python_exe = venv_path / "Scripts" / "python.exe"
    else:
        python_exe = venv_path / "bin" / "python"
    
    # Run backend
    os.chdir("backend")
    subprocess.run([str(python_exe), "main.py"])

def main():
    """Main startup routine"""
    try:
        print_banner()
        
        # Check Python version
        check_python_version()
        
        # Create virtual environment
        venv_path = create_virtual_env()
        
        # Install dependencies
        install_dependencies(venv_path)
        
        # Start backend
        start_backend(venv_path)
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Backend stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Ensure you're in the project root directory")
        print("  2. Check that Python 3.8+ is installed")
        print("  3. Try running manually: cd backend && python main.py")
        sys.exit(1)

if __name__ == "__main__":
    main()
