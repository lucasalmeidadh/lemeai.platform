import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaCalendarCheck, FaCheckCircle, FaTimesCircle, FaCalendarWeek } from 'react-icons/fa';
import ConfiguracaoService, { DEFAULT_DIAS_UTEIS, type DiasUteis } from '../services/ConfiguracaoService';
import './WorkingDaysPage.css';

const DAY_CONFIG: {
  key: keyof DiasUteis;
  label: string;
  abbr: string;
  type: 'weekday' | 'weekend';
}[] = [
  { key: 'segunda', label: 'Segunda-feira', abbr: 'SEG', type: 'weekday' },
  { key: 'terca',   label: 'Terça-feira',   abbr: 'TER', type: 'weekday' },
  { key: 'quarta',  label: 'Quarta-feira',  abbr: 'QUA', type: 'weekday' },
  { key: 'quinta',  label: 'Quinta-feira',  abbr: 'QUI', type: 'weekday' },
  { key: 'sexta',   label: 'Sexta-feira',   abbr: 'SEX', type: 'weekday' },
  { key: 'sabado',  label: 'Sábado',        abbr: 'SÁB', type: 'weekend' },
  { key: 'domingo', label: 'Domingo',       abbr: 'DOM', type: 'weekend' },
];

const WorkingDaysPage = () => {
  const [workingDays, setWorkingDays] = useState<DiasUteis>(DEFAULT_DIAS_UTEIS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ConfiguracaoService.getDiasUteis()
      .then(setWorkingDays)
      .catch((err: any) => toast.error(err.message ?? 'Erro ao carregar dias de funcionamento.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = async (day: keyof DiasUteis) => {
    const prev = workingDays;
    const updated = { ...workingDays, [day]: !workingDays[day] };
    setWorkingDays(updated);
    setIsSaving(true);
    try {
      await ConfiguracaoService.updateDiasUteis(updated);
      toast.success('Dias de funcionamento atualizados!');
    } catch (err: any) {
      setWorkingDays(prev);
      toast.error(err.message ?? 'Erro ao atualizar dias de funcionamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeDays = Object.values(workingDays).filter(Boolean).length;
  const inactiveDays = 7 - activeDays;
  const weekendDays = DAY_CONFIG.filter(d => d.type === 'weekend' && workingDays[d.key]).length;

  return (
    <div className="working-days-page">
      <div className="working-days-header">
        <div>
          <h1>Dias de Funcionamento</h1>
          <p className="working-days-header-subtitle">
            Configure os dias em que a empresa opera para o cálculo de metas e projeções.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="working-days-summary">
        <div className="summary-card">
          <div className="summary-card-icon active">
            <FaCheckCircle />
          </div>
          <div className="summary-card-info">
            <span className="summary-card-value">{activeDays}</span>
            <span className="summary-card-label">Dias ativos por semana</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon inactive">
            <FaTimesCircle />
          </div>
          <div className="summary-card-info">
            <span className="summary-card-value">{inactiveDays}</span>
            <span className="summary-card-label">Dias sem operação</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon weekend">
            <FaCalendarWeek />
          </div>
          <div className="summary-card-info">
            <span className="summary-card-value">{weekendDays}</span>
            <span className="summary-card-label">Fins de semana ativos</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="working-days-table-card">
        <div className="working-days-table-header">
          <div className="working-days-table-header-icon">
            <FaCalendarCheck />
          </div>
          <div className="working-days-table-header-text">
            <h3>Configuração de Funcionamento</h3>
            <p>Ative ou desative cada dia da semana conforme a operação da empresa.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="working-days-loading">
            Carregando configurações...
          </div>
        ) : (
          <table className="working-days-table">
            <thead>
              <tr>
                <th>Dia da Semana</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {DAY_CONFIG.map(day => {
                const isActive = workingDays[day.key];
                return (
                  <tr key={day.key} className={isActive ? 'day-active' : ''}>
                    <td>
                      <div className="day-cell">
                        <div className={`day-icon ${isActive ? 'active' : 'inactive'}`}>
                          {day.abbr}
                        </div>
                        <span className="day-name">{day.label}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${day.type === 'weekday' ? 'active' : 'inactive'}`}>
                        <span className="status-dot" />
                        {day.type === 'weekday' ? 'Dia útil' : 'Final de semana'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                        <span className="status-dot" />
                        {isActive ? 'Operando' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="toggle-cell">
                        <label className="toggle-switch" aria-label={`Ativar ${day.label}`}>
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleToggle(day.key)}
                            disabled={isSaving}
                          />
                          <div className="toggle-track">
                            <div className="toggle-thumb" />
                          </div>
                        </label>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WorkingDaysPage;
