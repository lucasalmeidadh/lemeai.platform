import React, { useState, useEffect } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSpinner,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';
import { billingService } from '../services/billingService';
import type { PlanoBackend } from '../services/billingService';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';
import './PlanManagementPage.css';

const PlanManagementPage: React.FC = () => {
  const [plans, setPlans] = useState<PlanoBackend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<PlanoBackend | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  const [nome, setNome] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [preco, setPreco] = useState<number>(0);
  const [ciclo, setCiclo] = useState<string>('MONTHLY');
  const [ativo, setAtivo] = useState<boolean>(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await billingService.buscarTodosPlanos();
      if (res.sucesso) {
        setPlans(res.dados || []);
      } else {
        toast.error(res.mensagem || 'Erro ao carregar planos');
      }
    } catch (error) {
      toast.error('Falha ao conectar com o servidor para buscar planos.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setNome('');
    setDescricao('');
    setPreco(0);
    setCiclo('MONTHLY');
    setAtivo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: PlanoBackend) => {
    setEditingPlan(plan);
    setNome(plan.planoNome);
    setDescricao(plan.planoDescricao);
    setPreco(plan.planoPreco);
    setCiclo(plan.planoCiclo);
    setAtivo(plan.planoAtivo);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !descricao || preco <= 0) {
      toast.error('Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPlan) {
        const res = await billingService.atualizarPlano({
          planoId: editingPlan.planoId,
          nome,
          descricao,
          preco,
          ativo
        });
        if (res.sucesso) {
          toast.success('Plano atualizado com sucesso!');
          setIsModalOpen(false);
          loadPlans();
        } else {
          toast.error(res.mensagem || 'Erro ao atualizar plano.');
        }
      } else {
        const res = await billingService.criarPlano({ nome, descricao, preco, ciclo });
        if (res.sucesso) {
          toast.success('Plano criado com sucesso!');
          setIsModalOpen(false);
          loadPlans();
        } else {
          toast.error(res.mensagem || 'Erro ao criar plano.');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro de comunicação ao salvar o plano.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = (id: number) => {
    setDeletingPlanId(id);
  };

  const confirmDeletePlan = async () => {
    if (deletingPlanId == null) return;
    const id = deletingPlanId;
    setDeletingPlanId(null);
    try {
      const res = await billingService.removerPlano(id);
      if (res.sucesso) {
        toast.success('Plano desativado/removido com sucesso!');
        loadPlans();
      } else {
        toast.error(res.mensagem || 'Erro ao remover plano.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover plano.');
    }
  };

  const getCicloLabel = (ciclo: string) => {
    switch (ciclo) {
      case 'WEEKLY': return 'Semanal';
      case 'MONTHLY': return 'Mensal';
      case 'QUARTERLY': return 'Trimestral';
      case 'SEMIANNUALLY': return 'Semestral';
      case 'ANNUALLY': return 'Anual';
      default: return ciclo;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Gerenciamento de Planos</h1>
          <p className="plan-management-subtitle">
            Crie, gerencie e sincronize os planos da plataforma diretamente com a AbacatePay.
          </p>
        </div>
        <button className="add-button" onClick={openCreateModal}>
          <FaPlus /> Novo Plano
        </button>
      </div>

      <div className="dashboard-card">
        <div className="table-container">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
              <FaSpinner className="spin-icon" style={{ fontSize: '24px', marginBottom: '10px' }} />
              <p>Carregando planos...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="contacts-empty-state">
              <FaInfoCircle className="contacts-empty-icon" />
              <span className="contacts-empty-text">Nenhum plano cadastrado no sistema ainda.</span>
              <button className="add-button" onClick={openCreateModal} style={{ marginTop: '15px' }}>
                Criar o Primeiro Plano
              </button>
            </div>
          ) : (
            <table className="management-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Preço</th>
                  <th>Ciclo</th>
                  <th>Status</th>
                  <th>ID AbacatePay</th>
                  <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.planoId}>
                    <td>
                      <span className="contact-name-text" style={{ fontWeight: '700' }}>{plan.planoNome}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>{plan.planoDescricao}</span>
                    </td>
                    <td>
                      <span className="plan-price-cell">R$ {plan.planoPreco.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="status-badge status-lead-frio" style={{ fontSize: '12px', fontWeight: '600' }}>
                        {getCicloLabel(plan.planoCiclo)}
                      </span>
                    </td>
                    <td>
                      {plan.planoAtivo ? (
                        <span className="status-badge status-ativo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FaCheckCircle /> Ativo
                        </span>
                      ) : (
                        <span className="status-badge status-inativo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FaTimesCircle /> Inativo
                        </span>
                      )}
                    </td>
                    <td>
                      {plan.abacateProductId ? (
                        <code className="plan-abacate-id">{plan.abacateProductId}</code>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>Não Sincronizado</span>
                      )}
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-icon-btn edit" onClick={() => openEditModal(plan)} title="Editar">
                          <FaEdit size={14} />
                        </button>
                        <button className="action-icon-btn delete" onClick={() => handleDeletePlan(plan.planoId)} title="Excluir">
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Criar / Editar */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="contact-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <h2>{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</h2>
              <button type="button" className="contact-close-button" onClick={() => setIsModalOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSavePlan}>
              <div className="plan-form-body">
                <p className="plan-form-hint">
                  {editingPlan
                    ? 'Modifique os detalhes locais do plano. As atualizações de preço e descrição não refletem na AbacatePay automaticamente.'
                    : 'Crie um plano. Isso registrará automaticamente o produto correspondente na AbacatePay.'}
                </p>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label htmlFor="plan-nome">Nome do Plano *</label>
                  <input
                    id="plan-nome"
                    type="text"
                    placeholder="Ex: Profissional, Starter, Pro"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label htmlFor="plan-desc">Descrição / Recursos *</label>
                  <textarea
                    id="plan-desc"
                    className="plan-textarea"
                    placeholder="Descreva o plano ou separe as características com vírgula para listar recursos."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                    required
                  />
                  <span className="plan-textarea-hint">
                    Dica: Separe por vírgulas para destacar múltiplos benefícios no layout.
                  </span>
                </div>

                <div className="plan-form-grid">
                  <div className="form-group">
                    <label htmlFor="plan-preco">Preço (R$) *</label>
                    <input
                      id="plan-preco"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={preco || ''}
                      onChange={(e) => setPreco(parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  {!editingPlan ? (
                    <div className="form-group">
                      <label htmlFor="plan-ciclo">Ciclo de Cobrança *</label>
                      <select
                        id="plan-ciclo"
                        value={ciclo}
                        onChange={(e) => setCiclo(e.target.value)}
                        required
                      >
                        <option value="WEEKLY">Semanal</option>
                        <option value="MONTHLY">Mensal</option>
                        <option value="QUARTERLY">Trimestral</option>
                        <option value="SEMIANNUALLY">Semestral</option>
                        <option value="ANNUALLY">Anual</option>
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="plan-ativo-toggle">
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={(e) => setAtivo(e.target.checked)}
                        />
                        Plano Ativo no Sistema
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="plan-form-footer">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><FaSpinner className="spin-icon" /> Salvando...</>
                  ) : (
                    'Salvar Plano'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deletingPlanId !== null}
        onClose={() => setDeletingPlanId(null)}
        onConfirm={confirmDeletePlan}
        title="Remover Plano"
        message="Tem certeza que deseja desativar/remover este plano? Assinaturas existentes não serão afetadas."
        confirmText="Sim, remover"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default PlanManagementPage;
