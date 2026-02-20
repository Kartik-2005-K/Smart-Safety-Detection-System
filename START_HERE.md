# START HERE - Smart Safety Detection

Welcome! This guide will get you up and running in **less than 5 minutes**.

## The Fastest Way to Start

Open **two terminals** side by side and run:

**Terminal 1 (Backend):**
```bash
python run_backend.py
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

That's it! 

Open http://localhost:3000 in your browser and you're done.

---

## What's Happening?

```
Your Browser (Port 3000)  ←--WebSocket-→  Backend Server (Port 8000)
      ↓                                            ↓
   Dashboard                              YOLOv10-n Detection
   Video Feed                             MediaPipe Drowsiness
   Alerts                                 SQLite Database
```

---

## The 3 Key Things

1. **Backend Must Run First** - This hosts the AI model and WebSocket server
2. **Frontend Connects to Backend** - The dashboard communicates via WebSocket
3. **Browser Needs Camera Access** - Grant permission when asked

---

## On First Run

⏳ **Wait 1-2 minutes** - YOLOv10-n model will download (~100MB)

You'll see:
```
Loading YOLOv10-n model (this may take 1-2 minutes on first run)...
```

This is normal. Grab a coffee! ☕

---

## Troubleshooting the WebSocket Error

### Error: "WebSocket connection failed"

The backend isn't running. Make sure:

✓ Terminal 1 shows: `✓ API running on http://0.0.0.0:8000`
✓ Backend hasn't crashed
✓ Port 8000 isn't already in use

### Check if Backend is Running

```bash
curl http://localhost:8000/health
```

Should return: `{"status": "healthy", ...}`

### Test WebSocket Connection

In your browser console (F12):
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.log('Error:', e);
```

---

## If Scripts Don't Work

### Manual Backend Start

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r backend/requirements.txt
cd backend
python main.py
```

### Manual Frontend Start

```bash
npm install  # Only if you haven't already
npm run dev
```

---

## What You Should See

### Backend Terminal
```
============================================================
🚀 Starting Safety Detection Backend
============================================================
✓ Database initialized successfully
✓ PPE Detector loaded successfully
✓ API running on http://0.0.0.0:8000
✓ WebSocket available at ws://localhost:8000/ws
============================================================
```

### Browser (http://localhost:3000)
- Green "✓ Connected" in top-right corner
- "Start Camera" button ready to click
- Once clicked, live video feed with detection boxes

---

## Next Steps

1. **Granted camera access?** → Click "Start Camera"
2. **Seeing video feed?** → Look for detection boxes around hard hats/vests
3. **Want to test?** → Download a test video from the web, or use your webcam
4. **View incidents?** → Click "Incident Log" tab to see logged violations

---

## Key Files

| File | Purpose |
|------|---------|
| `run_backend.py` | One-command backend startup |
| `start-backend.sh/.bat` | Alternative startup script |
| `CONNECTION_GUIDE.md` | Detailed WebSocket troubleshooting |
| `backend/main.py` | FastAPI server with WebSocket |
| `app/page.tsx` | Frontend dashboard |

---

## System Requirements

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **4GB RAM minimum** (for ML model)
- **1GB free disk space** (for model downloads)
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **Webcam** (for live detection)

---

## Performance Tips

- Modern CPU recommended (Intel i5+ or equivalent)
- Close other heavy applications
- Good WiFi connection if on different machines
- Video resolution: 1280x720 is default (adjust if slow)

---

## Quick Links

- **Getting Started Page:** http://localhost:3000/getting-started
- **API Docs:** http://localhost:8000/docs (once backend running)
- **Full Guide:** See `CONNECTION_GUIDE.md`
- **Troubleshooting:** See `WEBSOCKET_DEBUG.md`

---

## Still Stuck?

Check these in order:

1. **Backend running?** → Check Terminal 1 for errors
2. **Port 8000 available?** → `lsof -i :8000` or `netstat -ano | findstr :8000`
3. **Firewall blocking?** → Check OS firewall settings
4. **Old process running?** → Kill port 8000 and restart
5. **First time model download?** → Wait for completion, check internet

---

## Success! 🎉

Once you see:
- ✓ Backend terminal shows "API running"
- ✓ Browser shows green "Connected" badge
- ✓ Video feed appears when you click "Start Camera"

**You're done!** The system is working. Start monitoring.

---

**Need more help?** See `CONNECTION_GUIDE.md` for detailed instructions.
