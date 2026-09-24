import axios from 'axios';

// Base API URL configuration
// In production (Vercel), VITE_API_URL is set during build time (e.g. https://outbox-email-scheduler-y25d.onrender.com).
// In local development, if VITE_API_URL is omitted, fallback to relative path (using Vite dev proxy).
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

export const API_BASE_URL = rawApiUrl;
export const GOOGLE_OAUTH_URL = rawApiUrl ? `${rawApiUrl}/api/auth/google` : '/api/auth/google';
export const BULL_BOARD_URL = rawApiUrl ? `${rawApiUrl}/admin/queues` : '/admin/queues';

const api = axios.create({
  baseURL: rawApiUrl ? `${rawApiUrl}/api` : '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('outbox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('outbox_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
