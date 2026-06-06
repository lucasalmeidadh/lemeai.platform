import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaCalendarCheck } from 'react-icons/fa';
import ConfiguracaoService, { DEFAULT_DIAS_UTEIS, type DiasUteis } from '../services/ConfiguracaoService';
import './GoalsPage.css';

const DAY_LABELS: { key: keyof DiasUteis; label: string }[] = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca',   label: 'Terça-feira' },
  { key: 'quarta',  label: 'Quarta-feira' },
  { key: 'quinta',  label: 'Quinta-feira' },
  { key: 'sexta',   label: 'Sexta-feira' },
  { key: 'sabado',  label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

const WorkingDaysPage = () => {
  const [workingDays, setWorkingDays] = useState<DiasUteis>(DEFAULT_DIAS_UTEIS);
  const [isSavingDays, setIsSavingDays] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkingDays = async () => {
      try {
        const dias = await ConfiguracaoService.getDiasUteis();
        setWorkingDays(dias);
      } catch (err: any) {
        toast.error(err.message ?? 'Erro ao carregar dias de funcionamento.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkingDays();
  }, []);

  const handleWorkingDayChange = async (day: keyof DiasUteis) => {
    const updated = { ...workingDays, [day]: !workingDays[day] };
    setWorkingDays(updated);
    setIsSavingDays(true);
    try {
      await ConfiguracaoService.updateDiasUteis(updated);
      toast.success('Dias de funcionamento atualizados!');
    } catch (err: any) {
      setWorkingDays(workingDays);
      toast.error(err.message ?? 'Erro ao atualizar dias de funcionamento.');
    } finally {
      setIsSavingDays(false);
    }
  };

  return (
    <div className="page-container goals-page">
      <div className="page-header">
        <h1>Dias de Funcionamento</h1>
      </div>

      <div className="dashboard-card working-days-card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <h3><FaCalendarCheck /> Configuração de Funcionamento</h3>
          <p className="card-subtitle">Selecione os dias da semana em que a empresa opera para o cálculo automático das projeções e metas diárias.</p>
        </div>
        
        {isLoading ? (
          <div style={{ padding: '2rem 0', color: 'var(--text-tertiary)' }}>Carregando...</div>
        ) : (
          <div className="working-days-list">
            {DAY_LABELS.map(day => (
              <label key={day.key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={workingDays[day.key]}
                  onChange={() => handleWorkingDayChange(day.key)}
                  disabled={isSavingDays}
                />
                <span className="checkbox-custom"></span>
                <span className="label-text">{day.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingDaysPage;
