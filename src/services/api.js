import axios from 'axios';
import { storage } from '../utils/storage';
import toast from '../utils/toast';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'X-App-Secret': process.env.EXPO_PUBLIC_APP_SECRET
  },  
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      console.log(`[API Request] Token found, attaching to header (prefix: ${token.substring(0, 10)}...)`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('[API Request] No token found in storage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
const unauthorizedListeners = [];

export const onUnauthorized = (callback) => {
  unauthorizedListeners.push(callback);
  return () => {
    const index = unauthorizedListeners.indexOf(callback);
    if (index > -1) unauthorizedListeners.splice(index, 1);
  };
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const errorMessage = error.response.data?.message || '';
      
      // Handle device mismatch specifically if requested
      if (errorMessage.toLowerCase().includes('device') || errorMessage.toLowerCase().includes('registered')) {
        toast.error('Use your registered phone to mark attendance.', { title: 'Invalid Device' });
      }

      // Handle unauthorized or deactivated error (logout user)
      console.log('Session invalid or account deactivated. Triggering logout...');
      
      // Clear storage immediately
      await storage.clearAll();
      
      // Notify all listeners (e.g., AuthContext)
      unauthorizedListeners.forEach(cb => cb());
    }
    return Promise.reject(error);
  }
);

export default api;
