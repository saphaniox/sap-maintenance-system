import axios from 'axios';

// Set base URL for all axios requests
// Vite exposes env vars via import.meta.env and requires the VITE_ prefix for custom vars.
// Use VITE_API_URL if provided, otherwise default to the known dev backend port.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
axios.defaults.baseURL = BASE_URL;

// Add request interceptor to attach auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default axios;
