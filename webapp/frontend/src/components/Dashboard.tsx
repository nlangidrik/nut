import React, { useState, useEffect } from 'react';
import { upsApi, shutdownApi, alertsApi } from '../services/api';
import { 
  Zap, 
  Battery, 
  Clock, 
  Power, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  RefreshCw,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UPSStatus {
  'ups.status'?: string;
  'battery.charge'?: string;
  'battery.runtime'?: string;
  'input.voltage'?: string;
  'output.voltage'?: string;
  'ups.load'?: string;
  'battery.voltage'?: string;
  'battery.temperature'?: string;
}

interface Alert {
  id: number;
  message: string;
  level: 'info' | 'warning' | 'critical';
  timestamp: string;
  is_read: boolean;
}

const Dashboard: React.FC = () => {
  const [upsStatus, setUpsStatus] = useState<UPSStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [shutdownLoading, setShutdownLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const [statusResponse, alertsResponse] = await Promise.all([
        upsApi.getStatus(),
        alertsApi.getAll()
      ]);

      if (statusResponse.data.success) {
        setUpsStatus(statusResponse.data.data);
      }

      if (alertsResponse.data.success) {
        setAlerts(alertsResponse.data.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch UPS status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleManualShutdown = async () => {
    if (!window.confirm('Are you sure you want to initiate shutdown for all devices?')) {
      return;
    }

    setShutdownLoading(true);
    try {
      await shutdownApi.manual();
      toast.success('Shutdown initiated for all devices');
    } catch (error) {
      toast.error('Failed to initiate shutdown');
    } finally {
      setShutdownLoading(false);
    }
  };

  const markAlertRead = async (alertId: number) => {
    try {
      await alertsApi.markRead(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      toast.error('Failed to mark alert as read');
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ol') && !statusLower.includes('ob')) {
      return 'status-online';
    } else if (statusLower.includes('ob')) {
      return 'status-battery';
    } else {
      return 'status-critical';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ol') && !statusLower.includes('ob')) {
      return <CheckCircle className="h-5 w-5 text-success-500" />;
    } else if (statusLower.includes('ob')) {
      return <Battery className="h-5 w-5 text-warning-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-danger-500" />;
    }
  };

  const formatRuntime = (runtime: string) => {
    const seconds = parseInt(runtime);
    if (isNaN(seconds)) return 'Unknown';
    
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UPS Dashboard</h1>
          <p className="text-gray-600">
            {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleManualShutdown}
            disabled={shutdownLoading}
            className="btn-danger flex items-center"
          >
            {shutdownLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            Emergency Shutdown
          </button>
        </div>
      </div>

      {/* UPS Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-2xl font-bold text-gray-900">
                {upsStatus?.['ups.status'] || 'Unknown'}
              </p>
            </div>
            {upsStatus?.['ups.status'] && getStatusIcon(upsStatus['ups.status'])}
          </div>
          {upsStatus?.['ups.status'] && (
            <span className={`mt-2 ${getStatusColor(upsStatus['ups.status'])}`}>
              {upsStatus['ups.status'].includes('OL') ? 'Online' : 'On Battery'}
            </span>
          )}
        </div>

        {/* Battery Level */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Battery Level</p>
              <p className="text-2xl font-bold text-gray-900">
                {upsStatus?.['battery.charge'] ? `${upsStatus['battery.charge']}%` : 'Unknown'}
              </p>
            </div>
            <Battery className="h-8 w-8 text-primary-600" />
          </div>
          {upsStatus?.['battery.charge'] && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${upsStatus['battery.charge']}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Runtime */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Runtime</p>
              <p className="text-2xl font-bold text-gray-900">
                {upsStatus?.['battery.runtime'] ? formatRuntime(upsStatus['battery.runtime']) : 'Unknown'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        {/* Load */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Load</p>
              <p className="text-2xl font-bold text-gray-900">
                {upsStatus?.['ups.load'] ? `${upsStatus['ups.load']}%` : 'Unknown'}
              </p>
            </div>
            <Zap className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voltage Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Voltage Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Input Voltage:</span>
              <span className="font-medium">
                {upsStatus?.['input.voltage'] ? `${upsStatus['input.voltage']}V` : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Output Voltage:</span>
              <span className="font-medium">
                {upsStatus?.['output.voltage'] ? `${upsStatus['output.voltage']}V` : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Battery Voltage:</span>
              <span className="font-medium">
                {upsStatus?.['battery.voltage'] ? `${upsStatus['battery.voltage']}V` : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Battery Temperature:</span>
              <span className="font-medium">
                {upsStatus?.['battery.temperature'] ? `${upsStatus['battery.temperature']}°C` : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent alerts</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.level === 'critical'
                      ? 'border-danger-200 bg-danger-50'
                      : alert.level === 'warning'
                      ? 'border-warning-200 bg-warning-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!alert.is_read && (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 