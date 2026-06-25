import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import type { TipoUsuario, TipoUsuarioDto } from '../services/TipoUsuarioService';
import '../components/UserFormModal.css';
import './TipoUsuarioFormModal.css';

interface TipoUsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: TipoUsuarioDto) => void;
  tipoToEdit?: TipoUsuario | null;
  isSaving: boolean;
}

const TipoUsuarioFormModal: React.FC<TipoUsuarioFormModalProps> = ({
  isOpen, onClose, onSave, tipoToEdit, isSaving,
}) => {
  const [nome, setNome] = useState('');
  const [canReceiveLead, setCanReceiveLead] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (tipoToEdit) {
      setNome(tipoToEdit.nome);
      setCanReceiveLead(tipoToEdit.canReceiveLead);
    } else {
      setNome('');
      setCanReceiveLead(true);
    }
  }, [isOpen, tipoToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nome: nome.trim(), canReceiveLead });
  };

  if (!isOpen) return null;

  const isAdminType = tipoToEdit?.codigo === 1;
  const showAdminWarning = isAdminType && !canReceiveLead;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>{tipoToEdit ? 'Editar Tipo de Usuário' : 'Novo Tipo de Usuário'}</h2>
          <button onClick={onClose} className="close-modal-button" disabled={isSaving}>
            <FaTimes />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSaving} className="form-fieldset">
            <div className="modal-content-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="nome">Nome do perfil</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    placeholder="Ex: Vendedor, Suporte..."
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <div className="tipo-usuario-toggle-row">
                    <div className="tipo-usuario-toggle-label">
                      <span>Participa do rodízio de leads</span>
                      <small>Usuários desse tipo poderão receber leads automaticamente.</small>
                    </div>
                    <label className="toggle-switch" aria-label="Participa do rodízio de leads">
                      <input
                        type="checkbox"
                        checked={canReceiveLead}
                        onChange={(e) => setCanReceiveLead(e.target.checked)}
                      />
                      <div className="toggle-track">
                        <div className="toggle-thumb" />
                      </div>
                    </label>
                  </div>
                </div>

                {showAdminWarning && (
                  <div className="form-group full-width">
                    <div className="tipo-usuario-warning">
                      <FaExclamationTriangle />
                      <span>
                        Este é o perfil Administrador. Se nenhum outro tipo de usuário da empresa participar
                        do rodízio de leads, novos leads não serão distribuídos automaticamente.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </fieldset>
          <footer className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default TipoUsuarioFormModal;
