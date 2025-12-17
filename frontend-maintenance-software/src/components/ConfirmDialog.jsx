// Confirmation Dialog Component
import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' 
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        {cancelText}
      </button>
      <button className={`btn btn-${type}`} onClick={handleConfirm}>
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="small">
      <p>{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;
