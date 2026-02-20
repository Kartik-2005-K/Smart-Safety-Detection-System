# WebSocket Connection Guide

## Overview

The Smart Safety Detection system uses WebSocket for real-time communication between the frontend and backend. This guide will help you establish and troubleshoot the connection.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Frontend (React/Next.js)                                  │
│  ├── Port: 3000                                            │
│  ├── WebSocket Client: ws://localhost:8000/ws              │
│  └── Sends video frames for processing                     │
│                                                             │
│                        (WebSocket)                         │
│                            ↕                               │
│                                                             │
│  Backend (FastAPI)                                         │
│  ├── Port: 8000                                            │
│  ├── WebSocket Server: ws://0.0.0.0:8000/ws                │
│  ├── YOLOv10-n Detection                                   │
│  ├── MediaPipe Drowsiness Detection                        │
│  └── SQLite Incident Logging                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start (Easiest Way)

### 1. Run the Python Startup Script

```bash
python run_backend.py
```

This script will:
- ✓ Create a virtual environment
- ✓ Install all dependencies
- ✓ Start the FastAPI backend
- ✓ Download YOLOv10-n model on first run

**That's it!** The backend will be running on `http://localhost:8000`

### 2. Start the Frontend

Open a new terminal and run:

```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

### 3. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

The app will automatically detect the backend connection and show you the camera feed.

---

## Manual Setup (If Scripts Don't Work)

### Step 1: Create Virtual Environment

```bash
python -m venv venv
```

### Step 2: Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### Step 4: Start Backend

```bash
cd backend
python main.py
```

You should see:
```
[INFO] ============================================================
[INFO] 🚀 Starting Safety Detection Backend
[INFO] ============================================================
[INFO] ✓ Database initialized successfully
[INFO] Loading YOLOv10-n model (this may take 1-2 minutes on first run)...
[INFO] ✓ PPE Detector loaded successfully
[INFO] ✓ API running on http://0.0.0.0:8000
[INFO] ✓ WebSocket available at ws://localhost:8000/ws
[INFO] ============================================================
```

### Step 5: Start Frontend (New Terminal)

```bash
npm run dev
```

---

## Verifying the Connection

### Check Backend Health

Open in your browser or use curl:

```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "detector": "loaded",
  "timestamp": "2024-02-20T10:30:45.123456"
}
```

### Check WebSocket Connection

The app will automatically check and display the connection status:

1. Go to `http://localhost:3000`
2. Look at the top-right corner of the header
3. You should see a green "✓ Connected" message

If you see a red error message:
- Ensure the backend is running on port 8000
- Check the browser console for detailed error messages (F12)

### View API Documentation

Once the backend is running, you can view the interactive API docs:

```
http://localhost:8000/docs
```

This shows all available endpoints and WebSocket connections.

---

## Troubleshooting WebSocket Errors

### Error: "WebSocket connection failed"

**Cause:** Backend is not running or not accessible

**Solutions:**
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check if port 8000 is already in use: `lsof -i :8000` (Mac/Linux)
3. Try a different port by editing `backend/main.py`

### Error: "Failed to load detector"

**Cause:** YOLOv10-n model download failed or disk space issues

**Solutions:**
1. Check internet connection (model is ~100MB)
2. Ensure 1GB+ free disk space
3. Check logs in the backend terminal
4. Try deleting `.cache` directory and restart

### Error: "Permission denied" on script

**Cause:** Script doesn't have execute permissions

**Solutions:**
1. Make script executable: `chmod +x start-backend.sh`
2. Run with Python directly: `python run_backend.py`

### High Latency / Slow WebSocket

**Cause:** Network issues or slow model inference

**Solutions:**
1. Check your CPU/RAM usage (model needs ~2GB RAM)
2. Reduce video resolution in `VideoFeed.tsx`
3. Lower FPS limit (default is 30)
4. Ensure backend and frontend are on same machine

### Camera Not Working

**Cause:** Browser camera permissions not granted

**Solutions:**
1. Check browser camera permissions
2. Reload the page
3. Try a different browser
4. Allow localhost camera access in browser settings

---

## Monitoring the Connection

### Frontend Console Logs

Open browser DevTools (F12 or Right-Click → Inspect) and look for:

```
[v0] Attempting WebSocket connection to: ws://localhost:8000/ws
[v0] WebSocket connected successfully
[v0] Frame received, rendering...
```

### Backend Logs

Check the terminal where backend is running for:

```
[INFO] WebSocket client connected
[INFO] Processing frame...
[INFO] Detected violations: 1
```

---

## Connection Flow Diagram

```
Frontend                          Backend
  │                                 │
  ├─── HTTP: Request health ───────→ /health
  │                                 │
  │←─── JSON: {status: healthy} ────┤
  │                                 │
  ├─────── WebSocket upgrade ──────→ /ws
  │                                 │
  │←───── Connection accepted ──────┤
  │                                 │
  ├─── Base64 frame + metadata ────→ Inference
  │                                 │
  │←─ Detections + Annotations ────┤
  │                                 │
  ├─ Canvas render + alerts         │
  │                                 │
  └─ Repeat every 33ms (30 FPS) ────→
```

---

## Advanced Configuration

### Custom Backend Port

Edit `backend/main.py`:

```python
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed from 8000
```

Also update frontend in `app/components/VideoFeed.tsx`:

```typescript
wsUrl = 'ws://localhost:8001/ws'
```

### Remote Backend Connection

If backend is on a different machine, update:

```typescript
wsUrl = 'ws://192.168.1.100:8000/ws'  // Backend IP address
```

Also update CORS in `backend/main.py`:

```python
allow_origins=["http://your-frontend-ip:3000"],
```

### Debugging WebSocket Messages

In `VideoFeed.tsx`, add logging:

```typescript
wsRef.current.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('[v0] WebSocket message:', data);
  // ... rest of handler
};
```

---

## Performance Tips

1. **Reduce Video Resolution:** Lower resolution = faster processing
2. **Lower FPS:** Default 30 FPS is good; reduce to 15 for older systems
3. **Use Nano Model:** Already using YOLOv10-n (smallest variant)
4. **Close Other Apps:** Free up system resources for better performance

---

## Getting Help

If you're still having issues:

1. Check `WEBSOCKET_DEBUG.md` for detailed WebSocket troubleshooting
2. Review backend logs for error messages
3. Check browser console (F12) for frontend errors
4. Try the manual setup if scripts fail
5. Ensure all ports (3000, 8000) are available

---

## Common Port Issues

If ports 3000 or 8000 are already in use:

### Find what's using the port

**Windows:**
```bash
netstat -ano | findstr :8000
```

**macOS/Linux:**
```bash
lsof -i :8000
```

### Kill the process

**Windows:**
```bash
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
kill -9 <PID>
```

---

## Quick Reference

| Component | URL | Purpose |
|-----------|-----|---------|
| Frontend | http://localhost:3000 | Web dashboard |
| Backend Health | http://localhost:8000/health | Connection check |
| WebSocket | ws://localhost:8000/ws | Real-time video feed |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Database | ./backend/incidents.db | SQLite incident log |

---

## Success Checklist

- [ ] Backend running (see startup messages)
- [ ] Frontend running (http://localhost:3000 loads)
- [ ] Green "✓ Connected" in top-right corner
- [ ] Camera permission granted to browser
- [ ] "Start Camera" button visible and clickable
- [ ] Video feed showing in real-time
- [ ] Console logs show frame updates

Once all items are checked, the system is working perfectly!
