import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user was already logged in (token in localStorage)
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Auto-login completely disabled - always show Welcome page
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password: '***' });
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('Login response:', response.data);
      const { token, user } = response.data;
      
      // Save credentials for future sessions
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const logout = () => {
    // Clean up everything when logging out
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userSettings');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    // Update user info (used after profile changes)
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  // Helper functions for role-based access control
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Define what each role can do
    const rolePermissions = {
      visitor: [
        'read:dashboard', // Visitors can only view dashboard
      ],
      administrator: ['all'], // Admins can do everything
      manager: [
        'read:all',
        'create:machines',
        'update:machines',
        'delete:machines',
        'create:maintenance',
        'update:maintenance',
        'delete:maintenance',
        'approve:requisitions',
        'reject:requisitions',
        'create:inventory',
        'update:inventory',
        'delete:inventory',
        'create:sites',
        'update:sites',
        'delete:sites',
        'read:users',
      ],
      supervisor: [
        'read:all',
        'create:machines',
        'update:machines',
        'create:maintenance',
        'update:maintenance',
        'approve:requisitions',
        'create:requisitions',
        'update:requisitions',
        'create:inventory',
        'update:inventory',
        'read:inventory',
      ],
      operator: [
        'read:all',
        'create:maintenance',
        'update:maintenance',
        'create:requisitions',
        'update:requisitions',
        'read:inventory',
        'read:machines',
      ],
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  // Quick role check helpers
  const isAdmin = () => user?.role === 'administrator';
  const isManager = () => user?.role === 'manager';
  const isManagerOrAdmin = () => ['administrator', 'manager'].includes(user?.role);

  const value = {
    user,
    login,
    logout,
    updateUser,
    hasPermission,
    isAdmin,
    isManager,
    isManagerOrAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}