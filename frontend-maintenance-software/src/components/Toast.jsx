// Toast Component - Displays notifications
import React, { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import '../styles/components/Toast.css';

const Toast = ({ id, message, type, duration }) => {
  const { removeToast } = useToast();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, removeToast]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => removeToast(id)}>
        ×
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
