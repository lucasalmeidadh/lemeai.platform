import React from 'react';
import './UserCredentialsModal.css';
import { FaTimes, FaCopy, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface UserCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userPassword: string;
}

const CRM_URL = 'crm.gbcode.com.br';

const UserCredentialsModal: React.FC<UserCredentialsModalProps> = ({ isOpen, onClose, userName, userEmail, userPassword }) => {
  if (!isOpen) return null;

  const clipboardText = [
    'Dados de Acesso - Brik CRM',
    '',
    `Nome: ${userName}`,
    `Login: ${userEmail}`,
    `Senha: ${userPassword}`,
    `Acesso: ${CRM_URL}`,
    '',
    'Altere sua senha no primeiro login.',
  ].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(clipboardText);
    toast.success('Dados copiados para a área de transferência!');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content credentials-modal">
        <header className="modal-header">
          <h2>Usuário criado com sucesso</h2>
          <button onClick={onClose} className="close-modal-button">
            <FaTimes />
          </button>
        </header>

        <div className="credentials-body">
          <div className="credentials-success-icon">
            <FaCheckCircle />
          </div>
          <p className="credentials-subtitle">
            Copie os dados abaixo e envie ao novo usuário.
          </p>

          <div className="credentials-card">
            <div className="credentials-field">
              <span className="credentials-label">Nome</span>
              <span className="credentials-value">{userName}</span>
            </div>
            <div className="credentials-field">
              <span className="credentials-label">Login</span>
              <span className="credentials-value">{userEmail}</span>
            </div>
            <div className="credentials-field">
              <span className="credentials-label">Senha</span>
              <span className="credentials-value">{userPassword}</span>
            </div>
            <div className="credentials-field">
              <span className="credentials-label">Acesso</span>
              <span className="credentials-value">{CRM_URL}</span>
            </div>
          </div>

          <p className="credentials-hint">
            Recomende que o usuário altere a senha no primeiro login.
          </p>
        </div>

        <footer className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="button primary" onClick={handleCopy}>
            <FaCopy style={{ marginRight: 8 }} /> Copiar Dados
          </button>
        </footer>
      </div>
    </div>
  );
};

export default UserCredentialsModal;
