'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import VideoFeed from './components/VideoFeed';
import AlertBanner from './components/AlertBanner';
import IncidentLog from './components/IncidentLog';
import Statistics from './components/Statistics';
import BackendSetupGuide from './components/BackendSetupGuide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Violation {
  type: string;
  confidence: number;
  bbox: number[];
  timestamp: string;
}

interface Alert {
  id: string;
  type: string;
  confidence: number;
  timestamp: Date;
}

export default function Home() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(true);
  const alertIdRef = useRef<number>(0);

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/health', {
          method: 'GET',
        });
        setBackendConnected(response.ok);
        if (response.ok) {
          setUseDemoMode(false); // Use real backend if available
        }
      } catch (error) {
        console.log('[v0] Backend not available, using demo mode:', error);
        setBackendConnected(false);
        setUseDemoMode(true); // Fallback to demo mode
      }
    };

    checkBackend();
  }, []);

  const handleViolationDetected = useCallback((violation: Violation) => {
    const alert: Alert = {
      id: `alert-${alertIdRef.current++}`,
      type: violation.type,
      confidence: violation.confidence,
      timestamp: new Date(),
    };

    setAlerts((prev) => {
      // Keep only last 3 alerts
      const updated = [...prev, alert];
      return updated.slice(Math.max(0, updated.length - 3));
    });
  }, []);

  const handleDismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);



  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Smart Safety Detection
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time PPE monitoring and industrial safety analytics
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Mode: <span className="font-mono font-bold">{useDemoMode ? 'DEMO' : 'LIVE'}</span>
              </p>
              <p className={`text-xs font-semibold mt-1 ${useDemoMode ? 'text-yellow-600' : backendConnected ? 'text-green-600' : 'text-orange-600'}`}>
                {useDemoMode ? 'Demo Mode Active' : backendConnected ? '✓ Backend Connected' : 'No Backend'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      <AlertBanner alerts={alerts} onDismiss={handleDismissAlert} autoDismissMs={5000} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="monitor" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="monitor">📹 Live Monitor</TabsTrigger>
            <TabsTrigger value="incidents">📋 Incident Log</TabsTrigger>
            <TabsTrigger value="statistics">📊 Statistics</TabsTrigger>
          </TabsList>

          {/* Live Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Live Camera Feed</h2>
                  <p className="text-gray-600 mb-4">
                    {useDemoMode 
                      ? "Demo Mode Active: Simulated PPE detections and violations for testing. Start the backend server to enable real AI-powered detection with YOLOv10 and MediaPipe."
                      : "Real-time video stream with AI-powered PPE detection and violation alerts. The system analyzes each frame to detect missing hard hats, safety vests, and drowsiness indicators."
                    }
                  </p>
                </div>
                <VideoFeed
                  onViolationDetected={handleViolationDetected}
                  wsUrl="ws://localhost:8000/ws"
                  fpsLimit={30}
                  demoMode={useDemoMode}
                />
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Detection Model</p>
                  <p className="text-lg font-semibold text-blue-600">YOLOv10-n (Nano)</p>
                  <p className="text-gray-500 text-xs">Optimized for edge devices</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Target FPS</p>
                  <p className="text-lg font-semibold text-green-600">30 FPS</p>
                  <p className="text-gray-500 text-xs">Smooth real-time processing</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Drowsiness Detection</p>
                  <p className="text-lg font-semibold text-orange-600">MediaPipe</p>
                  <p className="text-gray-500 text-xs">Eye aspect ratio analysis</p>
                </div>
              </div>
            </Card>

            {/* Setup Instructions */}
            <Card className={`p-6 ${useDemoMode ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
              <h3 className={`text-xl font-bold mb-4 ${useDemoMode ? 'text-yellow-900' : 'text-blue-900'}`}>
                {useDemoMode ? '🎬 Demo Mode Active' : '⚙️ Getting Started'}
              </h3>
              <div className={`space-y-3 text-sm ${useDemoMode ? 'text-yellow-900' : 'text-blue-900'}`}>
                {useDemoMode ? (
                  <>
                    <p>
                      Currently running in <strong>Demo Mode</strong> - the camera feed is simulating random PPE detections
                      and violations without a backend server.
                    </p>
                    <p>
                      <strong>To use real detection:</strong>
                    </p>
                    <div className="bg-white p-3 rounded font-mono text-xs border border-yellow-200 space-y-2">
                      <div>1. cd backend</div>
                      <div>2. pip install -r requirements.txt</div>
                      <div>3. python main.py</div>
                    </div>
                    <p>
                      Then refresh the page and the backend will automatically be detected and used.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Backend Status:</strong> Connected and running
                    </p>
                    <p>
                      <strong>Step 1:</strong> Allow camera access when prompted by the browser.
                    </p>
                    <p>
                      <strong>Step 2:</strong> Real-time PPE detection will begin automatically.
                    </p>
                    <p>
                      <strong>Note:</strong> All detections are logged to the SQLite database for analysis.
                    </p>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Incident Log Tab */}
          <TabsContent value="incidents">
            <Card className="p-6">
              <IncidentLog apiUrl="http://localhost:8000" refreshInterval={5000} />
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <Card className="p-6">
              <Statistics apiUrl="http://localhost:8000" refreshInterval={10000} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-3">About</h4>
              <p className="text-sm text-gray-400">
                Smart Safety Detection uses computer vision to monitor workplace safety in real-time.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Detections</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>✓ Missing Hard Hat</li>
                <li>✓ Missing Safety Vest</li>
                <li>✓ Drowsiness Detection</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Technology</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>YOLOv10-n for PPE detection</li>
                <li>MediaPipe for facial analysis</li>
                <li>FastAPI + SQLite backend</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-center text-sm text-gray-500">
              Smart Safety Detection © 2024 | Workplace Safety Solution
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
