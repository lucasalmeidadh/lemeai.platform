import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { TipoCampoPersonalizado, type CampoPersonalizado, type CampoPersonalizadoDto } from '../services/CampoPersonalizadoService';
import CustomSelect from './CustomSelect';
import './UserFormModal.css';
import './CampoPersonalizadoFormModal.css';

interface CampoPersonalizadoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CampoPersonalizadoDto) => void;
  campoToEdit?: CampoPersonalizado | null;
  isSaving: boolean;
}

const getInitialState = (): CampoPersonalizadoDto => ({
  nome: '',
  tipo: TipoCampoPersonalizado.Texto,
  opcoes: null,
  obrigatorio: false,
  ordem: 1,
});

const tipoOptions = [
  { value: TipoCampoPersonalizado.Texto, label: 'Texto' },
  { value: TipoCampoPersonalizado.Numero, label: 'Número' },
  { value: TipoCampoPersonalizado.Data, label: 'Data' },
  { value: TipoCampoPersonalizado.Booleano, label: 'Booleano (Sim/Não)' },
  { value: TipoCampoPersonalizado.Selecao, label: 'Seleção' },
];

const CampoPersonalizadoFormModal: React.FC<CampoPersonalizadoFormModalProps> = ({
  isOpen, onClose, onSave, campoToEdit, isSaving
}) => {
  const [campo, setCampo] = useState<CampoPersonalizadoDto>(getInitialState());
  const [opcoes, setOpcoes] = useState<string[]>([]);
  const [novaOpcao, setNovaOpcao] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (campoToEdit) {
        setCampo({
          campoPersonalizadoId: campoToEdit.campoPersonalizadoId,
          nome: campoToEdit.nome,
          tipo: campoToEdit.tipo,
          opcoes: campoToEdit.opcoes,
          obrigatorio: campoToEdit.obrigatorio,
          ordem: campoToEdit.ordem,
        });
        setOpcoes(campoToEdit.opcoes ?? []);
      } else {
        setCampo(getInitialState());
        setOpcoes([]);
      }
      setNovaOpcao('');
    }
  }, [isOpen, campoToEdit]);

  const handleAddOpcao = () => {
    const value = novaOpcao.trim();
    if (!value || opcoes.includes(value)) return;
    setOpcoes(prev => [...prev, value]);
    setNovaOpcao('');
  };

  const handleRemoveOpcao = (value: string) => {
    setOpcoes(prev => prev.filter(o => o !== value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isSelecao = campo.tipo === TipoCampoPersonalizado.Selecao;
    if (isSelecao && opcoes.length === 0) return;

    onSave({
      ...campo,
      opcoes: isSelecao ? opcoes : null,
    });
  };

  if (!isOpen) return null;

  const isSelecao = campo.tipo === TipoCampoPersonalizado.Selecao;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>{campoToEdit ? 'Editar Campo Personalizado' : 'Novo Campo Personalizado'}</h2>
          <button onClick={onClose} className="close-modal-button" disabled={isSaving}>
            <FaTimes />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSaving} className="form-fieldset">
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="campo-nome">Nome do Campo</label>
                <input
                  type="text"
                  id="campo-nome"
                  value={campo.nome}
                  onChange={e => setCampo(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Origem do Lead"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="campo-tipo">Tipo</label>
                <CustomSelect
                  value={campo.tipo.toString()}
                  onChange={value => setCampo(prev => ({ ...prev, tipo: Number(value) as TipoCampoPersonalizado }))}
                  options={tipoOptions.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="campo-ordem">Ordem</label>
                <input
                  type="number"
                  id="campo-ordem"
                  min={1}
                  value={campo.ordem}
                  onChange={e => setCampo(prev => ({ ...prev, ordem: Math.max(1, Number(e.target.value) || 1) }))}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={campo.obrigatorio}
                    onChange={e => setCampo(prev => ({ ...prev, obrigatorio: e.target.checked }))}
                  />
                  <span>Campo obrigatório</span>
                </label>
              </div>

              {isSelecao && (
                <div className="form-group full-width">
                  <label>Opções de Seleção</label>
                  <div className="opcoes-input-row">
                    <input
                      type="text"
                      value={novaOpcao}
                      onChange={e => setNovaOpcao(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOpcao();
                        }
                      }}
                      placeholder="Digite uma opção e pressione Enter"
                    />
                    <button type="button" className="opcoes-add-btn" onClick={handleAddOpcao}>
                      <FaPlus />
                    </button>
                  </div>
                  {opcoes.length > 0 ? (
                    <ul className="opcoes-list">
                      {opcoes.map(op => (
                        <li key={op} className="opcoes-list-item">
                          <span>{op}</span>
                          <button type="button" onClick={() => handleRemoveOpcao(op)}>
                            <FaTrash size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="opcoes-empty-hint">Adicione ao menos uma opção para campos de seleção.</p>
                  )}
                </div>
              )}
            </div>
          </fieldset>
          <footer className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={isSaving || (isSelecao && opcoes.length === 0)}>
              {isSaving ? 'Salvando...' : 'Salvar Campo'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CampoPersonalizadoFormModal;
