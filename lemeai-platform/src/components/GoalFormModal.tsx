import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import CustomSelect from './CustomSelect';
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
  distributionType?: 'equal' | 'full' | 'none';
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

const MONTHS_OPTIONS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
];

const currentYearNum = new Date().getFullYear();
const YEARS_OPTIONS = Array.from({ length: 11 }, (_, i) => {
  const y = (currentYearNum - 5 + i).toString();
  return { value: y, label: y };
});

const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen, onClose, onSave, goalToEdit, users, teams, currentMonth,
}) => {
  const [targetType, setTargetType] = useState<'user' | 'team'>('user');
  const [targetId, setTargetId] = useState<number>(users[0]?.id ?? 0);
  const [type, setType] = useState<'value' | 'quantity' | 'calls'>('value');
  const [targetValue, setTargetValue] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [distributionType, setDistributionType] = useState<'equal' | 'full' | 'none'>('equal');

  useEffect(() => {
    if (!isOpen) return;
    if (goalToEdit) {
      setTargetType(goalToEdit.targetType);
      setTargetId(goalToEdit.targetId);
      setType(goalToEdit.type);
      setTargetValue(goalToEdit.targetValue.toString());
      setMonth(goalToEdit.month);
      setDistributionType(goalToEdit.distributionType ?? 'equal');
    } else {
      setTargetType('user');
      setTargetId(users[0]?.id ?? 0);
      setType('value');
      setTargetValue('');
      setMonth(currentMonth);
      setDistributionType('equal');
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
      distributionType: targetType === 'team' ? distributionType : undefined,
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/\D/g, '');
    setTargetValue(clean);
  };

  const getDisplayValue = (val: string) => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    const num = Number(clean);
    if (type === 'value') {
      return 'R$ ' + num.toLocaleString('pt-BR');
    }
    return num.toLocaleString('pt-BR');
  };

  if (!isOpen) return null;

  const options = targetType === 'user' ? users : teams;
  const selectedTeam = targetType === 'team' ? teams.find(t => t.id === targetId) : null;
  const memberCount = selectedTeam?.memberCount ?? 0;

  // Calculate dynamic preview of value per member
  const getPreviewText = () => {
    if (memberCount === 0) return 'Esta equipe não possui membros cadastrados. A meta será salva apenas para a equipe.';
    if (!targetValue || Number(targetValue) <= 0) return `A meta será associada aos ${memberCount} membro(s) da equipe.`;
    
    if (distributionType === 'equal') {
      const val = type === 'value'
        ? `R$ ${(Math.round((Number(targetValue) / memberCount) * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : Math.floor(Number(targetValue) / memberCount).toLocaleString('pt-BR');
      return `Cada vendedor receberá uma meta individual de ${val} (Divisão igualitária).`;
    }
    
    if (distributionType === 'full') {
      const val = type === 'value'
        ? `R$ ${Number(targetValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : Number(targetValue).toLocaleString('pt-BR');
      return `Cada vendedor receberá a meta integral de ${val}.`;
    }
    
    return 'Nenhuma meta individual será criada para os vendedores (apenas meta da equipe).';
  };

  const [yearStr, monthStr] = month.split('-');

  const handleMonthChange = (newMonth: string) => {
    setMonth(`${yearStr}-${newMonth}`);
  };

  const handleYearChange = (newYear: string) => {
    setMonth(`${newYear}-${monthStr}`);
  };

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
                <CustomSelect
                  options={options.map(item => ({ value: item.id.toString(), label: item.name }))}
                  value={targetId.toString()}
                  onChange={val => setTargetId(Number(val))}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Meta</label>
                <CustomSelect
                  options={[
                    { value: 'value', label: 'Faturamento (R$)' },
                    { value: 'quantity', label: 'Quantidade de Vendas' },
                    { value: 'calls', label: 'Quantidade de Ligações' }
                  ]}
                  value={type}
                  onChange={val => setType(val as Goal['type'])}
                />
              </div>

              <div className="form-group full-width">
                <label>Mês de Referência</label>
                <div className="month-year-select-container">
                  <CustomSelect
                    options={MONTHS_OPTIONS}
                    value={monthStr}
                    onChange={handleMonthChange}
                  />
                  <CustomSelect
                    options={YEARS_OPTIONS}
                    value={yearStr}
                    onChange={handleYearChange}
                  />
                </div>
              </div>

              {targetType === 'team' && !goalToEdit && (
                <>
                  <div className="form-group full-width">
                    <label>Divisão da Meta entre os Vendedores</label>
                    <CustomSelect
                      options={[
                        { value: 'equal', label: 'Dividir igualmente entre os membros' },
                        { value: 'full', label: 'Replicar valor integral para todos' },
                        { value: 'none', label: 'Não criar metas individuais (apenas equipe)' }
                      ]}
                      value={distributionType}
                      onChange={val => setDistributionType(val as any)}
                    />
                  </div>

                  <div className="form-group full-width">
                    <div className="team-distribution-info">
                      <span className="distribution-icon">
                        {memberCount > 0 ? (distributionType === 'none' ? 'ℹ️' : '⚡') : '⚠️'}
                      </span>
                      <span>{getPreviewText()}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group full-width">
                <label>Valor Alvo</label>
                <input
                  type="text"
                  placeholder={type === 'value' ? 'Ex: R$ 50.000' : 'Ex: 100'}
                  value={getDisplayValue(targetValue)}
                  onChange={handleValueChange}
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
