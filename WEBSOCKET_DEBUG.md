# WebSocket Connection Troubleshooting Guide

## Error: "WebSocket connection failed"

The error you encountered (`WebSocket error: [object Event]`) indicates the frontend cannot connect to the backend server over WebSocket. This guide will help you diagnose and fix the issue.

---

## Quick Diagnosis Checklist

- [ ] Is the **backend server running**?
- [ ] Is port **8000 accessible**?
- [ ] Is **CORS properly configured**?
- [ ] Are **firewall rules** blocking the connection?
- [ ] Is the **WebSocket URL correct**?

---

## Step-by-Step Debugging

### 1. Verify Backend is Running

**Check if backend process is active:**

**Windows:**
```cmd
netstat -ano | findstr :8000
```

**macOS/Linux:**
```bash
lsof -i :8000
```

**Expected output:** Should show a process listening on port 8000

**If nothing shows:**
- Backend is NOT running
- Go to next step: Start the backend

### 2. Start the Backend

**Option A: Using startup script**
```bash
# Windows
start-backend.bat

# macOS/Linux
./start-backend.sh
```

**Option B: Manual start**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Expected output:**
```
[v0] Starting Safety Detection Backend
[v0] ✓ YOLOv10-n model loaded
[v0] ✓ Database initialized
[v0] ✓ Backend initialization complete
[v0] ✓ API running on http://0.0.0.0:8000
[v0] ✓ WebSocket available at ws://localhost:8000/ws
```

### 3. Test API Health Endpoint

Once backend is running, test connectivity:

**Terminal/Command Prompt:**
```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "detector": "loaded",
  "timestamp": "2026-02-20T15:30:45.123456"
}
```

**If request fails:**
- Backend is running but not responding
- Check for errors in backend logs
- Try restarting backend

### 4. Test WebSocket Connection

Use browser DevTools to test WebSocket:

1. Open http://localhost:3000 in Chrome/Firefox
2. Open Developer Tools (F12)
3. Go to Console tab
4. Paste this code:

```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('[v0] WebSocket connected successfully!');
  ws.close();
};

ws.onerror = (error) => {
  console.error('[v0] WebSocket error:', error);
  console.error('[v0] Check if backend is running on http://localhost:8000');
};

ws.onclose = () => {
  console.log('[v0] WebSocket closed');
};
```

**Expected console output:**
```
[v0] WebSocket connected successfully!
[v0] WebSocket closed
```

**If you see error:**
- Note the exact error message
- Proceed to troubleshooting section below

---

## Common Issues & Solutions

### Issue: "Connection refused"

**Cause:** Backend is not running or port 8000 is blocked

**Solution:**
1. Verify backend is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. If not running, start it:
   ```bash
   cd backend && python main.py
   ```

3. Check firewall:
   - Windows Defender: Allow Python through firewall
   - macOS: System Preferences > Security & Privacy > Firewall
   - Linux: `sudo ufw allow 8000`

### Issue: "Connection timeout"

**Cause:** Network connectivity issue or backend hung

**Solution:**
1. Check backend is responsive:
   ```bash
   curl -v http://localhost:8000/health
   ```

2. Look for errors in backend console

3. Restart backend:
   ```bash
   # Kill existing process
   pkill -f "python main.py"
   
   # Start fresh
   cd backend && python main.py
   ```

### Issue: "Connection closed abnormally"

**Cause:** Backend crashed or connection was terminated

**Solution:**
1. Check backend logs for crashes
2. Verify you allowed camera permissions
3. Check system resources aren't exhausted:
   ```bash
   # macOS/Linux
   htop
   
   # Windows - open Task Manager
   tasklist
   ```

### Issue: CORS Error

**Cause:** Browser CORS policy blocking cross-origin WebSocket

**Solution:** Already configured in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production: Change to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, restrict origins:
```python
allow_origins=["http://yourdomain.com", "https://yourdomain.com"],
```

### Issue: Port 8000 Already in Use

**Cause:** Another application is using port 8000

**Solution:**
1. Find what's using the port:
   ```bash
   # macOS/Linux
   lsof -i :8000
   
   # Windows
   netstat -ano | findstr :8000
   ```

2. Kill the process (replace <PID> with actual PID):
   ```bash
   # macOS/Linux
   kill -9 <PID>
   
   # Windows
   taskkill /PID <PID> /F
   ```

