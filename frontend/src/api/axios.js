import axios from 'axios';

// Set VITE_API_URL in a .env file for your deployed backend URL.
// Falls back to local dev backend if not set.
export const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

// Attach the JWT token (if present) to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eve_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
