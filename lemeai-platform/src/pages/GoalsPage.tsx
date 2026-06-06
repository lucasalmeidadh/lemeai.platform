import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaCopy, FaEdit, FaTrash } from 'react-icons/fa';
import GoalFormModal from '../components/GoalFormModal';
import type { Goal, MockUser, MockTeam } from '../components/GoalFormModal';
import type { Equipe } from '../services/EquipeService';
import ConfirmationModal from '../components/ConfirmationModal';
import MetaGoalService from '../services/MetaGoalService';
import EquipeService from '../services/EquipeService';
import { apiFetch } from '../services/api';
import './GoalsPage.css';
import './UserManagementPage.css';

const API_URL = import.meta.env.VITE_API_URL || '';

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
  const [users, setUsers] = useState<MockUser[]>([]);
  const [teams, setTeams] = useState<MockTeam[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterType, setFilterType] = useState<'all' | 'user' | 'team'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = useCallback(async (mes: string) => {
    try {
      const metas = await MetaGoalService.buscarTodas(mes);
      setGoals(metas.map(m => ({
        id: String(m.id),
        targetType: m.tipoAlvo,
        targetId: m.alvoId,
        targetName: m.alvoNome,
        type: m.tipo,
        targetValue: m.valorAlvo,
        realizedValue: m.valorRealizado,
        month: m.mes,
      })));
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao carregar metas.');
    }
  }, []);

  const fetchStaticData = useCallback(async () => {
    try {
      const [equipes, usersRes] = await Promise.all([
        EquipeService.buscarTodas(),
        apiFetch(`${API_URL}/api/Usuario/BuscarTodos`),
      ]);

      setEquipes(equipes);
      setTeams(equipes.map(e => ({ id: e.id, name: e.nome, memberCount: e.membros.length })));

      const usersData = await usersRes.json();
      if (usersData.sucesso && Array.isArray(usersData.dados)) {
        setUsers(usersData.dados.map((u: any) => ({ id: u.userId, name: u.userName })));
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchStaticData(), fetchGoals(selectedMonth)]).finally(() => setIsLoading(false));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchGoals(selectedMonth);
  }, [selectedMonth, fetchGoals]);

  const handleSave = async (goal: Goal) => {
    const dto = {
      tipoAlvo: goal.targetType,
      alvoId: goal.targetId,
      tipo: goal.type,
      valorAlvo: goal.targetValue,
      mes: goal.month,
    };

    try {
      const isEditing = goal.id && !goal.id.startsWith('new_');
      if (isEditing) {
        await MetaGoalService.atualizar(Number(goal.id), dto);
        toast.success('Meta atualizada!');
      } else {
        await MetaGoalService.criar(dto);

        if (goal.targetType === 'team') {
          const equipe = equipes.find(e => e.id === goal.targetId);
          const membros = equipe?.membros ?? [];
          if (membros.length > 0) {
            const valorPorMembro = goal.type === 'value'
              ? Math.round((goal.targetValue / membros.length) * 100) / 100
              : Math.floor(goal.targetValue / membros.length);

            await Promise.allSettled(
              membros.map(m =>
                MetaGoalService.criar({
                  tipoAlvo: 'user',
                  alvoId: m.id,
                  tipo: goal.type,
                  valorAlvo: valorPorMembro,
                  mes: goal.month,
                })
              )
            );

            const valorFormatado = goal.type === 'value'
              ? `R$ ${valorPorMembro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : valorPorMembro.toLocaleString('pt-BR');
            toast.success(`Meta da equipe criada! ${valorFormatado} distribuído para ${membros.length} vendedor(es).`);
          } else {
            toast.success('Meta da equipe cadastrada com sucesso!');
          }
        } else {
          toast.success('Meta cadastrada com sucesso!');
        }
      }
      setIsModalOpen(false);
      setGoalToEdit(null);
      fetchGoals(selectedMonth);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar meta.');
    }
  };

  const handleDelete = async () => {
    if (!goalToDeleteId) return;
    setIsDeleting(true);
    try {
      await MetaGoalService.excluir(Number(goalToDeleteId));
      toast.success('Meta removida.');
      setGoalToDeleteId(null);
      fetchGoals(selectedMonth);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao remover meta.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplicatePreviousMonth = async () => {
    const prevMonth = getPreviousMonth(selectedMonth);
    try {
      const result = await MetaGoalService.replicar({ mesOrigem: prevMonth, mesDestino: selectedMonth });
      if (result.copiadas === 0) {
        toast.error('Todas as metas do mês anterior já existem neste mês.');
      } else {
        toast.success(
          `${result.copiadas} meta(s) copiada(s) de ${formatMonth(prevMonth)}${result.ignoradas > 0 ? ` (${result.ignoradas} já existiam e foram ignoradas)` : ''}.`
        );
        fetchGoals(selectedMonth);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao replicar metas.');
    }
  };

  const handleOpenEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setGoalToEdit(null);
    setIsModalOpen(true);
  };

  const filteredGoals = goals.filter(g =>
    g.month === selectedMonth &&
    (filterType === 'all' || g.targetType === filterType)
  );

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
        teams={teams}
        currentMonth={selectedMonth}
      />
      <ConfirmationModal
        isOpen={goalToDeleteId !== null}
        onClose={() => setGoalToDeleteId(null)}
        onConfirm={handleDelete}
        title="Remover Meta"
        message="Tem certeza que deseja remover esta meta?"
        confirmText="Remover"
        isConfirming={isDeleting}
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
                  <th>Meta</th>
                  <th>Progresso</th>
                  <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="empty-state">Carregando...</td>
                  </tr>
                ) : Object.keys(grouped).length > 0 ? (
                  Object.entries(grouped).map(([key, group]) => (
                    <>
                      <tr key={`header-${key}`} className="group-header-row">
                        <td colSpan={4}>
                          <span className={`group-type-badge ${group.targetType}`}>
                            {group.targetType === 'user' ? 'Colaborador' : 'Equipe'}
                          </span>
                          {group.goals[0].targetName}
                        </td>
                      </tr>
                      {group.goals.map(g => {
                        const realized = g.realizedValue ?? 0;
                        const pct = g.targetValue > 0 ? Math.min(Math.round((realized / g.targetValue) * 100), 100) : 0;
                        const barColor = pct >= 100 ? 'goal-bar-green' : pct >= 70 ? 'goal-bar-yellow' : 'goal-bar-red';
                        return (
                          <tr key={g.id} className="group-child-row">
                            <td>
                              <span className={`type-badge type-${g.type}`}>
                                {formatGoalType(g.type)}
                              </span>
                            </td>
                            <td><strong>{formatGoalValue(g.targetValue, g.type)}</strong></td>
                            <td>
                              <div className="goal-progress-cell">
                                <div className="goal-progress-track">
                                  <div className={`goal-progress-fill ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="goal-progress-label">
                                  <strong>{formatGoalValue(realized, g.type)}</strong>
                                  <span className="goal-progress-pct">{pct}%</span>
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                <button className="action-icon-btn edit" onClick={() => handleOpenEdit(g)} title="Editar">
                                  <FaEdit size={14} />
                                </button>
                                <button className="action-icon-btn delete" onClick={() => setGoalToDeleteId(g.id)} title="Remover">
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      Nenhuma meta cadastrada para {formatMonth(selectedMonth)}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
};

export default GoalsPage;
