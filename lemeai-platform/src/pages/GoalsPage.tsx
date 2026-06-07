import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaCopy, FaEdit, FaTrash, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import GoalFormModal from '../components/GoalFormModal';
import type { Goal, MockUser, MockTeam } from '../components/GoalFormModal';
import type { Equipe } from '../services/EquipeService';
import ConfirmationModal from '../components/ConfirmationModal';
import MetaGoalService from '../services/MetaGoalService';
import EquipeService from '../services/EquipeService';
import RelatorioService from '../services/RelatorioService';
import type { PerformanceIndividual, PerformanceEquipe } from '../services/RelatorioService';
import { OpportunityService, type Opportunity } from '../services/OpportunityService';
import { apiFetch } from '../services/api';
import CompactMonthPicker from '../components/CompactMonthPicker';
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

  const [pendingGoalSave, setPendingGoalSave] = useState<Goal | null>(null);
  const [syncConfirmData, setSyncConfirmData] = useState<{
    equipeNome: string;
    valorAntigo: number;
    valorNovo: number;
    tipo: 'value' | 'quantity' | 'calls';
  } | null>(null);

  // Estados adicionados para a busca dos dados reais de monitoramento/oportunidades
  const [individualPerf, setIndividualPerf] = useState<PerformanceIndividual[]>([]);
  const [teamPerf, setTeamPerf] = useState<PerformanceEquipe[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = useCallback(async (mes: string) => {
    try {
      const metas = await MetaGoalService.buscarTodas(mes);
      setGoals(metas.map(m => {
        // Normaliza o tipo retornado pela API para os tipos internos do frontend
        let mappedType: 'value' | 'quantity' | 'calls' = 'calls';
        const rawTipo = String(m.tipo).toLowerCase();
        if (rawTipo === 'valor' || rawTipo === 'value') {
          mappedType = 'value';
        } else if (rawTipo === 'vendas' || rawTipo === 'quantity') {
          mappedType = 'quantity';
        } else if (rawTipo === 'calls' || rawTipo === 'ligacoes') {
          mappedType = 'calls';
        }

        return {
          id: String(m.id),
          targetType: m.tipoAlvo,
          targetId: m.alvoId,
          targetName: m.alvoNome,
          type: mappedType,
          targetValue: m.valorAlvo,
          realizedValue: m.valorRealizado,
          month: m.mes,
        };
      }));
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao carregar metas.');
    }
  }, []);

  const fetchPerformanceAndOpportunities = useCallback(async (mes: string) => {
    try {
      const [indData, teamData, oppData] = await Promise.all([
        RelatorioService.getPerformanceIndividual(mes).catch(() => []),
        RelatorioService.getPerformanceEquipes(mes).catch(() => []),
        OpportunityService.getAllOpportunities().catch(() => []),
      ]);
      setIndividualPerf(indData);
      setTeamPerf(teamData);
      setOpportunities(oppData);
    } catch (err) {
      console.error('Erro ao buscar dados de performance e oportunidades:', err);
    }
  }, []);

  const fetchStaticData = useCallback(async () => {
    try {
      const [equipesData, usersRes] = await Promise.all([
        EquipeService.buscarTodas(),
        apiFetch(`${API_URL}/api/Usuario/BuscarTodos`),
      ]);

      setEquipes(equipesData);
      setTeams(equipesData.map(e => ({ id: e.id, name: e.nome, memberCount: e.membros.length })));

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
    Promise.all([
      fetchStaticData(),
      fetchGoals(selectedMonth),
      fetchPerformanceAndOpportunities(selectedMonth)
    ]).finally(() => setIsLoading(false));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchGoals(selectedMonth),
      fetchPerformanceAndOpportunities(selectedMonth)
    ]).finally(() => setIsLoading(false));
  }, [selectedMonth, fetchGoals, fetchPerformanceAndOpportunities]);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  // Sincroniza a meta da equipe correspondente com base no tipo e no mês
  const syncTeamGoal = async (userId: number, type: 'value' | 'quantity' | 'calls', month: string) => {
    try {
      const equipe = equipes.find(e => e.membros.some(m => m.id === userId));
      if (!equipe) return;

      const todasMetas = await MetaGoalService.buscarTodas(month);
      const metaEquipe = todasMetas.find(m => m.tipoAlvo === 'team' && m.alvoId === equipe.id && m.tipo === type);
      if (!metaEquipe) return;

      const membrosIds = equipe.membros.map(m => m.id);
      const somaMembros = todasMetas
        .filter(m => m.tipoAlvo === 'user' && m.tipo === type && membrosIds.includes(m.alvoId))
        .reduce((sum, m) => sum + m.valorAlvo, 0);

      await MetaGoalService.atualizar(metaEquipe.id, {
        tipoAlvo: 'team',
        alvoId: equipe.id,
        tipo: type,
        valorAlvo: somaMembros,
        mes: month,
      });

      toast.success(`Meta da equipe ${equipe.nome} atualizada automaticamente para a soma dos vendedores (${formatGoalValue(somaMembros, type)}).`);
    } catch (err: any) {
      console.error('Erro ao sincronizar meta da equipe:', err);
    }
  };

  const executeSave = async (goal: Goal) => {
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

        if (goal.targetType === 'user') {
          await syncTeamGoal(goal.targetId, goal.type, goal.month);
        }
      } else {
        await MetaGoalService.criar(dto);

        if (goal.targetType === 'team') {
          const equipe = equipes.find(e => e.id === goal.targetId);
          const membros = equipe?.membros ?? [];
          if (membros.length > 0 && goal.distributionType !== 'none') {
            const valorPorMembro = goal.distributionType === 'equal'
              ? (goal.type === 'value'
                ? Math.round((goal.targetValue / membros.length) * 100) / 100
                : Math.floor(goal.targetValue / membros.length))
              : goal.targetValue; // 'full'

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
            toast.success(`Meta da equipe criada! ${valorFormatado} atribuído para os membros.`);
          } else {
            toast.success('Meta da equipe cadastrada com sucesso!');
          }
        } else {
          toast.success('Meta cadastrada com sucesso!');
          await syncTeamGoal(goal.targetId, goal.type, goal.month);
        }
      }
      setIsModalOpen(false);
      setGoalToEdit(null);
      fetchGoals(selectedMonth);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar meta.');
    } finally {
      setPendingGoalSave(null);
      setSyncConfirmData(null);
    }
  };

  const handleSave = async (goal: Goal) => {
    const isEditing = goal.id && !goal.id.startsWith('new_');
    if (isEditing && goal.targetType === 'user') {
      const equipe = equipes.find(e => e.membros.some(m => m.id === goal.targetId));
      if (equipe) {
        const metaEquipe = goals.find(g => g.targetType === 'team' && g.targetId === equipe.id && g.type === goal.type);
        if (metaEquipe) {
          const membrosIds = equipe.membros.map(m => m.id);
          const somaOutrosMembros = goals
            .filter(g => g.targetType === 'user' && g.type === goal.type && g.targetId !== goal.targetId && membrosIds.includes(g.targetId))
            .reduce((sum, g) => sum + g.targetValue, 0);

          const novoValorEquipe = somaOutrosMembros + goal.targetValue;

          if (novoValorEquipe !== metaEquipe.targetValue) {
            setPendingGoalSave(goal);
            setSyncConfirmData({
              equipeNome: equipe.nome,
              valorAntigo: metaEquipe.targetValue,
              valorNovo: novoValorEquipe,
              tipo: goal.type,
            });
            return;
          }
        }
      }
    }

    await executeSave(goal);
  };

  const handleConfirmSyncSave = async () => {
    if (pendingGoalSave) {
      await executeSave(pendingGoalSave);
    }
  };

  const handleDelete = async () => {
    if (!goalToDeleteId) return;
    setIsDeleting(false);

    // Encontra a meta antes de deletar para sincronizar depois
    const goalToDelete = goals.find(g => g.id === goalToDeleteId);

    try {
      setIsDeleting(true);
      await MetaGoalService.excluir(Number(goalToDeleteId));
      toast.success('Meta removida.');
      setGoalToDeleteId(null);
      await fetchGoals(selectedMonth);

      if (goalToDelete && goalToDelete.targetType === 'user') {
        // Aguarda carregar as novas metas e atualiza a equipe
        await syncTeamGoal(goalToDelete.targetId, goalToDelete.type, goalToDelete.month);
        await fetchGoals(selectedMonth);
      }
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

  // Retorna o valor realizado em tempo real alinhado com o monitoramento
  const getRealizedValue = (
    targetType: 'user' | 'team',
    targetId: number,
    type: 'value' | 'quantity' | 'calls',
    targetName: string
  ): number => {
    if (targetType === 'user') {
      const perf = individualPerf.find(p => p.usuarioId === targetId);
      if (type === 'value') {
        return perf ? perf.totalFaturado : 0;
      }
      if (type === 'calls') {
        return perf ? perf.totalLigacoes : 0;
      }
      if (type === 'quantity') {
        const nameToMatch = targetName.toLowerCase().trim();
        const salesCount = opportunities.filter(op =>
          op.nomeUsuarioResponsavel?.toLowerCase().trim() === nameToMatch &&
          op.idStauts === 3 &&
          op.dataFechamentoVenda?.startsWith(selectedMonth)
        ).length;
        return salesCount;
      }
    } else {
      const perf = teamPerf.find(p => p.equipeId === targetId);
      if (type === 'value') {
        return perf ? perf.totalFaturado : 0;
      }
      if (type === 'calls') {
        return perf ? perf.totalLigacoes : 0;
      }
      if (type === 'quantity') {
        const equipe = equipes.find(e => e.id === targetId);
        if (!equipe) return 0;
        const membrosNames = equipe.membros.map(m => m.nome.toLowerCase().trim());
        const salesCount = opportunities.filter(op =>
          op.idStauts === 3 &&
          op.dataFechamentoVenda?.startsWith(selectedMonth) &&
          op.nomeUsuarioResponsavel &&
          membrosNames.includes(op.nomeUsuarioResponsavel.toLowerCase().trim())
        ).length;
        return salesCount;
      }
    }
    return 0;
  };

  // Métodos auxiliares de renderização
  const renderGoalCell = (targetType: 'user' | 'team', targetId: number, type: 'value' | 'quantity' | 'calls', targetName: string) => {
    const goal = goals.find(g => g.targetType === targetType && g.targetId === targetId && g.type === type);
    const realized = getRealizedValue(targetType, targetId, type, targetName);

    if (!goal) {
      if (realized > 0) {
        return (
          <div className="goal-cell-content no-goal-defined">
            <div className="goal-values-wrapper">
              <div className="goal-values">
                <span className="goal-target" style={{ color: 'var(--text-tertiary)' }}>-</span>
                <span className="goal-realized"> / {formatGoalValue(realized, type)}</span>
              </div>
            </div>
          </div>
        );
      }
      return <span className="empty-goal">-</span>;
    }

    const pct = goal.targetValue > 0 ? Math.min(Math.round((realized / goal.targetValue) * 100), 100) : 0;
    const badgeColor = pct >= 100 ? 'pct-green' : pct >= 70 ? 'pct-yellow' : 'pct-red';

    return (
      <div className="goal-cell-content">
        <div className="goal-values-wrapper">
          <div className="goal-values">
            <span className="goal-target">{formatGoalValue(goal.targetValue, type)}</span>
            <span className="goal-realized"> / {formatGoalValue(realized, type)}</span>
          </div>
          <span className={`goal-pct-badge ${badgeColor}`}>{pct}%</span>
        </div>
      </div>
    );
  };

  // Renderiza a coluna de Ações para a linha correspondente
  const renderActionsCell = (targetType: 'user' | 'team', targetId: number) => {
    const rowGoals = goals.filter(g => g.targetType === targetType && g.targetId === targetId);
    if (rowGoals.length === 0) return <span className="empty-goal">-</span>;

    const showTags = rowGoals.length > 1;

    return (
      <div className="actions-cell-wrapper">
        {rowGoals.map(g => (
          <div key={g.id} className="row-action-item">
            {showTags && (
              <span className={`type-badge type-${g.type}`} style={{ fontSize: '10px', padding: '2px 6px', lineHeight: 1 }}>
                {g.type === 'value' ? 'Fat.' : g.type === 'quantity' ? 'Vnd.' : 'Lig.'}
              </span>
            )}
            <button className="action-icon-btn edit" onClick={() => handleOpenEdit(g)} title={`Editar Meta (${g.type === 'value' ? 'Faturamento' : g.type === 'quantity' ? 'Vendas' : 'Ligações'})`}>
              <FaEdit size={12} />
            </button>
            <button className="action-icon-btn delete" onClick={() => setGoalToDeleteId(g.id)} title={`Remover Meta (${g.type === 'value' ? 'Faturamento' : g.type === 'quantity' ? 'Vendas' : 'Ligações'})`}>
              <FaTrash size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Identifica vendedores sem equipe
  const allTeamMemberIds = equipes.flatMap(e => e.membros.map(m => m.id));
  const independentUsers = users.filter(u => !allTeamMemberIds.includes(u.id));

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
      <ConfirmationModal
        isOpen={syncConfirmData !== null}
        onClose={() => { setPendingGoalSave(null); setSyncConfirmData(null); }}
        onConfirm={handleConfirmSyncSave}
        title="Confirmar Alteração de Meta da Equipe"
        message={
          syncConfirmData
            ? `A alteração da meta deste colaborador afetará a meta da equipe ${syncConfirmData.equipeNome}. A meta da equipe será atualizada de ${formatGoalValue(syncConfirmData.valorAntigo, syncConfirmData.tipo)} para ${formatGoalValue(syncConfirmData.valorNovo, syncConfirmData.tipo)}. Deseja prosseguir com a alteração?`
            : ''
        }
        confirmText="Confirmar e Salvar"
        cancelText="Cancelar"
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
            <CompactMonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>

          <div className="table-container">
            <table className="management-table goals-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Equipe / Colaborador</th>
                  <th style={{ width: '22%' }}>Faturamento</th>
                  <th style={{ width: '18%' }}>Qtd. Vendas</th>
                  <th style={{ width: '18%' }}>Ligações</th>
                  <th style={{ width: '17%', textAlign: 'right', paddingRight: '20px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="empty-state">Carregando...</td>
                  </tr>
                ) : (equipes.length === 0 && independentUsers.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      Nenhuma equipe ou colaborador cadastrado no sistema.
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Renderiza as Equipes */}
                    {equipes.map(eq => {
                      const isExpanded = !!expandedTeams[`team-${eq.id}`];
                      return (
                        <>
                          <tr key={`team-row-${eq.id}`} className="team-row-header">
                            <td>
                              <button className="expand-toggle-btn" onClick={() => toggleTeam(`team-${eq.id}`)}>
                                {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                              </button>
                              <span className="team-name-text">Equipe {eq.nome}</span>
                              <span className="team-badge-members">{eq.membros.length} membros</span>
                            </td>
                            <td>{renderGoalCell('team', eq.id, 'value', eq.nome)}</td>
                            <td>{renderGoalCell('team', eq.id, 'quantity', eq.nome)}</td>
                            <td>{renderGoalCell('team', eq.id, 'calls', eq.nome)}</td>
                            <td style={{ textAlign: 'right', paddingRight: '20px' }}>{renderActionsCell('team', eq.id)}</td>
                          </tr>

                          {/* Renderiza membros se expandido */}
                          {isExpanded && eq.membros.map(mb => (
                            <tr key={`member-row-${mb.id}`} className="member-row-child">
                              <td className="member-name-td">
                                <span className="member-indent-icon">└</span>
                                <span className="member-name-text">{mb.nome}</span>
                              </td>
                              <td>{renderGoalCell('user', mb.id, 'value', mb.nome)}</td>
                              <td>{renderGoalCell('user', mb.id, 'quantity', mb.nome)}</td>
                              <td>{renderGoalCell('user', mb.id, 'calls', mb.nome)}</td>
                              <td style={{ textAlign: 'right', paddingRight: '20px' }}>{renderActionsCell('user', mb.id)}</td>
                            </tr>
                          ))}
                        </>
                      );
                    })}

                    {/* Renderiza Vendedores Sem Equipe */}
                    {independentUsers.length > 0 && (
                      <>
                        <tr className="team-row-header independent-header">
                          <td>
                            <button className="expand-toggle-btn" onClick={() => toggleTeam('independent')}>
                              {expandedTeams['independent'] ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                            </button>
                            <span className="team-name-text">Colaboradores Sem Equipe</span>
                            <span className="team-badge-members">{independentUsers.length}</span>
                          </td>
                          <td colSpan={4}></td>
                        </tr>

                        {expandedTeams['independent'] && independentUsers.map(u => (
                          <tr key={`indep-row-${u.id}`} className="member-row-child">
                            <td className="member-name-td">
                              <span className="member-indent-icon">└</span>
                              <span className="member-name-text">{u.name}</span>
                            </td>
                            <td>{renderGoalCell('user', u.id, 'value', u.name)}</td>
                            <td>{renderGoalCell('user', u.id, 'quantity', u.name)}</td>
                            <td>{renderGoalCell('user', u.id, 'calls', u.name)}</td>
                            <td style={{ textAlign: 'right', paddingRight: '20px' }}>{renderActionsCell('user', u.id)}</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </>
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
