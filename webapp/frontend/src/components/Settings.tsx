import React, { useState, useEffect } from 'react';
import { configApi } from '../services/api';
import { Save, Server, Bell, Power } from 'lucide-react';
import toast from 'react-hot-toast';

interface Config {
  nut_server: {
    host: string;
    port: number;
    ups_name: string;
  };
  alerts: {
    battery_low_threshold: number;
    runtime_low_threshold: number;
    power_failure_delay: number;
  };
  shutdown: {
    auto_shutdown_enabled: boolean;
    battery_threshold: number;
    runtime_threshold: number;
  };
}

const Settings: React.FC = () => {
  const [config, setConfig] = useState<Config>({
    nut_server: {
      host: 'localhost',
      port: 3493,
      ups_name: 'ups',
    },
    alerts: {
      battery_low_threshold: 20,
      runtime_low_threshold: 5,
      power_failure_delay: 60,
    },
    shutdown: {
      auto_shutdown_enabled: true,
      battery_threshold: 15,
      runtime_threshold: 10,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const response = await configApi.get();
      if (response.data.success) {
        setConfig(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await configApi.update(config);
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof Config, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-primary flex items-center"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Configuration
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* NUT Server Configuration */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Server className="h-5 w-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">NUT Server Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server Host
              </label>
              <input
                type="text"
                required
                className="input"
                value={config.nut_server.host}
                onChange={(e) => updateConfig('nut_server', 'host', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server Port
              </label>
              <input
                type="number"
                required
                className="input"
                value={config.nut_server.port}
                onChange={(e) => updateConfig('nut_server', 'port', parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPS Name
              </label>
              <input
                type="text"
                required
                className="input"
                value={config.nut_server.ups_name}
                onChange={(e) => updateConfig('nut_server', 'ups_name', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Alert Configuration */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-warning-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Alert Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Battery Low Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                className="input"
                value={config.alerts.battery_low_threshold}
                onChange={(e) => updateConfig('alerts', 'battery_low_threshold', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Alert when battery level drops below this percentage
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Runtime Low Threshold (minutes)
              </label>
              <input
                type="number"
                min="1"
                required
                className="input"
                value={config.alerts.runtime_low_threshold}
                onChange={(e) => updateConfig('alerts', 'runtime_low_threshold', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Alert when runtime drops below this value
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Power Failure Delay (seconds)
              </label>
              <input
                type="number"
                min="0"
                required
                className="input"
                value={config.alerts.power_failure_delay}
                onChange={(e) => updateConfig('alerts', 'power_failure_delay', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wait time before triggering power failure alerts
              </p>
            </div>
          </div>
        </div>

        {/* Shutdown Configuration */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Power className="h-5 w-5 text-danger-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Shutdown Configuration</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_shutdown"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={config.shutdown.auto_shutdown_enabled}
                onChange={(e) => updateConfig('shutdown', 'auto_shutdown_enabled', e.target.checked)}
              />
              <label htmlFor="auto_shutdown" className="ml-2 block text-sm text-gray-900">
                Enable automatic shutdown
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Battery Shutdown Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  className="input"
                  value={config.shutdown.battery_threshold}
                  onChange={(e) => updateConfig('shutdown', 'battery_threshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Shutdown devices when battery level reaches this percentage
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Runtime Shutdown Threshold (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input"
                  value={config.shutdown.runtime_threshold}
                  onChange={(e) => updateConfig('shutdown', 'runtime_threshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Shutdown devices when runtime reaches this value
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Configuration Notes */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Configuration Notes</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• NUT Server must be running and accessible from this application</li>
          <li>• UPS Name should match the name configured in your NUT server</li>
          <li>• Alert thresholds help you monitor UPS health proactively</li>
          <li>• Shutdown thresholds trigger automatic device shutdown during power events</li>
          <li>• Changes are saved immediately when you click "Save Configuration"</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings; 