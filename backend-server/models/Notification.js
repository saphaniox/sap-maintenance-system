const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['maintenance', 'inventory', 'requisition', 'system', 'reminder'],
    default: 'system',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  relatedModel: {
    type: String,
    enum: ['Machine', 'Maintenance', 'Inventory', 'Requisition', null],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  actionUrl: String, // Frontend route to navigate to
  expiresAt: Date, // Optional: auto-delete old notifications
}, {
  timestamps: true,
});

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to create notification for multiple users
notificationSchema.statics.createForUsers = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    userId,
    ...notificationData,
  }));
  return await this.insertMany(notifications);
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return await this.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