3. Or use a different port - edit `backend/main.py`:
   ```python
   if __name__ == "__main__":
       import uvicorn
       uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed from 8000
   ```

   And update frontend `app/components/VideoFeed.tsx`:
   ```typescript
   wsUrl = 'ws://localhost:8001/ws'  // Changed from 8000
   ```

---

## Advanced Debugging

### Enable Backend Debug Logging

Set environment variable:
```bash
# macOS/Linux
export DEBUG=1
python main.py

# Windows
set DEBUG=1
python main.py
```

### Monitor Network Traffic

**Using browser DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by WS (WebSocket)
4. Look for `/ws` connection

**Using command line tools:**
```bash
# Monitor port 8000 traffic (Linux)
sudo tcpdump -i lo port 8000

# Or use netstat
netstat -an | grep 8000
```

### Check Backend Logs

```bash
# View last 20 lines of log
cd backend
tail -20 logs/detection.log

# Or run with logging to file
python main.py 2>&1 | tee backend.log
```

---

## WebSocket Message Format

If connection works but frames don't transfer, verify message format:

**Frontend sends:**
```json
{
  "frame": "base64_encoded_jpeg_data_here..."
}
```

**Backend responds:**
```json
{
  "frame": "base64_encoded_annotated_frame...",
  "detections": [
    {
      "class": "hard_hat",
      "confidence": 0.92,
      "bbox": [100, 50, 200, 150]
    }
  ],
  "violations": [
    {
      "type": "missing_hard_hat",
      "confidence": 0.85,
      "bbox": [150, 100, 250, 300],
      "timestamp": "2026-02-20T15:30:45"
    }
  ],
  "drowsiness": {
    "detected": false,
    "confidence": 0.1
  }
}
```

---

## Production WebSocket Setup

### Use WSS (Secure WebSocket)

1. Generate SSL certificates:
```bash
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

2. Update backend `main.py`:
```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="key.pem",
        ssl_certfile="cert.pem"
    )
```

3. Update frontend URL:
```typescript
wsUrl = 'wss://yourdomain.com/ws'  // WSS for secure
```

### Load Balancer / Reverse Proxy

If using Nginx:
```nginx
location /ws {
    proxy_pass http://localhost:8000/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## Performance Optimization

If connection works but frames are slow:

### Reduce Frame Size
```typescript
// VideoFeed.tsx
video: {
  width: { ideal: 640 },    // was 1280
  height: { ideal: 480 },   // was 720
}
```

### Lower FPS
```typescript
// VideoFeed.tsx
<VideoFeed fpsLimit={15} />  // was 30
```

### Reduce JPEG Quality
```python
# backend/main.py, around line 150
canvas.toBlob(callback, 'image/jpeg', 0.6)  # was 0.85
```

---

## Still Not Working?

1. **Collect debug information:**
   ```bash
   # Check backend health
   curl http://localhost:8000/health
   
   # Test WebSocket directly
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:8000/ws
   ```

2. **Check system resources:**
   - RAM: Should have 4GB+ free
   - CPU: Should not be maxed out
   - Disk: Need 500MB+ free

3. **Try fresh start:**
   ```bash
   # Kill backend
   pkill -f "python main.py"
   
   # Kill frontend
   pkill -f "next dev"
   
   # Clear cache
   rm -rf .next node_modules/.cache backend/__pycache__
   
   # Restart
   npm run dev
   ./start-backend.sh
   ```

4. **Check browser compatibility:**
   - WebSocket requires modern browser (Chrome 16+, Firefox 11+, Safari 6+)
   - Try different browser
   - Clear browser cache

---

## Quick Reference

| Check | Command | Expected |
|-------|---------|----------|
| Backend running | `curl http://localhost:8000/health` | 200 OK with JSON |
| Port available | `lsof -i :8000` | Shows backend process |
| WebSocket URL | Check DevTools Network tab | `ws://localhost:8000/ws` |
| Models loaded | View backend console | "✓ Model loaded" |
| Database created | Check `backend/incidents.db` exists | File should exist |

---

## Next Steps

Once WebSocket connects:
1. Click "Start Camera" button
2. Allow camera permissions
3. Watch live detection start
4. Check Incident Log for captured violations
5. Review statistics for trends

If still having issues, please provide:
- Backend console output (last 20 lines)
- Browser console errors (F12 > Console)
- Output of `curl http://localhost:8000/health`
