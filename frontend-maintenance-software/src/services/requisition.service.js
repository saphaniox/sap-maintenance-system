// Requisition Service
import apiClient from './api.service';

class RequisitionService {
  async getAll() {
    const response = await apiClient.get('/api/requisitions');
    return response.data;
  }

  async getById(id) {
    const response = await apiClient.get(`/api/requisitions/${id}`);
    return response.data;
  }

  async create(requisitionData) {
    const response = await apiClient.post('/api/requisitions', requisitionData);
    return response.data;
  }

  async update(id, requisitionData) {
    const response = await apiClient.put(`/api/requisitions/${id}`, requisitionData);
    return response.data;
  }

  async delete(id) {
    const response = await apiClient.delete(`/api/requisitions/${id}`);
    return response.data;
  }

  async approve(id) {
    const response = await apiClient.post(`/api/requisitions/${id}/approve`);
    return response.data;
  }

  async reject(id, reason) {
    const response = await apiClient.post(`/api/requisitions/${id}/reject`, { reason });
    return response.data;
  }
}

export default new RequisitionService();
