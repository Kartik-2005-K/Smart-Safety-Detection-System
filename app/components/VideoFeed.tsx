'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Detection {
  class: string;
  confidence: number;
  bbox: number[];
  xyxy?: number[];
}

interface Violation {
  type: string;
  confidence: number;
  bbox: number[];
  timestamp: string;
}

interface DrowsinessAlert {
  detected: boolean;
  confidence: number;
}

interface WebSocketMessage {
  frame: string;
  detections: Detection[];
  violations: Violation[];
  drowsiness: DrowsinessAlert;
}

interface VideoFeedProps {
  onViolationDetected?: (violation: Violation) => void;
  wsUrl?: string;
  fpsLimit?: number;
  demoMode?: boolean;
}

export default function VideoFeed({
  onViolationDetected,
  wsUrl = 'ws://localhost:8000/ws',
  fpsLimit = 30,
  demoMode = false,
}: VideoFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const demoModeRef = useRef<boolean>(demoMode);
  const demoFrameCountRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ fps: 0, latency: 0 });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [usingDemoMode, setUsingDemoMode] = useState(false);

  const frameIntervalMs = 1000 / fpsLimit;
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const wsReconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // Demo mode: simulate detections without backend
  const runDemoMode = useCallback(() => {
    if (!demoModeRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get current video frame
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      demoFrameCountRef.current++;

      // Simulate random detections every 5 frames
      const mockDetections: Detection[] = [];
      const mockViolations: Violation[] = [];

      if (demoFrameCountRef.current % 5 === 0) {
        // Randomly generate detection
        if (Math.random() > 0.6) {
          const x = Math.random() * (canvas.width - 200);
          const y = Math.random() * (canvas.height - 200);
          const w = 100 + Math.random() * 100;
          const h = 100 + Math.random() * 100;
          const classes = ['person', 'hard_hat', 'safety_vest'];
          const selectedClass = classes[Math.floor(Math.random() * classes.length)];
          const confidence = 0.75 + Math.random() * 0.25;

          mockDetections.push({
            class: selectedClass,
            confidence,
            bbox: [x, y, w, h],
            xyxy: [x, y, x + w, y + h],
          });

          // Draw bounding box
          ctx.strokeStyle = confidence > 0.8 ? '#00FF00' : '#FFFF00';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          // Draw label
          ctx.fillStyle = confidence > 0.8 ? '#00FF00' : '#FFFF00';
          ctx.font = '14px Arial';
          ctx.fillText(`${selectedClass} ${(confidence * 100).toFixed(1)}%`, x, y - 5);
        }

        // Simulate violations (20% chance)
        if (Math.random() > 0.8) {
          const x = Math.random() * (canvas.width - 100);
          const y = Math.random() * (canvas.height - 100);
          const violationTypes = ['missing_hard_hat', 'missing_vest', 'drowsiness'];
          const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)];

          const violation: Violation = {
            type: violationType,
            confidence: 0.85 + Math.random() * 0.15,
            bbox: [x, y, 100, 100],
            timestamp: new Date().toISOString(),
          };

          mockViolations.push(violation);
          onViolationDetected?.(violation);

          // Draw violation indicator
          ctx.fillStyle = '#FF0000';
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x, y, 100, 100);
          ctx.globalAlpha = 1.0;
        }
      }

      setDetections(mockDetections);
      if (mockViolations.length > 0) {
        setViolations((prev) => [...prev, ...mockViolations].slice(-10));
      }

      // Draw FPS
      const now = Date.now();
      if (now - lastFrameTimeRef.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
      frameCountRef.current++;

      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`FPS: ${fpsRef.current}`, 10, 30);
      ctx.fillText('[DEMO MODE]', 10, 60);

      animationRef.current = requestAnimationFrame(runDemoMode);
    }
  }, [onViolationDetected]);

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setError(null);

        // Start demo mode animation if enabled
        if (demoModeRef.current) {
          animationRef.current = requestAnimationFrame(runDemoMode);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      setError(`Camera Error: ${message}`);
      console.error('Camera initialization failed:', err);
    }
  }, []);

  // Initialize WebSocket with retry logic
  const initWebSocket = useCallback(() => {
    if (wsReconnectAttemptsRef.current > maxReconnectAttempts) {
      setError('WebSocket connection failed after multiple attempts. Please ensure the backend server is running.');
      return;
    }

    try {
      console.log('[v0] Attempting WebSocket connection to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[v0] WebSocket connected successfully');
        setWsConnected(true);
        wsReconnectAttemptsRef.current = 0;
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          // Update detections and violations
          setDetections(data.detections);
          setViolations(data.violations);

          // Call callback for new violations
          data.violations.forEach((violation) => {
            onViolationDetected?.(violation);
          });

          // Display annotated frame on canvas
          if (data.frame && canvasRef.current) {
            const img = new Image();
            img.onload = () => {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                drawOverlay(ctx, data);
              }
            };
            img.src = `data:image/jpeg;base64,${data.frame}`;
            img.crossOrigin = 'anonymous';
          }
        } catch (parseErr) {
          console.error('[v0] Failed to parse WebSocket message:', parseErr);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('[v0] WebSocket error event:', event);
        console.error('[v0] WebSocket ready state:', wsRef.current?.readyState);
        setWsConnected(false);
        setError('WebSocket connection failed. Ensure backend is running on http://localhost:8000');
      };

      wsRef.current.onclose = () => {
        console.log('[v0] WebSocket closed');
        setWsConnected(false);
        
        // Attempt reconnection with exponential backoff
        if (wsReconnectAttemptsRef.current < maxReconnectAttempts) {
          wsReconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, wsReconnectAttemptsRef.current - 1), 10000);
          console.log(`[v0] Reconnecting in ${delay}ms (attempt ${wsReconnectAttemptsRef.current})`);
          
          wsReconnectTimeoutRef.current = setTimeout(() => {
            initWebSocket();
          }, delay);
        } else {
          // Fallback to demo mode after max reconnection attempts
          console.log('[v0] Max reconnection attempts reached. Enabling demo mode.');
          demoModeRef.current = true;
          setUsingDemoMode(true);
          runDemoMode();
        }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'WebSocket initialization failed';
      console.error('[v0] WebSocket init error:', message);
      setError(`WS Error: ${message}`);
    }
  }, [wsUrl, onViolationDetected]);

  // Draw overlay information on canvas
  const drawOverlay = (ctx: CanvasRenderingContext2D, data: WebSocketMessage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Draw FPS counter
    ctx.fillStyle = '#00FF00';
    ctx.font = '16px Arial';
    ctx.fillText(`FPS: ${fpsRef.current.toFixed(1)}`, 10, 30);

    // Draw violation count
    if (data.violations.length > 0) {
      ctx.fillStyle = '#FF0000';
      ctx.fillText(`Active Violations: ${data.violations.length}`, 10, 60);
    }

    // Draw drowsiness alert
    if (data.drowsiness.detected) {
      ctx.fillStyle = '#FF6600';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`⚠️ DROWSINESS ALERT (${(data.drowsiness.confidence * 100).toFixed(0)}%)`, 10, canvas.height - 20);
    }
  };

  // Process and send frames
  const processAndSendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || !cameraActive) {
      return;
    }

    const now = performance.now();
    if (now - lastFrameTimeRef.current < frameIntervalMs) {
      animationRef.current = requestAnimationFrame(processAndSendFrame);
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Ensure canvas matches video dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to JPEG and send
    canvas.toBlob(
      (blob) => {
        if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then((buffer) => {
            const frame = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            const message = JSON.stringify({ frame });
            wsRef.current?.send(message);

            // Update FPS
            frameCountRef.current++;
            const elapsed = performance.now() - lastFrameTimeRef.current;
            if (elapsed >= 1000) {
              fpsRef.current = frameCountRef.current;
              frameCountRef.current = 0;
              setStats((prev) => ({
                ...prev,
                fps: fpsRef.current,
              }));
              lastFrameTimeRef.current = performance.now();
            } else {
              lastFrameTimeRef.current = now;
            }
          });
        }
      },
      'image/jpeg',
      0.85
    ); // 85% quality for balance between speed and quality

    animationRef.current = requestAnimationFrame(processAndSendFrame);
  }, [cameraActive, frameIntervalMs]);

  // Handle video play to start processing
  const handleVideoPlay = useCallback(() => {
    if (videoRef.current) {
      if (demoModeRef.current) {
        animationRef.current = requestAnimationFrame(runDemoMode);
      } else {
        animationRef.current = requestAnimationFrame(processAndSendFrame);
      }
    }
  }, [processAndSendFrame, runDemoMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
    };
  }, []);

  // Initialize camera and WebSocket
  useEffect(() => {
    demoModeRef.current = demoMode;
    initCamera();
    
    if (demoMode) {
      setUsingDemoMode(true);
      console.log('[v0] Demo mode enabled');
    } else {
      initWebSocket();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initCamera, initWebSocket, demoMode]);

  const toggleCamera = async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        setCameraActive(false);
      }
    } else {
      await initCamera();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Status Indicators */}
      <div className="flex gap-4 items-center text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>Camera: {cameraActive ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${usingDemoMode ? 'bg-yellow-500' : wsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>
            {usingDemoMode ? 'Demo Mode' : `WebSocket: ${wsConnected ? 'Connected' : 'Disconnected'}`}
          </span>
        </div>
        <div className="text-right flex-1">
          <span className="text-gray-600">FPS: {stats.fps}</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onPlay={handleVideoPlay}
        className="hidden"
      />

      {/* Canvas for display */}
      <canvas
        ref={canvasRef}
        className="w-full border-2 border-gray-300 rounded-lg bg-black"
        style={{ aspectRatio: '16 / 9' }}
      />

      {/* Camera Control Button */}
      <button
        onClick={toggleCamera}
        className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-colors ${
          cameraActive
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {cameraActive ? '🛑 Stop Camera' : '📹 Start Camera'}
      </button>

      {/* Active Detections */}
      {detections.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h3 className="font-semibold text-blue-900 mb-2">Detections ({detections.length})</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {detections.map((det, idx) => (
              <div key={idx} className="text-blue-800">
                {det.class}: {(det.confidence * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Violations */}
      {violations.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Active Violations ({violations.length})</h3>
          <div className="space-y-2">
            {violations.map((viol, idx) => (
              <div key={idx} className="bg-red-100 text-red-900 p-2 rounded text-sm">
                <strong>{viol.type.replace(/_/g, ' ').toUpperCase()}</strong>
                <br />
                Confidence: {(viol.confidence * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
