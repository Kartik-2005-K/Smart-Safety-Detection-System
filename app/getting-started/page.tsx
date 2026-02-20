import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Terminal, Zap, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function GettingStarted() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Getting Started
          </h1>
          <p className="text-gray-600 mt-1">
            Set up and run the Smart Safety Detection system
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Quick Start (30 seconds)
            </CardTitle>
            <CardDescription>
              Get the backend running immediately
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-2">Option 1: Python Script (Recommended)</p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                  <code>python run_backend.py</code>
                </div>
                <p className="text-sm text-gray-600 mt-2">This script will handle virtual environment setup and dependencies automatically.</p>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Option 2: Batch/Shell Script</p>
                <p className="text-sm text-gray-600 mb-2">Windows:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm mb-3">
                  <code>start-backend.bat</code>
                </div>
                <p className="text-sm text-gray-600 mb-2">macOS/Linux:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                  <code>./start-backend.sh</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Detailed Setup Steps
            </CardTitle>
            <CardDescription>
              Manual setup if you prefer more control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">1</span>
                Create Virtual Environment
              </h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm space-y-1">
                <div>python -m venv venv</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Or use: <code className="bg-gray-100 px-2 py-1 rounded">python3 -m venv venv</code>
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">2</span>
                Activate Virtual Environment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Windows:</p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                    <code>venv\Scripts\activate</code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">macOS/Linux:</p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                    <code>source venv/bin/activate</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">3</span>
                Install Dependencies
              </h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm space-y-1">
                <div>pip install -r backend/requirements.txt</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                This installs FastAPI, YOLOv10, MediaPipe, and other dependencies (~500MB).
              </p>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">4</span>
                Start Backend Server
              </h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm space-y-1">
                <div>cd backend</div>
                <div>python main.py</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Server will start on <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8000</code>
              </p>
            </div>

            {/* Step 5 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">5</span>
                Open Dashboard
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                In a new terminal (keep backend running), start the frontend:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm space-y-1">
                <div>npm run dev</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Open <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000</code> in your browser
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-orange-900">
            <p>
              <strong>First Run:</strong> YOLOv10-n model will download on first startup (~100MB). This may take 1-2 minutes.
            </p>
            <p>
              <strong>Keep Terminals Open:</strong> Both backend (port 8000) and frontend (port 3000) must be running simultaneously.
            </p>
            <p>
              <strong>Camera Access:</strong> Browser will request camera permission. Grant access for detection to work.
            </p>
            <p>
              <strong>System Requirements:</strong> 4GB RAM minimum, 1GB free disk space (for models), modern CPU recommended.
            </p>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Port Already in Use</h4>
              <p className="text-sm text-gray-600 mb-2">
                If port 8000 is already in use, modify the backend port in <code className="bg-gray-100 px-2 py-1 rounded">backend/main.py</code>
              </p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                <code>uvicorn.run(app, host="0.0.0.0", port=8001)</code>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">No Camera Access</h4>
              <p className="text-sm text-gray-600">
                Ensure you granted camera permission when prompted. Check browser settings and reload the page.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Models Not Downloading</h4>
              <p className="text-sm text-gray-600 mb-2">
                Check internet connection. YOLOv10-n model downloads from Hugging Face. May take 2-3 minutes on first run.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">WebSocket Connection Failed</h4>
              <p className="text-sm text-gray-600">
                Ensure backend is running and check the browser console for detailed error messages.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation & Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">
              For more detailed information, refer to these documentation files:
            </p>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:underline font-medium text-sm">
                  README.md - Complete project overview
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline font-medium text-sm">
                  SETUP.md - Detailed installation guide
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline font-medium text-sm">
                  QUICK_START.md - Quick reference card
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline font-medium text-sm">
                  WEBSOCKET_DEBUG.md - WebSocket troubleshooting
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex gap-4">
          <Link href="/" className="flex-1">
            <Button className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
