import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR: Attach Token to Every Request ---
api.interceptors.request.use((config) => {
  // 1. Check if we are in the browser
  if (typeof window !== 'undefined') {
    // 2. Get token from storage
    const token = localStorage.getItem('token');
    
    // 3. If token exists, attach it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- INTERCEPTOR: Handle 401 (Logout if token expires) ---
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token'); // Clear bad token
      // Optional: Redirect to login if you want
      // window.location.href = '/'; 
    }
  }
  return Promise.reject(error);
});

export default api;