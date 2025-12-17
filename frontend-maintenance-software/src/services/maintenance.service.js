// Maintenance Service - Handles all API calls for maintenance records
import { cachedApi } from './api.service';

class MaintenanceService {
  // Fetch all maintenance records (cached)
  async getAll() {
    const response = await cachedApi.get('/api/maintenance');
    return response.data;
  }

  // Get details for a specific maintenance record (cached)
  async getById(id) {
    const response = await cachedApi.get(`/api/maintenance/${id}`);
    return response.data;
  }

  // Create a new maintenance record
  async create(maintenanceData) {
    const response = await cachedApi.post('/api/maintenance', maintenanceData, { cache: false });
    return response.data;
  }

  // Update an existing maintenance record
  async update(id, maintenanceData) {
    const response = await cachedApi.put(`/api/maintenance/${id}`, maintenanceData);
    return response.data;
  }

  // Delete a maintenance record
  async delete(id) {
    const response = await cachedApi.delete(`/api/maintenance/${id}`);
    return response.data;
  }

  // Filter maintenance records by status (pending, in-progress, completed) (cached)
  async getByStatus(status) {
    const response = await cachedApi.get('/api/maintenance', {
      params: { status },
    });
    return response.data;
  }

  // Get all maintenance for a specific machine (cached)
  async getByMachine(machineId) {
    const response = await cachedApi.get('/api/maintenance', {
      params: { machineId },
    });
    return response.data;
  }
}

// Export a single instance for use across the app
export default new MaintenanceService();
