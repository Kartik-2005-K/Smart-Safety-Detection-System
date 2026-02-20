'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, Shield, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Incident {
  id: number;
  timestamp: string;
  violation_type: string;
  confidence: number;
  frame_width: number;
  frame_height: number;
  bbox_data: string;
  duration_seconds: number;
  resolved: string;
}

interface IncidentLogProps {
  apiUrl?: string;
  refreshInterval?: number;
}

export default function IncidentLog({
  apiUrl = 'http://localhost:8000',
  refreshInterval = 5000,
}: IncidentLogProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/incidents?hours=24&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const data = await response.json();
      setIncidents(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load incidents';
      setError(message);
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, apiUrl]);

  const markResolved = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/api/incidents/${id}/resolve`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to resolve incident');
      fetchIncidents();
    } catch (err) {
      console.error('Error resolving incident:', err);
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'missing_hard_hat':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'missing_safety_vest':
        return <Shield className="h-4 w-4 text-orange-600" />;
      case 'drowsiness_detected':
        return <Eye className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-semibold';
    switch (status) {
      case 'resolved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Resolved</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Pending</span>;
      case 'false_alarm':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>False Alarm</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredIncidents = incidents.filter(
    (incident) =>
      filter === 'all' || incident.violation_type === filter || incident.resolved === filter
  );

  const violationTypes = [...new Set(incidents.map((i) => i.violation_type))];

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Incident Log</h2>
        <button
          onClick={fetchIncidents}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '⟳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({incidents.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending ({incidents.filter((i) => i.resolved === 'pending').length})
        </button>
        {violationTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="w-12">Type</TableHead>
              <TableHead>Violation</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead className="text-center">Duration</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  {incidents.length === 0
                    ? 'No incidents recorded'
                    : 'No incidents match the selected filter'}
                </TableCell>
              </TableRow>
            ) : (
              filteredIncidents.map((incident) => (
                <TableRow key={incident.id} className="border-b hover:bg-gray-50">
                  <TableCell>{getViolationIcon(incident.violation_type)}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {incident.violation_type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(incident.timestamp)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-blue-600">
                      {(incident.confidence * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {incident.duration_seconds.toFixed(2)}s
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(incident.resolved)}
                  </TableCell>
                  <TableCell className="text-center">
                    {incident.resolved === 'pending' && (
                      <button
                        onClick={() => markResolved(incident.id)}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="Mark as resolved"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {incidents.filter((i) => i.resolved === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {incidents.filter((i) => i.resolved === 'resolved').length}
          </div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {incidents.length}
          </div>
          <div className="text-sm text-gray-600">Total (24h)</div>
        </div>
      </div>
    </div>
  );
}
