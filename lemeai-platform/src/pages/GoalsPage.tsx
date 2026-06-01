import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaCalendarAlt, FaUser, FaBullseye, FaCalendarCheck } from 'react-icons/fa';
import './GoalsPage.css';

const apiUrl = import.meta.env.VITE_API_URL;

interface Goal {
  id: string;
  userId: number;
  userName: string;
  type: 'value' | 'quantity' | 'calls'; // Faturamento, Quantidade de Vendas, Ligações
  targetValue: number;
  month: string; // YYYY-MM
}

interface WorkingDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

const DEFAULT_WORKING_DAYS: WorkingDays = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
};

const MOCK_USERS = [
  { id: 1, name: 'Lucas Almeida' },
  { id: 2, name: 'Ana Silva' },
  { id: 3, name: 'Roberto Santos' },
  { id: 4, name: 'Julia Costa' },
];

const GoalsPage = () => {
  const [users, setUsers] = useState<{ id: number; name: string }[]>(MOCK_USERS);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [workingDays, setWorkingDays] = useState<WorkingDays>(DEFAULT_WORKING_DAYS);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [goalType, setGoalType] = useState<'value' | 'quantity' | 'calls'>('value');
  const [targetValue, setTargetValue] = useState<string>('');
  const [targetMonth, setTargetMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Fetch users from API (fallback to mock)
  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiFetch(`${apiUrl}/api/Usuario/BuscarTodos`);
      if (response.ok) {
        const result = await response.json();
        if (result.sucesso && Array.isArray(result.dados)) {
          const mapped = result.dados.map((u: any) => ({
            id: u.userId,
            name: u.userName,
          }));
          setUsers(mapped.length > 0 ? mapped : MOCK_USERS);
          if (mapped.length > 0) {
            setSelectedUserId(mapped[0].id);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Usando usuários mockados devido a erro na API:', e);
    }
    setSelectedUserId(MOCK_USERS[0].id);
  }, []);

  // Load goals & working days from localStorage
  useEffect(() => {
    fetchUsers();

    const storedGoals = localStorage.getItem('lemeai_goals');
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
    } else {
      // Mock initial goals
      const initialGoals: Goal[] = [
        { id: '1', userId: 1, userName: 'Lucas Almeida', type: 'value', targetValue: 50000, month: targetMonth },
        { id: '2', userId: 1, userName: 'Lucas Almeida', type: 'calls', targetValue: 300, month: targetMonth },
        { id: '3', userId: 2, userName: 'Ana Silva', type: 'value', targetValue: 35000, month: targetMonth },
        { id: '4', userId: 3, userName: 'Roberto Santos', type: 'value', targetValue: 60000, month: targetMonth },
      ];
      setGoals(initialGoals);
      localStorage.setItem('lemeai_goals', JSON.stringify(initialGoals));
    }

    const storedDays = localStorage.getItem('lemeai_working_days');
    if (storedDays) {
      setWorkingDays(JSON.parse(storedDays));
    } else {
      localStorage.setItem('lemeai_working_days', JSON.stringify(DEFAULT_WORKING_DAYS));
    }
  }, [fetchUsers, targetMonth]);

  const handleWorkingDayChange = (day: keyof WorkingDays) => {
    const updated = { ...workingDays, [day]: !workingDays[day] };
    setWorkingDays(updated);
    localStorage.setItem('lemeai_working_days', JSON.stringify(updated));
    toast.success('Dias de funcionamento atualizados!');
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !targetValue || Number(targetValue) <= 0) {
      toast.error('Preencha todos os campos com valores válidos.');
      return;
    }

    const userObj = users.find(u => u.id === selectedUserId);
    if (!userObj) return;

    // Check if goal already exists for this user, type and month
    const exists = goals.some(g => g.userId === selectedUserId && g.type === goalType && g.month === targetMonth);
    if (exists) {
      toast.error('Já existe uma meta cadastrada para este usuário, tipo e mês.');
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      userId: selectedUserId,
      userName: userObj.name,
      type: goalType,
      targetValue: Number(targetValue),
      month: targetMonth,
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    localStorage.setItem('lemeai_goals', JSON.stringify(updatedGoals));
    setTargetValue('');
    toast.success('Meta cadastrada com sucesso!');
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    localStorage.setItem('lemeai_goals', JSON.stringify(updated));
    toast.success('Meta removida.');
  };

  const formatGoalType = (type: string) => {
    switch (type) {
      case 'value': return 'Faturamento (R$)';
      case 'quantity': return 'Qtd de Vendas';
      case 'calls': return 'Qtd de Ligações';
      default: return type;
    }
  };

  const formatGoalValue = (value: number, type: string) => {
    if (type === 'value') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    return value.toString();
  };

  return (
    <div className="page-container goals-page">
      <div className="page-header">
        <h1>Cadastro de Metas</h1>
        <p className="page-subtitle">Configure as metas do time e o calendário de funcionamento da empresa.</p>
      </div>

      <div className="goals-grid">
        {/* Calendário de Funcionamento */}
        <div className="dashboard-card calendar-card">
          <div className="card-header">
            <h3><FaCalendarCheck /> Dias de Funcionamento</h3>
            <p className="card-subtitle">Selecione os dias que a empresa opera para o cálculo de metas diárias/semanais.</p>
          </div>
          <div className="working-days-list">
            {[
              { key: 'monday', label: 'Segunda-feira' },
              { key: 'tuesday', label: 'Terça-feira' },
              { key: 'wednesday', label: 'Quarta-feira' },
              { key: 'thursday', label: 'Quinta-feira' },
              { key: 'friday', label: 'Sexta-feira' },
              { key: 'saturday', label: 'Sábado' },
              { key: 'sunday', label: 'Domingo' },
            ].map(day => (
              <label key={day.key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={workingDays[day.key as keyof WorkingDays]}
                  onChange={() => handleWorkingDayChange(day.key as keyof WorkingDays)}
                />
                <span className="checkbox-custom"></span>
                <span className="label-text">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cadastro de Meta */}
        <div className="dashboard-card form-card">
          <div className="card-header">
            <h3><FaBullseye /> Nova Meta</h3>
          </div>
          <form onSubmit={handleAddGoal} className="goal-form">
            <div className="form-group">
              <label><FaUser /> Colaborador</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(Number(e.target.value))}
                className="form-select"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><FaBullseye /> Tipo de Meta</label>
              <select
                value={goalType}
                onChange={e => setGoalType(e.target.value as any)}
                className="form-select"
              >
                <option value="value">Faturamento (R$)</option>
                <option value="quantity">Quantidade de Vendas</option>
                <option value="calls">Quantidade de Ligações</option>
              </select>
            </div>

            <div className="form-group">
              <label><FaCalendarAlt /> Mês de Referência</label>
              <input
                type="month"
                value={targetMonth}
                onChange={e => setTargetMonth(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Valor Alvo</label>
              <input
                type="number"
                placeholder={goalType === 'value' ? 'Ex: 50000' : 'Ex: 100'}
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
                className="form-input"
                min="1"
              />
            </div>

            <button type="submit" className="btn-primary">
              <FaPlus /> Adicionar Meta
            </button>
          </form>
        </div>

        {/* Lista de Metas */}
        <div className="dashboard-card list-card full-width-card">
          <div className="card-header">
            <h3>Metas Cadastradas</h3>
          </div>
          <div className="table-container">
            <table className="goals-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Mês</th>
                  <th>Tipo de Meta</th>
                  <th>Valor Alvo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {goals.length > 0 ? (
                  goals.map(g => (
                    <tr key={g.id}>
                      <td>{g.userName}</td>
                      <td>{g.month}</td>
                      <td>
                        <span className={`type-badge type-${g.type}`}>
                          {formatGoalType(g.type)}
                        </span>
                      </td>
                      <td><strong>{formatGoalValue(g.targetValue, g.type)}</strong></td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteGoal(g.id)}
                          title="Excluir Meta"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      Nenhuma meta cadastrada para este mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
