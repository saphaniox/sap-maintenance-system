// Base API Service - handles all HTTP requests with authentication and error handling
import axios from 'axios';
import { cacheUtils } from '../utils/cache';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create a configured axios instance for all API calls
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds max per request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors in one place
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET responses for future use
    if (response.config.method?.toLowerCase() === 'get' && response.data) {
      const cacheKey = cacheUtils.generateKey(response.config.url, response.config.params);
      cacheUtils.set(cacheKey, response.data, 5 * 60 * 1000); // Cache for 5 minutes
    }
    return response;
  },
  (error) => {
    // Handle authentication errors (expired/invalid token)
    if (error.response?.status === 401) {
      console.log('🔒 Session expired - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Format error message nicely for display
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// Cached API methods for common operations (promise-based)
export const cachedApi = {
  // Cached GET request with automatic cache management
  get: async (url, config = {}) => {
    const cacheKey = cacheUtils.generateKey(url, config.params);
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      // Return a response-like object for compatibility
      return Promise.resolve({ data: cachedData });
    }

    const response = await apiClient.get(url, config);
    // Cache the data
    cacheUtils.set(cacheKey, response.data, 5 * 60 * 1000);
    return response;
  },

  // POST - not cached by default
  post: (url, data, config = {}) => {
    return apiClient.post(url, data, config).then((response) => {
      // Optionally cache search-like POSTs if requested
      if (config.cache) {
        const cacheKey = cacheUtils.generateKey(url, data);
        cacheUtils.set(cacheKey, response.data, 2 * 60 * 1000);
      }
      return response;
    });
  },

  // Standard PUT/PATCH/DELETE - invalidate related caches
  put: (url, data, config = {}) => {
    const resourceKey = url.split('/')[1];
    cacheUtils.invalidatePattern(resourceKey);
    return apiClient.put(url, data, config);
  },

  patch: (url, data, config = {}) => {
    const resourceKey = url.split('/')[1];
    cacheUtils.invalidatePattern(resourceKey);
    return apiClient.patch(url, data, config);
  },

  delete: (url, config = {}) => {
    const resourceKey = url.split('/')[1];
    cacheUtils.invalidatePattern(resourceKey);
    return apiClient.delete(url, config);
  }
};

export default apiClient;
