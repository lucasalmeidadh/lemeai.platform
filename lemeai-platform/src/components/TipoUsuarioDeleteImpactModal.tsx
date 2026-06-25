import React from 'react';
import {
  FaTimes, FaSpinner, FaExclamationTriangle, FaTimesCircle, FaUser, FaKey,
} from 'react-icons/fa';
import type { ImpactoExclusao } from '../services/TipoUsuarioService';
import './TipoUsuarioDeleteImpactModal.css';

interface TipoUsuarioDeleteImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  impacto: ImpactoExclusao | null;
  isLoadingImpacto: boolean;
  isDeleting: boolean;
}

const TipoUsuarioDeleteImpactModal: React.FC<TipoUsuarioDeleteImpactModalProps> = ({
  isOpen, onClose, onConfirm, impacto, isLoadingImpacto, isDeleting,
}) => {
  if (!isOpen) return null;

  const isBlocked = impacto !== null && !impacto.podeExcluir;
  const isBusy = isLoadingImpacto || isDeleting;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content impact-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Excluir Tipo de Usuário</h2>
          <button onClick={onClose} className="close-modal-button" disabled={isDeleting}>
            <FaTimes />
          </button>
        </header>

        <div className="impact-modal-body">
          {isLoadingImpacto ? (
            <div className="impact-loading">
              <FaSpinner className="impact-spin" />
              <span>Verificando impacto da exclusão...</span>
            </div>
          ) : isBlocked ? (
            <div className="impact-blocked">
              <div className="impact-blocked-icon">
                <FaTimesCircle />
              </div>
              <p className="impact-blocked-title">
                Não é possível excluir "{impacto!.tipoUsuarioNome}"
              </p>
              <p className="impact-blocked-reason">{impacto!.motivoBloqueio}</p>
            </div>
          ) : impacto ? (
            <>
              <p className="impact-warning-text">
                <FaExclamationTriangle />
                <span>
                  Ao excluir <strong>{impacto.tipoUsuarioNome}</strong>, os itens abaixo também serão removidos:
                </span>
              </p>

              {impacto.usuarios.length === 0 && impacto.permissoes.length === 0 ? (
                <p className="impact-empty">Nenhum usuário ou permissão vinculado a este perfil.</p>
              ) : (
                <>
                  {impacto.usuarios.length > 0 && (
                    <div className="impact-section">
                      <h4>{impacto.usuarios.length} usuário(s) vinculado(s)</h4>
                      <ul className="impact-list">
                        {impacto.usuarios.map((u) => (
                          <li key={u.userId}>
                            <FaUser />
                            <span className="impact-list-name">{u.userName}</span>
                            <span className="impact-list-meta">{u.userEmail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {impacto.permissoes.length > 0 && (
                    <div className="impact-section">
                      <h4>{impacto.permissoes.length} permissão(ões) vinculada(s)</h4>
                      <ul className="impact-list">
                        {impacto.permissoes.map((p) => (
                          <li key={p.idPermissao}>
                            <FaKey />
                            <span className="impact-list-name">{p.nomeTela}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>

        <footer className="modal-footer">
          {isBlocked ? (
            <button type="button" className="button secondary" onClick={onClose}>
              Fechar
            </button>
          ) : (
            <>
              <button type="button" className="button secondary" onClick={onClose} disabled={isDeleting}>
                Cancelar
              </button>
              <button
                type="button"
                className="button danger"
                onClick={onConfirm}
                disabled={isBusy || !impacto}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};

export default TipoUsuarioDeleteImpactModal;
