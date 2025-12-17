import apiClient from './api.service';

const NotificationService = {
  // Get all notifications
  async getAll(unreadOnly = false) {
    const response = await apiClient.get('/api/notifications', {
      params: { unreadOnly: unreadOnly ? 'true' : 'false' },
    });
    return response.data;
  },

  // Mark notification as read
  async markAsRead(id) {
    const response = await apiClient.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  async markAllAsRead() {
    const response = await apiClient.patch('/api/notifications/read-all');
    return response.data;
  },

  // Delete notification
  async delete(id) {
    const response = await apiClient.delete(`/api/notifications/${id}`);
    return response.data;
  },

  // Clear all read notifications
  async clearRead() {
    const response = await apiClient.delete('/api/notifications/clear-read');
    return response.data;
  },
};

export default NotificationService;
