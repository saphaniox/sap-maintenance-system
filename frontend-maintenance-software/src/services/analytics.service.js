import api from './api';

const AnalyticsService = {
  // Get production analytics
  getProductionAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.siteId) params.append('siteId', filters.siteId);
    
    const response = await api.get(`/api/analytics/production?${params.toString()}`);
    return response.data;
  },

  // Get site comparison analytics
  getSiteComparison: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/api/analytics/sites-comparison?${params.toString()}`);
    return response.data;
  },

  // Get machine performance analytics
  getMachinePerformance: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/api/analytics/machines-performance?${params.toString()}`);
    return response.data;
  },

  // Get maintenance analytics
  getMaintenanceAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/api/analytics/maintenance?${params.toString()}`);
    return response.data;
  },

  // Get efficiency trends
  getEfficiencyTrends: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.machineId) params.append('machineId', filters.machineId);
    
    const response = await api.get(`/api/analytics/efficiency-trends?${params.toString()}`);
    return response.data;
  },

  // Get dashboard summary
  getDashboardSummary: async () => {
    const response = await api.get('/api/analytics/dashboard-summary');
    return response.data;
  }
};

export default AnalyticsService;
