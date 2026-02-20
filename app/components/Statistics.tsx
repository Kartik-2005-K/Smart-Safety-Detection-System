'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Clock, Activity } from 'lucide-react';

interface Stats {
  total_violations: number;
  by_type: Record<string, number>;
  avg_confidence: number;
  period_hours: number;
  timestamp: string;
}

interface StatisticsProps {
  apiUrl?: string;
  refreshInterval?: number;
}

export default function Statistics({
  apiUrl = 'http://localhost:8000',
  refreshInterval = 10000,
}: StatisticsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/statistics?hours=24`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(message);
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, apiUrl]);

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'missing_hard_hat':
        return 'text-red-600 bg-red-50';
      case 'missing_safety_vest':
        return 'text-orange-600 bg-orange-50';
      case 'drowsiness_detected':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatViolationType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-gray-500 text-center py-8">Loading statistics...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Safety Statistics</h2>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
        >
          {loading ? '⟳' : '🔄'}
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Violations */}
        <div className="bg-white border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Violations</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.total_violations}
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-200" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Last 24 hours</p>
        </div>

        {/* Average Confidence */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Confidence</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {(stats.avg_confidence * 100).toFixed(0)}%
              </p>
            </div>
            <Activity className="h-12 w-12 text-blue-200" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Detection accuracy</p>
        </div>

        {/* Violations per Hour */}
        <div className="bg-white border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Per Hour</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {(stats.total_violations / Math.max(stats.period_hours, 1)).toFixed(1)}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-orange-200" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Average rate</p>
        </div>

        {/* Status */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Status</p>
              <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
              <p className="text-xs text-gray-500 mt-1">Monitoring 24/7</p>
            </div>
            <Clock className="h-12 w-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Violation Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Violations by Type</h3>
        <div className="space-y-3">
          {Object.entries(stats.by_type).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No violations recorded</p>
          ) : (
            Object.entries(stats.by_type)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage = (
                  (count / stats.total_violations) *
                  100
                ).toFixed(0);
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`font-medium text-sm px-3 py-1 rounded ${getViolationColor(type)}`}>
                        {formatViolationType(type)}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg">{count}</span>
                        <span className="text-gray-500 text-sm ml-2">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          type === 'missing_hard_hat'
                            ? 'bg-red-500'
                            : type === 'missing_safety_vest'
                              ? 'bg-orange-500'
                              : type === 'drowsiness_detected'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
