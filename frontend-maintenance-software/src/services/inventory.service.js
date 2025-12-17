// Inventory Service
import { cachedApi } from './api.service';

class InventoryService {
  async getAll() {
    const response = await cachedApi.get('/api/inventory');
    return response.data;
  }

  async getById(id) {
    const response = await cachedApi.get(`/api/inventory/${id}`);
    return response.data;
  }

  async create(inventoryData) {
    const response = await cachedApi.post('/api/inventory', inventoryData, { cache: false });
    return response.data;
  }

  async update(id, inventoryData) {
    const response = await cachedApi.put(`/api/inventory/${id}`, inventoryData);
    return response.data;
  }

  async delete(id) {
    const response = await cachedApi.delete(`/api/inventory/${id}`);
    return response.data;
  }

  async getLowStock() {
    const response = await cachedApi.get('/api/inventory/low-stock');
    return response.data;
  }
}

export default new InventoryService();
