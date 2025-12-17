import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationService from '../services/notification.service';
import { useToast } from '../contexts/ToastContext';
import '../styles/components/NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await NotificationService.getAll(false);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already
      if (!notification.isRead) {
        await NotificationService.markAsRead(notification._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
      }

      // Navigate to action URL if provided
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }

      setIsOpen(false);
    } catch (error) {
      toast.error('Error opening notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Error marking notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const handleClearRead = async () => {
    try {
      setLoading(true);
      await NotificationService.clearRead();
      setNotifications(prev => prev.filter(n => !n.isRead));
      toast.success('Read notifications cleared');
    } catch (error) {
      toast.error('Error clearing notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await NotificationService.delete(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Error deleting notification');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#17a2b8',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545',
    };
    return colors[priority] || '#6c757d';
  };

  const getTypeIcon = (type) => {
    const icons = {
      maintenance: '🔧',
      inventory: '📦',
      requisition: '📋',
      system: 'ℹ️',
      reminder: '⏰',
    };
    return icons[type] || '📌';
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="btn-text"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                >
                  Mark all read
                </button>
              )}
              {notifications.some(n => n.isRead) && (
                <button 
                  className="btn-text"
                  onClick={handleClearRead}
                  disabled={loading}
                >
                  Clear read
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">📭</span>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      <span 
                        className="priority-indicator"
                        style={{ backgroundColor: getPriorityColor(notification.priority) }}
                      />
                    </div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.createdAt)}</div>
                  </div>

                  <button
                    className="notification-delete"
                    onClick={(e) => handleDelete(e, notification._id)}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <span className="notification-count">
                {notifications.length} total
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
