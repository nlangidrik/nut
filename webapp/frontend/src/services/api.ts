import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any request headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const upsApi = {
  getStatus: () => api.get('/api/ups/status'),
};

export const devicesApi = {
  getAll: () => api.get('/api/devices'),
  create: (device: any) => api.post('/api/devices', device),
  update: (id: number, device: any) => api.put(`/api/devices/${id}`, device),
  delete: (id: number) => api.delete(`/api/devices/${id}`),
};

export const shutdownApi = {
  manual: () => api.post('/api/shutdown/manual'),
  device: (id: number) => api.post(`/api/shutdown/device/${id}`),
};

export const alertsApi = {
  getAll: () => api.get('/api/alerts'),
  markRead: (id: number) => api.post(`/api/alerts/${id}/read`),
};

export const configApi = {
  get: () => api.get('/api/config'),
  update: (config: any) => api.put('/api/config', config),
}; 