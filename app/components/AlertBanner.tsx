'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Eye, Shield } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  confidence: number;
  timestamp: Date;
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
  autoDismissMs?: number;
}

export default function AlertBanner({
  alerts,
  onDismiss,
  autoDismissMs = 5000,
}: AlertBannerProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    setVisibleAlerts(alerts);

    if (alerts.length > 0 && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setVisibleAlerts([]);
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [alerts, autoDismissMs]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'missing_hard_hat':
        return <Shield className="h-5 w-5" />;
      case 'missing_safety_vest':
        return <Shield className="h-5 w-5" />;
      case 'drowsiness_detected':
        return <Eye className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'missing_hard_hat':
        return 'bg-red-600 border-red-700';
      case 'missing_safety_vest':
        return 'bg-orange-600 border-orange-700';
      case 'drowsiness_detected':
        return 'bg-yellow-600 border-yellow-700';
      default:
        return 'bg-red-600 border-red-700';
    }
  };

  const formatViolationType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`${getAlertColor(alert.type)} text-white rounded-lg shadow-lg p-4 animate-pulse border-2 flex items-start gap-3`}
        >
          <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">⚠️ Safety Violation Detected!</h3>
            <p className="text-sm mt-1">{formatViolationType(alert.type)}</p>
            <p className="text-xs mt-1 opacity-90">
              Confidence: {(alert.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-xs mt-1 opacity-75">
              {alert.timestamp.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => {
              onDismiss?.(alert.id);
              setVisibleAlerts(visibleAlerts.filter((a) => a.id !== alert.id));
            }}
            className="text-white hover:text-gray-200 font-bold text-xl flex-shrink-0"
            aria-label="Dismiss alert"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
