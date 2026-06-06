import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './UserFormModal.css';
import './GoalFormModal.css';

export interface MockUser { id: number; name: string; }
export interface MockTeam { id: number; name: string; memberCount?: number; }

export interface Goal {
  id: string;
  targetType: 'user' | 'team';
  targetId: number;
  targetName: string;
  type: 'value' | 'quantity' | 'calls';
  targetValue: number;
  realizedValue?: number;
  month: string;
}

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  goalToEdit?: Goal | null;
  users: MockUser[];
  teams: MockTeam[];
  currentMonth: string;
}

const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen, onClose, onSave, goalToEdit, users, teams, currentMonth,
}) => {
  const [targetType, setTargetType] = useState<'user' | 'team'>('user');
  const [targetId, setTargetId] = useState<number>(users[0]?.id ?? 0);
  const [type, setType] = useState<'value' | 'quantity' | 'calls'>('value');
  const [targetValue, setTargetValue] = useState('');
  const [month, setMonth] = useState(currentMonth);

  useEffect(() => {
    if (!isOpen) return;
    if (goalToEdit) {
      setTargetType(goalToEdit.targetType);
      setTargetId(goalToEdit.targetId);
      setType(goalToEdit.type);
      setTargetValue(goalToEdit.targetValue.toString());
      setMonth(goalToEdit.month);
    } else {
      setTargetType('user');
      setTargetId(users[0]?.id ?? 0);
      setType('value');
      setTargetValue('');
      setMonth(currentMonth);
    }
  }, [isOpen, goalToEdit, users, currentMonth]);

  const handleTargetTypeChange = (t: 'user' | 'team') => {
    setTargetType(t);
    setTargetId(t === 'user' ? (users[0]?.id ?? 0) : (teams[0]?.id ?? 0));
  };

  const getTargetName = () => {
    const list = targetType === 'user' ? users : teams;
    return list.find(i => i.id === targetId)?.name ?? '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: goalToEdit?.id ?? `new_${Date.now()}`,
      targetType,
      targetId,
      targetName: getTargetName(),
      type,
      targetValue: Number(targetValue),
      month,
    });
  };

  if (!isOpen) return null;

  const options = targetType === 'user' ? users : teams;
  const selectedTeam = targetType === 'team' ? teams.find(t => t.id === targetId) : null;
  const memberCount = selectedTeam?.memberCount ?? 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>{goalToEdit ? 'Editar Meta' : 'Nova Meta'}</h2>
          <button onClick={onClose} className="close-modal-button"><FaTimes /></button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-content-body">
            <div className="form-grid">

              <div className="form-group full-width">
                <label>Atribuir para</label>
                <div className="target-type-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${targetType === 'user' ? 'active' : ''}`}
                    onClick={() => handleTargetTypeChange('user')}
                  >
                    Colaborador
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${targetType === 'team' ? 'active' : ''}`}
                    onClick={() => handleTargetTypeChange('team')}
                  >
                    Equipe
                  </button>
                </div>
              </div>

              <div className="form-group full-width">
                <label>{targetType === 'user' ? 'Colaborador' : 'Equipe'}</label>
                <select value={targetId} onChange={e => setTargetId(Number(e.target.value))}>
                  {options.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de Meta</label>
                <select value={type} onChange={e => setType(e.target.value as Goal['type'])}>
                  <option value="value">Faturamento (R$)</option>
                  <option value="quantity">Quantidade de Vendas</option>
                  <option value="calls">Quantidade de Ligações</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mês de Referência</label>
                <input
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  required
                />
              </div>

              {targetType === 'team' && !goalToEdit && (
                <div className="form-group full-width">
                  <div className="team-distribution-info">
                    {memberCount > 0 ? (
                      <>
                        <span className="distribution-icon">⚡</span>
                        <span>
                          A meta será distribuída igualmente entre os <strong>{memberCount} membro(s)</strong> da equipe
                          {targetValue && Number(targetValue) > 0 && (
                            <> — <strong>
                              {type === 'value'
                                ? `R$ ${(Math.round((Number(targetValue) / memberCount) * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                : Math.floor(Number(targetValue) / memberCount).toLocaleString('pt-BR')
                              }
                            </strong> por vendedor</>
                          )}.
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="distribution-icon">⚠️</span>
                        <span>Esta equipe não possui membros cadastrados. A meta será salva apenas para a equipe.</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group full-width">
                <label>Valor Alvo</label>
                <input
                  type="number"
                  placeholder={type === 'value' ? 'Ex: 50000' : 'Ex: 100'}
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                  min="1"
                  required
                />
              </div>

            </div>
          </div>

          <footer className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button primary">
              {goalToEdit ? 'Salvar alterações' : 'Adicionar Meta'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default GoalFormModal;
