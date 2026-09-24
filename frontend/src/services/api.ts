import axios from 'axios';

// Base API URL configuration
// In production (Vercel), VITE_API_URL is set during build time (e.g. https://outbox-email-scheduler-y25d.onrender.com).
// In local development, if VITE_API_URL is omitted, fallback to relative path (using Vite dev proxy).
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

export const API_BASE_URL = rawApiUrl;
export const GOOGLE_OAUTH_URL = '/api/auth/google';
export const BULL_BOARD_URL = rawApiUrl ? `${rawApiUrl}/admin/queues` : '/admin/queues';

const api = axios.create({
  baseURL: rawApiUrl ? `${rawApiUrl}/api` : '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  signup: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default api;
