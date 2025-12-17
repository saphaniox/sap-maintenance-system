import api from './api';

const ProductionReportService = {
  // Get all production reports with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site) params.append('site', filters.site);
    if (filters.machine) params.append('machine', filters.machine);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/api/production-reports?${params.toString()}`);
    return response.data;
  },

  // Get single production report by ID
  getById: async (id) => {
    const response = await api.get(`/api/production-reports/${id}`);
    return response.data;
  },

  // Create new production report
  create: async (reportData) => {
    const response = await api.post('/api/production-reports', reportData);
    return response.data;
  },

  // Update production report
  update: async (id, reportData) => {
    const response = await api.put(`/api/production-reports/${id}`, reportData);
    return response.data;
  },

  // Submit report for review
  submit: async (id) => {
    const response = await api.patch(`/api/production-reports/${id}/submit`);
    return response.data;
  },

  // Approve production report
  approve: async (id) => {
    const response = await api.patch(`/api/production-reports/${id}/approve`);
    return response.data;
  },

  // Delete production report
  delete: async (id) => {
    const response = await api.delete(`/api/production-reports/${id}`);
    return response.data;
  },

  // Get production statistics
  getStats: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site) params.append('site', filters.site);
    if (filters.machine) params.append('machine', filters.machine);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/api/production-reports/stats/summary?${params.toString()}`);
    return response.data;
  }
};

export default ProductionReportService;
