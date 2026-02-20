# Quick Start - Smart Safety Detection

## 30-Second Setup

### 1. Start Backend (Choose One)

**Windows:**
```cmd
start-backend.bat
```

**macOS/Linux:**
```bash
./start-backend.sh
```

**Manual:**
```bash
cd backend && pip install -r requirements.txt && python main.py
```

### 2. Start Frontend (New Terminal)

```bash
npm install && npm run dev
```

### 3. Access Application

Open browser: **http://localhost:3000**

Click "📹 Start Camera" and grant permissions.

---

## Expected Status Indicators

```
✅ Camera: Active
✅ WebSocket: Connected
✅ FPS: 25-30
✅ Detections: Showing bounding boxes
✅ Incidents: Recording violations
```

---

## Common Quick Fixes

### "WebSocket connection failed"
```bash
# Check if backend is running
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","detector":"loaded",...}
```

### "Camera not accessible"
- Check browser camera permissions
- Try different browser (Chrome, Firefox)
- Restart browser

### "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

### "Low FPS / Lagging"
Edit `app/components/VideoFeed.tsx`:
```typescript
// Change this line
<VideoFeed fpsLimit={30} />

// To this (lower FPS)
<VideoFeed fpsLimit={15} />
```

---

## Key URLs

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| API Health | http://localhost:8000/health |
| API Docs | http://localhost:8000/docs |
| WebSocket | ws://localhost:8000/ws |

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server |
| `backend/detection.py` | YOLOv10 + MediaPipe |
| `app/components/VideoFeed.tsx` | Live video feed |
| `app/components/IncidentLog.tsx` | Incident history |
| `backend/incidents.db` | Incident database |

---

## Testing Detection

Once running, test with:
1. **Hard Hat Detection** - Wear a hard hat in front of camera
2. **Vest Detection** - Wear a safety vest
3. **Drowsiness Alert** - Close your eyes for 5+ frames
4. View incidents in "Incident Log" panel

---

## Export Incidents

Via Dashboard:
1. Click "📊 Statistics" tab
2. Click "Download Incidents (CSV)" button
3. Incidents saved as CSV file

Via API:
```bash
curl http://localhost:8000/api/incidents/export > incidents.csv
```

---

## Production Checklist

- [ ] Test all detection scenarios
- [ ] Adjust confidence thresholds if needed
- [ ] Backup incidents.db regularly
- [ ] Add API authentication
- [ ] Enable HTTPS/WSS
- [ ] Deploy to cloud or on-premise
- [ ] Set up monitoring
- [ ] Configure alerting (email/SMS)

---

## Full Documentation

- **Setup Details**: See `SETUP.md`
- **WebSocket Issues**: See `WEBSOCKET_DEBUG.md`
- **Architecture**: See `IMPLEMENTATION_SUMMARY.md`
- **Overview**: See `README.md`

---

## One-Liner Test

```bash
# In backend directory
python -c "from ultralytics import YOLO; print('✓ YOLOv10 Ready'); m = YOLO('yolov10n.pt'); print('✓ Model Loaded')"
```

---

## Stop Services

**Backend:**
- Press `Ctrl+C` in terminal

**Frontend:**
- Press `Ctrl+C` in terminal

---

## Restart Fresh

```bash
# Kill all
pkill -f "python main.py"
pkill -f "next dev"

# Clear cache
rm -rf .next node_modules/.cache backend/__pycache__

# Start fresh
npm install
./start-backend.sh  # or start-backend.bat
npm run dev  # in new terminal
```

---

## Need Help?

1. **WebSocket Issues**: Run tests in WEBSOCKET_DEBUG.md
2. **Camera Issues**: Check SETUP.md troubleshooting
3. **Performance**: Lower FPS or resolution
4. **Backend Errors**: Check console output and logs

---

**Status Check Command:**
```bash
# Quick health check
echo "Backend:" && curl -s http://localhost:8000/health | python -m json.tool
echo "Frontend: http://localhost:3000"
```

---

Remember: Backend must start before frontend!

Backend on port 8000 → Frontend on port 3000 → Browser at localhost:3000
