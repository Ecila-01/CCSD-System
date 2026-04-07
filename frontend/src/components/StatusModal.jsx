import React from 'react';
import { MdDeleteOutline, MdCheckCircle, MdError, MdHelpOutline, MdPending } from "react-icons/md";
import '../styles/StatusModal.css';

const StatusModal = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  // Configuration for different modal styles
  const config = {
    delete_confirm: { 
    icon: <MdDeleteOutline color="#ff4d4d" />, 
    btnClass: 'btn-delete-confirm', 
    colorClass: 'status-red', // Add this
    showCancel: true,
    confirmText: 'Delete' 
    },
    confirm: { 
      icon: <MdHelpOutline color="#3b82f6" />, 
      btnClass: 'btn-confirm', 
      showCancel: true, 
      confirmText: 'Confirm' 
    },
    success: { icon: <MdCheckCircle color="#22c55e" />, btnClass: 'btn-success', colorClass: 'status-green', showCancel: false },
    error: { icon: <MdError color="#ef4444" />, btnClass: 'btn-error', colorClass: 'status-red',  showCancel: false },
    loading: { icon: <MdPending className="spin" color="#64748b" />, btnClass: 'hidden', colorClass: 'status-blue', showCancel: false }
  };

  const current = config[type] || config.confirm;

  return (
    <div className="status-modal-overlay">
      <div className="status-modal-card">
        <div className={`status-icon ${current.colorClass}`}>{current.icon}</div>
        <h3>{title}</h3>
        <p>{message}</p>
        
        <div className="status-modal-footer">
          {current.showCancel && (
            <button className="btn-modal-secondary" onClick={onCancel}>Cancel</button>
          )}
          {type !== 'loading' && (
            <button className={`btn-modal-primary ${current.btnClass}`} onClick={onConfirm}>
              {/* CHANGE THIS LINE BELOW */}
              {current.confirmText || 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusModal;