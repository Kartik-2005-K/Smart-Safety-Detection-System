# Run Now - Smart Safety Detection System

## Start Using the App in 30 Seconds

### Step 1: Start the Frontend

```bash
npm install
npm run dev
```

The app will open at `http://localhost:3000`

### Step 2: That's It!

You're in **Demo Mode**. The camera detection system is ready to use immediately:

1. Click the blue "📹 Start Camera" button
2. Grant camera permission when prompted
3. Watch simulated PPE detections appear on your camera feed
4. See violations logged in real-time

## What You're Seeing

- **Yellow indicator** = Demo Mode active
- **Camera feed** = Your webcam video in real-time
- **Green/yellow boxes** = Simulated PPE detections
- **Red overlays** = Simulated safety violations
- **Bottom right** = FPS counter
- **Incident Log tab** = All violations logged

## Optional: Use Real Detection with Backend

If you want to use the actual YOLOv10 computer vision model:

### Terminal 1 (Backend):
```bash
python run_backend.py
```

Wait for: `✓ Backend initialization complete`

### Terminal 2 (Frontend):
```bash
npm run dev
```

Refresh the browser - it will automatically switch to **Live Mode** with real detection.

## Features Available Now

### In Demo Mode
✓ Camera access & live feed  
✓ Simulated PPE detections  
✓ Mock violation alerts  
✓ Incident logging  
✓ Statistics dashboard  
✓ Real-time FPS counter  

### In Live Mode (with backend)
✓ All above features  
✓ Real YOLOv10-n detection  
✓ MediaPipe drowsiness detection  
✓ SQLite database persistence  
✓ Detailed detection stats  
✓ CSV incident export  

## Architecture Quick View

```
┌──────────────────────────────────┐
│  Browser Dashboard               │
│  - Demo or Live Mode             │
│  - Camera Feed (Canvas)          │
│  - Incident Log                  │
│  - Real-time Stats               │
└──────────┬───────────────────────┘
           │
    ┌──────v──────┐
    │ Demo Mode?  │
    └──────┬──────┘
           │
    ┌──────v──────────────┐
    │ WebSocket (optional)│
    └──────┬──────────────┘
           │
    ┌──────v──────────────────────┐
    │ FastAPI Backend (optional)   │
    │ - YOLOv10-n Model           │
    │ - MediaPipe                 │
    │ - SQLite DB                 │
    └─────────────────────────────┘
```

## Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── components/
│   │   ├── VideoFeed.tsx        (Camera + detection)
│   │   ├── AlertBanner.tsx      (Alert display)
│   │   ├── IncidentLog.tsx      (Violation history)
│   │   └── Statistics.tsx       (Stats dashboard)
│   └── page.tsx                 (Main dashboard)
├── backend/
│   ├── main.py                  (FastAPI server)
│   ├── detection.py             (YOLOv10 + MediaPipe)
│   ├── database.py              (SQLAlchemy)
│   ├── models.py                (Data models)
│   └── requirements.txt          (Dependencies)
└── [Documentation files]
    ├── DEMO_MODE.md             (This feature)
    ├── SETUP.md                 (Full setup guide)
    ├── README.md                (Overview)
    └── WEBSOCKET_DEBUG.md       (Troubleshooting)
```

## What Each Tab Does

### 📹 Live Monitor
- Camera feed with real-time annotations
- Shows detected objects with confidence scores
- Displays active violations
- System configuration info

### 📋 Incident Log
- Complete history of detected violations
- Search and filter incidents
- Timestamp, type, and confidence score
- CSV export option

### 📊 Statistics
- Violation trends over time
- Detection statistics
- Most common violation types
- Visual charts and graphs

## Keyboard/Mouse Controls

| Action | Result |
|--------|--------|
| Click "Start Camera" | Open camera and begin monitoring |
| Click "Stop Camera" | Stop monitoring and close camera |
| Tab between sections | Navigate between Monitor/Incidents/Stats |
| Click violation in log | View details (in Live Mode) |

## Browser Requirements

- Chrome, Firefox, Safari, or Edge
- Camera access permission
- JavaScript enabled
- WebSocket support (for Live Mode)

## Troubleshooting

### Camera not working?
1. Check browser permissions (Settings → Privacy)
2. Ensure no other app is using camera
3. Try a different browser
4. Restart the dev server

### No detections appearing?
1. In Demo Mode: Detections appear randomly every ~5 frames
2. Ensure camera is pointing at objects
3. Check FPS counter (should be > 0)

### Want to switch to Live Mode?
1. Start FastAPI backend: `python run_backend.py`
2. Refresh the browser page
3. App will automatically detect backend and switch

## Next Steps

1. **Explore Demo Mode** - Get familiar with the UI
2. **Test all tabs** - Check Incident Log and Statistics
3. **Read DEMO_MODE.md** - Learn how demo works
4. **Start Backend** - When ready to use real detection
5. **Check documentation** - For advanced configuration

## Performance Tips

- **Demo Mode**: Very fast, runs entirely in browser
- **Live Mode**: Needs ~15-50ms per frame (depends on CPU)
- **FPS target**: 30 FPS (configurable in VideoFeed props)
- **Camera resolution**: 1280x720 (ideal, can adjust)

## Support & Documentation

- `README.md` - Full project overview
- `SETUP.md` - Detailed installation guide
- `DEMO_MODE.md` - Demo mode features
- `WEBSOCKET_DEBUG.md` - Connection troubleshooting
- `QUICK_START.md` - 30-second setup
- `CONNECTION_GUIDE.md` - Backend connection guide

---

## That's it! You're ready to go.

**Start detecting now:**
```bash
npm run dev
```

The demo mode will be running immediately. Click "Start Camera" and enjoy!
