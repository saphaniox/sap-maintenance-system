import axios from './api';

const UserService = {
  // Get all users
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.search) params.append('search', filters.search);
    
    const response = await axios.get(`/api/users?${params.toString()}`);
    return response.data;
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
    const response = await axios.get('/api/users/stats/overview');
    return response.data;
  },
};

export default UserService;
