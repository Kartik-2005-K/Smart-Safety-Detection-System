# Demo Mode Guide - Smart Safety Detection

## Overview

The Smart Safety Detection application now includes a **Demo Mode** that allows you to immediately see the safety monitoring system in action without requiring the FastAPI backend to be running.

## Quick Start with Demo Mode

1. Open the application in your browser: `http://localhost:3000`
2. The app detects if the backend is available
3. If backend is not available, **Demo Mode** is automatically enabled
4. Click "📹 Start Camera" to begin viewing the camera feed
5. You'll see simulated PPE detections and violations appearing on the canvas

## Demo Mode Features

### What's Included

- **Live Camera Feed**: Real-time video from your webcam
- **Simulated Detections**: Random PPE objects (person, hard hat, safety vest) appear on the canvas
- **Mock Violations**: Simulated safety violations (missing hard hat, missing vest, drowsiness)
- **Incident Logging**: Violations are logged and displayed in the Incident Log tab
- **Statistics**: Real-time FPS counter and detection stats
- **Bounding Boxes**: Yellow/green boxes indicate detected objects

### What's NOT Included in Demo Mode

- Real YOLOv10 model predictions
- Real MediaPipe drowsiness detection
- Database persistence
- API logging
- Actual computer vision analysis

## Switching to Live Detection

When you're ready to use real detection:

### Step 1: Start the Backend

Open a terminal in the project root and run:

```bash
# Quick start (recommended)
python run_backend.py
```

Or manually:

```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Step 2: Refresh the Browser

Simply refresh the page at `http://localhost:3000`

The app will automatically detect the backend and switch from Demo Mode to Live Mode.

### Step 3: Grant Camera Permission

Allow camera access when prompted by your browser.

## Mode Indicators

Look at the top-right of the page to see which mode you're in:

- **Yellow "DEMO" Badge** = Demo Mode (no backend)
- **Blue "LIVE" Badge** = Live Mode (backend connected)

Also check the status line in the video feed:
- Yellow indicator = Demo Mode
- Green indicator = WebSocket Connected

## Demo Mode Behavior

### Detection Simulation

The demo mode generates:
- **Random detections** every 5 frames
- **Classes**: person, hard_hat, safety_vest
- **Confidence**: 75% - 100%
- **Bounding boxes** in yellow (lower confidence) or green (higher confidence)

### Violation Generation

Violations are triggered with 20% probability and include:
- `missing_hard_hat`
- `missing_vest`
- `drowsiness`

Red overlay boxes indicate violation areas.

### FPS Display

- Real FPS is calculated from the video processing loop
- Display shows actual rendering performance
- 30 FPS target (configurable)

## Common Questions

### Q: Why is it in Demo Mode?

**A:** The FastAPI backend is not running. Start it using `python run_backend.py` or manually following the steps above.

### Q: Can I use Demo Mode to test UI?

**A:** Absolutely! Demo Mode is perfect for:
- Testing the UI without backend setup
- Showcasing the application
- Understanding the detection workflow
- Testing incident logging
- Verifying camera permissions

### Q: Do violations logged in Demo Mode persist?

**A:** Violations appear in the Incident Log during the session but are not saved to the database (since there's no backend). When you switch to Live Mode with a backend, violations will be properly logged.

### Q: Can I manually trigger violations in Demo Mode?

**A:** Not in the current version. Violations are randomly generated. To test specific scenarios, use Live Mode with the real detection system.

### Q: Why are detections sometimes not visible?

**A:** Detections are randomly generated, so they won't appear every frame. This is intentional to simulate real-world detection patterns where not all frames contain violations.

## Troubleshooting

### Demo Mode won't start

1. Check browser console for errors
2. Ensure camera permissions are granted
3. Try reloading the page
4. Check that no other app is using the camera

### Can't switch to Live Mode

1. Make sure the FastAPI backend is running
2. Check that `http://localhost:8000/health` returns a 200 response
3. Wait a few seconds and refresh the page
4. Check the browser console for connection errors

### Low FPS in Demo Mode

1. Close other browser tabs
2. Disable browser extensions
3. Check CPU usage
4. Reduce canvas resolution if needed

## Advanced: Running Backend and Demo Together

You can keep Demo Mode enabled even when the backend is running. To force Demo Mode:

Edit `app/page.tsx` and change:

```typescript
const [useDemoMode, setUseDemoMode] = useState(true); // Set to true to force demo
```

However, the app will automatically switch to Live Mode when backend is detected.

## Next Steps

1. **Explore the UI** in Demo Mode to understand the dashboard
2. **Review the code** to understand how detection works
3. **Start the backend** to use real computer vision models
4. **Configure settings** for your specific use case
5. **Deploy to production** with proper security measures

## Architecture

```
┌─────────────────────────────────────────────┐
│      Browser (Next.js React App)            │
│  ┌──────────────────────────────────────┐   │
│  │  Demo Mode                           │   │
│  │  - Camera → Canvas                   │   │
│  │  - Simulated Detections              │   │
│  │  - Mock Violations                   │   │
│  │  - Local Incident Logging            │   │
│  └──────────────────────────────────────┘   │
│                   ↓ (or)                     │
│  ┌──────────────────────────────────────┐   │
│  │  Live Mode                           │   │
│  │  - Camera → Canvas                   │   │
│  │  - WebSocket to Backend              │   │
│  │  - YOLOv10 Detections                │   │
│  │  - Database Logging                  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
         ↓ (when Live Mode)
┌─────────────────────────────────────────────┐
│      FastAPI Backend (Port 8000)            │
│  ┌──────────────────────────────────────┐   │
│  │  - YOLOv10-n Model                   │   │
│  │  - MediaPipe Drowsiness Detection    │   │
│  │  - SQLite Database                   │   │
│  │  - WebSocket Server                  │   │
│  │  - Incident Logging                  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

**Demo Mode is a powerful feature for development, testing, and demonstrations!**
