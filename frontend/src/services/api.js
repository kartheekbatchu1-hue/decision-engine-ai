import axios from 'axios';

let rawBase = import.meta.env.VITE_API_BASE_URL || '/api';
if (rawBase.endsWith('/')) {
  rawBase = rawBase.slice(0, -1);
}
// Normalize: ensure baseURL always includes /api
const BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    'X-User-ID': '00000000-0000-0000-0000-000000000001',
  },
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// Decisions
export const decisionsApi = {
  getAll: () => api.get('/decisions').then(r => r.data.data),
  getById: (id) => api.get(`/decisions/${id}`).then(r => r.data.data),
  create: (data) => api.post('/decisions', data).then(r => r.data.data),
  analyze: (id) => api.post(`/decisions/${id}/analyze`).then(r => r.data.data),
  simulate: (id, payload) => api.post(`/decisions/${id}/simulate`, payload).then(r => r.data.data),
  updateStatus: (id, status) => api.patch(`/decisions/${id}/status`, { status }).then(r => r.data.data),
  delete: (id) => api.delete(`/decisions/${id}`).then(r => r.data),
};

export default api;

