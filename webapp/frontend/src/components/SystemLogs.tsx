import React from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

// Explicitly type the log level
type LogLevel = 'success' | 'warning' | 'info';

interface LogEntry {
  level: LogLevel;
  message: string;
  time: string;
  icon: React.ReactNode;
}

const logs: LogEntry[] = [
  {
    level: 'success',
    message: 'Main Server UPS: Power restored',
    time: '2 min ago',
    icon: <CheckCircle className="h-5 w-5 text-green-500" />
  },
  {
    level: 'warning',
    message: 'Network Equipment UPS: Running on battery',
    time: '5 min ago',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
  },
  {
    level: 'info',
    message: 'Workstation UPS: Battery charging',
    time: '10 min ago',
    icon: <Info className="h-5 w-5 text-blue-500" />
  },
];

const levelStyles: Record<LogLevel, string> = {
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

const SystemLogs: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800">System Logs</h1>
      <p className="text-gray-500 mt-1 mb-6">Recent events and notifications</p>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg border ${levelStyles[log.level]}`}
            >
              <div className="flex items-center">
                <div className="mr-4">
                  {log.icon}
                </div>
                <p className="text-gray-700">{log.message}</p>
              </div>
              <p className="text-sm text-gray-500">{log.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs; 