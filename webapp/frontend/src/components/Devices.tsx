import React, { useState, useEffect } from 'react';
import { devicesApi, shutdownApi } from '../services/api';
import { Plus, Edit, Trash2, Power, Server, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

interface Device {
  id: number;
  name: string;
  type: 'server' | 'synology' | 'other';
  hostname: string;
  port: number;
  username: string;
  shutdown_command: string;
  is_active: boolean;
}

interface DeviceForm {
  name: string;
  type: 'server' | 'synology' | 'other';
  hostname: string;
  port: number;
  username: string;
  shutdown_command: string;
  ssh_key_path?: string;
}

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState<DeviceForm>({
    name: '',
    type: 'server',
    hostname: '',
    port: 22,
    username: '',
    shutdown_command: '',
  });

  const fetchDevices = async () => {
    try {
      const response = await devicesApi.getAll();
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDevice) {
        await devicesApi.update(editingDevice.id, formData);
        toast.success('Device updated successfully');
      } else {
        await devicesApi.create(formData);
        toast.success('Device added successfully');
      }
      
      setShowForm(false);
      setEditingDevice(null);
      resetForm();
      fetchDevices();
    } catch (error) {
      toast.error('Failed to save device');
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      hostname: device.hostname,
      port: device.port,
      username: device.username,
      shutdown_command: device.shutdown_command,
    });
    setShowForm(true);
  };

  const handleDelete = async (deviceId: number) => {
    if (!window.confirm('Are you sure you want to delete this device?')) {
      return;
    }

    try {
      await devicesApi.delete(deviceId);
      toast.success('Device deleted successfully');
      fetchDevices();
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  const handleShutdown = async (deviceId: number) => {
    if (!window.confirm('Are you sure you want to shutdown this device?')) {
      return;
    }

    try {
      await shutdownApi.device(deviceId);
      toast.success('Shutdown initiated for device');
    } catch (error) {
      toast.error('Failed to shutdown device');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'server',
      hostname: '',
      port: 22,
      username: '',
      shutdown_command: '',
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'synology':
        return <HardDrive className="h-5 w-5" />;
      default:
        return <Server className="h-5 w-5" />;
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </button>
      </div>

      {/* Device Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDevice ? 'Edit Device' : 'Add New Device'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type
                </label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="server">Server</option>
                  <option value="synology">Synology NAS</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hostname/IP
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  required
                  className="input"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shutdown Command
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g., sudo shutdown -h now"
                  value={formData.shutdown_command}
                  onChange={(e) => setFormData({ ...formData, shutdown_command: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                {editingDevice ? 'Update Device' : 'Add Device'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingDevice(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Devices List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configured Devices</h2>
        {devices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No devices configured</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hostname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getDeviceIcon(device.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {device.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {device.username}@{device.hostname}:{device.port}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">
                        {device.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {device.hostname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-indicator ${device.is_active ? 'status-online' : 'status-critical'}`}>
                        {device.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleShutdown(device.id)}
                          className="text-warning-600 hover:text-warning-900"
                          title="Shutdown Device"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(device)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Device"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(device.id)}
                          className="text-danger-600 hover:text-danger-900"
                          title="Delete Device"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Devices; 