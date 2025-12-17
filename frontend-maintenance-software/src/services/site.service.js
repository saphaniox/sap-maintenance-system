import api from './api';

const siteService = {
  // Get all sites
  getAllSites: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/sites${query}`);
    return response.data;
  },

  // Alias for consistency
  getAll: async (filters = {}) => {
    return siteService.getAllSites(filters);
  },

  // Get single site by ID
  getSiteById: async (id) => {
    const response = await api.get(`/api/sites/${id}`);
    return response.data;
  },

  // Create new site
  createSite: async (siteData) => {
    const response = await api.post('/api/sites', siteData);
    return response.data;
  },

  // Update site
  updateSite: async (id, siteData) => {
    const response = await api.put(`/api/sites/${id}`, siteData);
    return response.data;
  },

  // Delete site
  deleteSite: async (id) => {
    const response = await api.delete(`/api/sites/${id}`);
    return response.data;
  },

  // Get machines at a specific site
  getSiteMachines: async (siteId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/sites/${siteId}/machines${query}`);
    return response.data;
  },

  // Get site statistics
  getSiteStats: async (siteId) => {
    const response = await api.get(`/api/sites/${siteId}/stats`);
    return response.data;
  }
};

export default siteService;
