// Machine Service - Handles all API calls for machine management
import { cachedApi } from './api.service';

class MachineService {
  // Fetch all machines from the database (cached)
  async getAll(params = {}) {
    const response = await cachedApi.get('/api/machines', { params });
    return response.data;
  }

  // Fetch paginated machines
  async getPage({ page = 1, limit = 10, search = '', status = '' } = {}) {
    const response = await cachedApi.get('/api/machines', { params: { page, limit, search, status } });
    return response.data;
  }

  // Get detailed info for a single machine (cached)
  async getById(id) {
    const response = await cachedApi.get(`/api/machines/${id}`);
    return response.data;
  }

  // Add a new machine to the system
  async create(machineData) {
    const response = await cachedApi.post('/api/machines', machineData, { cache: false });
    return response.data;
  }

  // Update existing machine details
  async update(id, machineData) {
    const response = await cachedApi.put(`/api/machines/${id}`, machineData);
    return response.data;
  }

  // Remove a machine (soft delete - marks as inactive)
  async delete(id) {
    const response = await cachedApi.delete(`/api/machines/${id}`);
    return response.data;
  }

  // Search machines by name, model, or serial number (cached)
  async search(query) {
    const response = await cachedApi.get('/api/machines', {
      params: { search: query },
    });
    return response.data;
  }

  // Filter machines by their current status (cached)
  async getByStatus(status) {
    const response = await cachedApi.get('/api/machines', {
      params: { status },
    });
    return response.data;
  }
}

// Export a single instance to use throughout the app
export default new MachineService();
