import axios from 'axios';

const api = axios.create({
  // Point to the /api prefix set in main.ts
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api', 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    // Note: If using HttpOnly cookies (recommended), this Authorization header isn't strictly needed 
    // unless your backend JwtStrategy looks for both.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    if (typeof window !== 'undefined') {
      // Clear local storage if token is invalid
      localStorage.removeItem('token'); 
      // window.location.href = '/login'; // Uncomment to auto-redirect
    }
  }
  return Promise.reject(error);
});

export default api;