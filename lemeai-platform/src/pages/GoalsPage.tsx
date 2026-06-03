import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import toast from 'react-hot-toast';
import { FaPlus, FaCalendarCheck, FaCopy } from 'react-icons/fa';
import GoalFormModal, { type Goal, type MockUser, type MockTeam } from '../components/GoalFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import './GoalsPage.css';
import './UserManagementPage.css';

const apiUrl = import.meta.env.VITE_API_URL;

const MOCK_USERS: MockUser[] = [
  { id: 1, name: 'Lucas Almeida' },
  { id: 2, name: 'Ana Silva' },
  { id: 3, name: 'Roberto Santos' },
  { id: 4, name: 'Julia Costa' },
];

const MOCK_TEAMS: MockTeam[] = [
  { id: 1, name: 'Vendas SP' },
  { id: 2, name: 'Suporte Técnico' },
  { id: 3, name: 'Marketing Digital' },
];

interface WorkingDays {
  monday: boolean; tuesday: boolean; wednesday: boolean;
  thursday: boolean; friday: boolean; saturday: boolean; sunday: boolean;
}

const DEFAULT_WORKING_DAYS: WorkingDays = {
  monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: false, sunday: false,
};

const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getPreviousMonth = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  const prev = new Date(year, m - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const formatGoalType = (type: string) => {
  if (type === 'value') return 'Faturamento (R$)';
  if (type === 'quantity') return 'Qtd de Vendas';
  return 'Qtd de Ligações';
};

const formatGoalValue = (value: number, type: string) => {
  if (type === 'value') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  return value.toLocaleString('pt-BR');
};

const GoalsPage = () => {
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [workingDays, setWorkingDays] = useState<WorkingDays>(DEFAULT_WORKING_DAYS);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterType, setFilterType] = useState<'all' | 'user' | 'team'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiFetch(`${apiUrl}/api/Usuario/BuscarTodos`);
      if (response.ok) {
        const result = await response.json();
        if (result.sucesso && Array.isArray(result.dados) && result.dados.length > 0) {
          setUsers(result.dados.map((u: any) => ({ id: u.userId, name: u.userName })));
          return;
        }
      }
    } catch {
      // fallback to mock
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    const stored = localStorage.getItem('lemeai_goals_v2');
    if (stored) {
      setGoals(JSON.parse(stored));
    } else {
      const initial: Goal[] = [
        { id: '1', targetType: 'user', targetId: 1, targetName: 'Lucas Almeida', type: 'value', targetValue: 50000, month: getCurrentMonth() },
        { id: '2', targetType: 'user', targetId: 1, targetName: 'Lucas Almeida', type: 'calls', targetValue: 300, month: getCurrentMonth() },
        { id: '3', targetType: 'user', targetId: 2, targetName: 'Ana Silva', type: 'value', targetValue: 35000, month: getCurrentMonth() },
        { id: '4', targetType: 'user', targetId: 3, targetName: 'Roberto Santos', type: 'value', targetValue: 60000, month: getCurrentMonth() },
        { id: '5', targetType: 'team', targetId: 1, targetName: 'Vendas SP', type: 'value', targetValue: 200000, month: getCurrentMonth() },
      ];
      setGoals(initial);
      localStorage.setItem('lemeai_goals_v2', JSON.stringify(initial));
    }

    const storedDays = localStorage.getItem('lemeai_working_days');
    setWorkingDays(storedDays ? JSON.parse(storedDays) : DEFAULT_WORKING_DAYS);
  }, [fetchUsers]);

  const persist = (updated: Goal[]) => {
    setGoals(updated);
    localStorage.setItem('lemeai_goals_v2', JSON.stringify(updated));
  };

  const handleSave = (goal: Goal) => {
    const isEditing = goals.some(g => g.id === goal.id);

    const duplicate = goals.some(g =>
      g.id !== goal.id &&
      g.targetType === goal.targetType &&
      g.targetId === goal.targetId &&
      g.type === goal.type &&
      g.month === goal.month
    );
    if (duplicate) {
      toast.error('Já existe uma meta deste tipo para este colaborador/equipe neste mês.');
      return;
    }

    const updated = isEditing
      ? goals.map(g => g.id === goal.id ? goal : g)
      : [...goals, goal];

    persist(updated);
    toast.success(isEditing ? 'Meta atualizada!' : 'Meta cadastrada com sucesso!');
    setIsModalOpen(false);
    setGoalToEdit(null);
  };

  const handleDelete = () => {
    if (!goalToDeleteId) return;
    persist(goals.filter(g => g.id !== goalToDeleteId));
    toast.success('Meta removida.');
    setGoalToDeleteId(null);
  };

  const handleReplicatePreviousMonth = () => {
    const prevMonth = getPreviousMonth(selectedMonth);
    const prevGoals = goals.filter(g => g.month === prevMonth);

    if (prevGoals.length === 0) {
      toast.error(`Nenhuma meta encontrada em ${formatMonth(prevMonth)}.`);
      return;
    }

    const newGoals: Goal[] = [];
    let skipped = 0;

    prevGoals.forEach(g => {
      const exists = goals.some(
        e => e.targetType === g.targetType && e.targetId === g.targetId && e.type === g.type && e.month === selectedMonth
      );
      if (exists) { skipped++; return; }
      newGoals.push({ ...g, id: Date.now().toString() + Math.random(), month: selectedMonth });
    });

    if (newGoals.length === 0) {
      toast.error('Todas as metas do mês anterior já existem neste mês.');
      return;
    }

    persist([...goals, ...newGoals]);
    toast.success(
      `${newGoals.length} meta(s) copiada(s) de ${formatMonth(prevMonth)}${skipped > 0 ? ` (${skipped} já existiam e foram ignoradas)` : ''}.`
    );
  };

  const handleWorkingDayChange = (day: keyof WorkingDays) => {
    const updated = { ...workingDays, [day]: !workingDays[day] };
    setWorkingDays(updated);
    localStorage.setItem('lemeai_working_days', JSON.stringify(updated));
    toast.success('Dias de funcionamento atualizados!');
  };

  const handleOpenEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setGoalToEdit(null);
    setIsModalOpen(true);
  };

  // Filter goals by selected month and type filter
  const filteredGoals = goals.filter(g =>
    g.month === selectedMonth &&
    (filterType === 'all' || g.targetType === filterType)
  );

  // Group by targetName
  const grouped = filteredGoals.reduce<Record<string, { targetType: 'user' | 'team'; goals: Goal[] }>>((acc, g) => {
    const key = `${g.targetType}:${g.targetId}`;
    if (!acc[key]) acc[key] = { targetType: g.targetType, goals: [] };
    acc[key].goals.push(g);
    return acc;
  }, {});

  return (
    <>
      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setGoalToEdit(null); }}
        onSave={handleSave}
        goalToEdit={goalToEdit}
        users={users}
        teams={MOCK_TEAMS}
        currentMonth={selectedMonth}
      />
      <ConfirmationModal
        isOpen={goalToDeleteId !== null}
        onClose={() => setGoalToDeleteId(null)}
        onConfirm={handleDelete}
        title="Remover Meta"
        message="Tem certeza que deseja remover esta meta?"
        confirmText="Remover"
        isConfirming={false}
      />

      <div className="page-container goals-page">
        <div className="page-header">
          <h1>Metas</h1>
          <div className="page-header-actions">
            <button className="secondary-action-btn" onClick={handleReplicatePreviousMonth}>
              <FaCopy /> Copiar mês anterior
            </button>
            <button className="add-button" onClick={handleOpenNew}>
              <FaPlus /> Nova Meta
            </button>
          </div>
        </div>

        {/* Goals table card */}
        <div className="dashboard-card">
          <div className="filters-container">
            <input
              type="month"
              className="filter-input month-filter"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            />
            <div className="users-filters">
              {(['all', 'user', 'team'] as const).map(f => (
                <button
                  key={f}
                  className={`filter-button ${filterType === f ? 'active' : ''}`}
                  onClick={() => setFilterType(f)}
                >
                  {f === 'all' ? 'Todos' : f === 'user' ? 'Colaboradores' : 'Equipes'}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Tipo de Meta</th>
                  <th>Valor Alvo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(grouped).length > 0 ? (
                  Object.entries(grouped).map(([key, group]) => (
                    <>
                      <tr key={`header-${key}`} className="group-header-row">
                        <td colSpan={3}>
                          <span className={`group-type-badge ${group.targetType}`}>
                            {group.targetType === 'user' ? 'Colaborador' : 'Equipe'}
                          </span>
                          {group.goals[0].targetName}
                        </td>
                      </tr>
                      {group.goals.map(g => (
                        <tr key={g.id} className="group-child-row">
                          <td>
                            <span className={`type-badge type-${g.type}`}>
                              {formatGoalType(g.type)}
                            </span>
                          </td>
                          <td><strong>{formatGoalValue(g.targetValue, g.type)}</strong></td>
                          <td className="actions-cell">
                            <button className="action-button edit" onClick={() => handleOpenEdit(g)}>Editar</button>
                            <button className="action-button delete" onClick={() => setGoalToDeleteId(g.id)}>Remover</button>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      Nenhuma meta cadastrada para {formatMonth(selectedMonth)}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Working days card */}
        <div className="dashboard-card working-days-card">
          <div className="card-header">
            <h3><FaCalendarCheck /> Dias de Funcionamento</h3>
            <p className="card-subtitle">Selecione os dias que a empresa opera para o cálculo de metas diárias.</p>
          </div>
          <div className="working-days-list">
            {([
              { key: 'monday', label: 'Segunda-feira' },
              { key: 'tuesday', label: 'Terça-feira' },
              { key: 'wednesday', label: 'Quarta-feira' },
              { key: 'thursday', label: 'Quinta-feira' },
              { key: 'friday', label: 'Sexta-feira' },
              { key: 'saturday', label: 'Sábado' },
              { key: 'sunday', label: 'Domingo' },
            ] as const).map(day => (
              <label key={day.key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={workingDays[day.key]}
                  onChange={() => handleWorkingDayChange(day.key)}
                />
                <span className="checkbox-custom"></span>
                <span className="label-text">{day.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalsPage;
