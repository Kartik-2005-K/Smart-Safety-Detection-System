'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Loader2, Copy, ExternalLink } from 'lucide-react';

interface BackendSetupGuideProps {
  onRetry: () => void;
}

export default function BackendSetupGuide({ onRetry }: BackendSetupGuideProps) {
  const [copied, setCopied] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testBackendConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('testing');
    
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
      });
      
      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('failed');
      }
    } catch (error) {
      console.log('[v0] Connection test failed:', error);
      setConnectionStatus('failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const osType = typeof window !== 'undefined' ? 
    (navigator.userAgent.includes('Win') ? 'windows' : 
     navigator.userAgent.includes('Mac') ? 'mac' : 'linux') : 'windows';

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          The backend server is not running. Follow these steps to start it.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Backend Setup Instructions</CardTitle>
          <CardDescription>Get the detection server running in 3 steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Step 1: Open Terminal/Command Prompt</h3>
            <p className="text-sm text-gray-600">
              {osType === 'windows' 
                ? 'Press Win+R, type "cmd", and press Enter' 
                : 'Open Terminal from Applications > Utilities'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Step 2: Navigate to Project Directory</h3>
            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm overflow-x-auto">
              <code>cd /path/to/smart-safety-detection</code>
            </div>
            <p className="text-sm text-gray-600">Replace the path with your actual project directory</p>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Step 3: Start Backend Server</h3>
            
            {osType === 'windows' ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Run the batch script:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm flex items-center justify-between">
                  <code>start-backend.bat</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-100 hover:bg-gray-700"
                    onClick={() => copyToClipboard('start-backend.bat')}
                  >
                    {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">Run the shell script:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm flex items-center justify-between">
                  <code>./start-backend.sh</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-100 hover:bg-gray-700"
                    onClick={() => copyToClipboard('./start-backend.sh')}
                  >
                    {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> On first run, the YOLOv10-n model will download (~100MB). This may take 1-2 minutes.
              </p>
            </div>
          </div>

          {/* Manual Alternative */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm">Alternative: Manual Python Setup</h3>
            <div className="space-y-2 text-sm">
              <p>If the scripts don't work, run these commands manually:</p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs space-y-1">
                <div>python -m venv venv</div>
                <div>{osType === 'windows' ? 'venv\\Scripts\\activate' : 'source venv/bin/activate'}</div>
                <div>pip install -r backend/requirements.txt</div>
                <div>cd backend && python main.py</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test Connection</CardTitle>
          <CardDescription>Verify the backend is running</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            After starting the backend, click below to verify the connection:
          </p>
          
          <Button
            onClick={testBackendConnection}
            disabled={testingConnection}
            className="w-full"
            variant={connectionStatus === 'success' ? 'outline' : 'default'}
          >
            {testingConnection ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : connectionStatus === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Connection Successful!
              </>
            ) : (
              'Test Backend Connection'
            )}
          </Button>

          {connectionStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Backend is running! Click "Retry" to reconnect to the video feed.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === 'failed' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Backend is not responding on http://localhost:8000. Please check the terminal where you started the backend.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Helpful Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="/getting-started" className="text-sm text-blue-600 hover:underline flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Detailed Getting Started Guide
          </a>
          <a href="#" className="text-sm text-blue-600 hover:underline flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Read QUICK_START.md for rapid setup
          </a>
          <a href="#" className="text-sm text-blue-600 hover:underline flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            View WEBSOCKET_DEBUG.md for troubleshooting
          </a>
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Backend API Documentation (once running)
          </a>
        </CardContent>
      </Card>

      {/* Retry Button */}
      {connectionStatus === 'success' && (
        <Button onClick={onRetry} className="w-full" size="lg">
          Proceed to Camera Feed
        </Button>
      )}
    </div>
  );
}
