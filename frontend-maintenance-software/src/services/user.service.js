import axios from './api';

const UserService = {
  // Get all users
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
      if (filters.search) params.append('search', filters.search);
      
      console.log('Fetching users with URL:', `/api/users?${params.toString()}`);
      const response = await axios.get(`/api/users?${params.toString()}`);
      console.log('Users response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in UserService.getAll:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get single user
  getById: async (id) => {
    const response = await axios.get(`/api/users/${id}`);
    return response.data;
  },

  // Update user role
  updateRole: async (id, role) => {
    const response = await axios.patch(`/api/users/${id}/role`, { role });
    return response.data;
  },

  // Update user assigned sites
  updateSites: async (id, assignedSites) => {
    const response = await axios.patch(`/api/users/${id}/sites`, { assignedSites });
    return response.data;
  },

  // Toggle user active status
  updateStatus: async (id, isActive) => {
    const response = await axios.patch(`/api/users/${id}/status`, { isActive });
    return response.data;
  },

  // Update user details
  update: async (id, userData) => {
    const response = await axios.patch(`/api/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await axios.delete(`/api/users/${id}`);
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    try {
      console.log('Fetching user stats from:', '/api/users/stats/overview');
      const response = await axios.get('/api/users/stats/overview');
      console.log('User stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in UserService.getStats:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default UserService;
