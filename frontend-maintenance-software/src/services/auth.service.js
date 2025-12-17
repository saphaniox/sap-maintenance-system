// Authentication service - handles login, logout, registration, etc.
import apiClient from './api.service';
import api from './api';

class AuthService {
  async login(email, password) {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    
    // Build complete URL for avatar image if user has one
    if (user && user.avatar) {
      user.avatar = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${user.avatar}`;
    }
    
    // Save to browser storage so user stays logged in
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  }

  async register(userData) {
    const response = await apiClient.post('/api/auth/register', userData);
    const { token, user } = response.data;
    
    // Build complete URL for avatar image if provided
    if (user && user.avatar) {
      user.avatar = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${user.avatar}`;
    }
    
    return { token, user };
  }

  async updateProfile(formData) {
    const response = await api.put('/api/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data' // Important for file uploads
      }
    });
    
    // Build complete avatar URL
    if (response.data.user && response.data.user.avatar) {
      response.data.user.avatar = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${response.data.user.avatar}`;
    }
    
    // Keep localStorage in sync with updated profile
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async changePassword(passwordData) {
    const response = await api.post('/api/auth/change-password', passwordData);
    return response.data;
  }

  logout() {
    // Clean up everything when user logs out
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userSettings');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

// Export a single instance to use everywhere
export default new AuthService();
