import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import TipoUsuarioService, { type TipoUsuario, type TipoUsuarioDto } from '../services/TipoUsuarioService';
import PermissaoAcessoService, { type Permissao } from '../services/PermissaoAcessoService';
import { PERMISSION_LABELS, getPermissionIcon } from '../utils/permissionLabels';
import '../components/UserFormModal.css';
import './TipoUsuarioPermissoesModal.css';

interface TipoUsuarioPermissoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  tipoToEdit: TipoUsuario | null;
}

const TipoUsuarioPermissoesModal: React.FC<TipoUsuarioPermissoesModalProps> = ({
  isOpen, onClose, onSaved, tipoToEdit,
}) => {
  const [nome, setNome] = useState('');
  const [canReceiveLead, setCanReceiveLead] = useState(true);
  const [catalogo, setCatalogo] = useState<Permissao[]>([]);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPermissoes = useCallback(async (tipoUsuarioId: number | null) => {
    setIsLoading(true);
    try {
      const [catalogoData, atuaisData] = await Promise.all([
        PermissaoAcessoService.buscarCatalogo(),
        tipoUsuarioId ? PermissaoAcessoService.buscarPermissoesPorTipoUsuario(tipoUsuarioId) : Promise.resolve([]),
      ]);
      setCatalogo(catalogoData);
      setSelecionadas(atuaisData);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao carregar permissões.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setNome(tipoToEdit?.nome ?? '');
      setCanReceiveLead(tipoToEdit?.canReceiveLead ?? true);
      fetchPermissoes(tipoToEdit?.id ?? null);
    } else {
      setNome('');
      setCanReceiveLead(true);
      setCatalogo([]);
      setSelecionadas([]);
    }
  }, [isOpen, tipoToEdit, fetchPermissoes]);

  const handleToggle = (idPermissao: number) => {
    setSelecionadas(prev =>
      prev.includes(idPermissao) ? prev.filter(id => id !== idPermissao) : [...prev, idPermissao]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dto: TipoUsuarioDto = { nome: nome.trim(), canReceiveLead, permissoesIds: selecionadas };
      if (tipoToEdit) {
        await TipoUsuarioService.atualizar(tipoToEdit.id, dto);
        toast.success('Perfil atualizado com sucesso!');
      } else {
        await TipoUsuarioService.criar(dto);
        toast.success('Perfil criado com sucesso!');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isAdminType = tipoToEdit?.codigo === 1;
  const showAdminWarning = isAdminType && !canReceiveLead;

  return (
    <div className="modal-overlay" onClick={() => !isSaving && onClose()}>
      <div className="modal-content permissoes-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{tipoToEdit ? `Editar Perfil "${tipoToEdit.nome}"` : 'Novo Perfil'}</h2>
          <button onClick={onClose} className="close-modal-button" disabled={isSaving}>
            <FaTimes />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSaving} className="form-fieldset">
            <div className="permissoes-modal-body">
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

              <div className="permissoes-section">
                <div className="permissoes-modal-meta">
                  <h3 className="permissoes-section-title">Permissões</h3>
                  <span className="permissoes-counter">
                    {selecionadas.length} / {catalogo.length} ativas
                  </span>
                </div>

                {isLoading ? (
                  <div className="permissoes-loading">Carregando permissões...</div>
                ) : (
                  <div className="permissoes-grid">
                    {catalogo.map(perm => {
                      const isChecked = selecionadas.includes(perm.idPermissao);
                      return (
                        <div key={perm.idPermissao} className="permissao-item">
                          <div className="permissao-label">
                            {getPermissionIcon(perm.nomePermissao)}
                            <div>
                              <strong>{PERMISSION_LABELS[perm.nomePermissao] || perm.nomeTela || perm.nomePermissao}</strong>
                              <span className="permissao-technical-code">{perm.nomePermissao}</span>
                            </div>
                          </div>
                          <label className="permissao-switch">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggle(perm.idPermissao)}
                            />
                            <span className="permissao-slider round"></span>
                          </label>
                        </div>
                      );
                    })}
                    {catalogo.length === 0 && (
                      <p className="permissoes-empty">Nenhuma permissão cadastrada no catálogo global.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </fieldset>

          <footer className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={isSaving || isLoading}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default TipoUsuarioPermissoesModal;
