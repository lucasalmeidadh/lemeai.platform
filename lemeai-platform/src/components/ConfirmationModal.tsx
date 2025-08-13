import React from 'react';
import './ConfirmationModal.css';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isConfirming = false,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="confirmation-modal-header">
          <div className="header-icon">
            <FaExclamationTriangle />
          </div>
          <h2>{title}</h2>
          <button onClick={onClose} className="close-modal-button" disabled={isConfirming}>
            <FaTimes />
          </button>
        </header>
        <main className="confirmation-modal-body">
          <p>{message}</p>
        </main>
        <footer className="confirmation-modal-footer">
          <button type="button" className="button secondary" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </button>
          <button type="button" className="button danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Confirmando...' : confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;