import React, { useState, useEffect } from 'react';
import {
  FaCheck,
  FaCreditCard,
  FaRegCalendarAlt,
  FaBoxOpen,
  FaSpinner,
  FaArrowRight,
  FaExternalLinkAlt,
  FaBan,
  FaExclamationTriangle
} from 'react-icons/fa';
import { billingService } from '../services/billingService';
import type { PlanoBackend, AssinaturaBackend } from '../services/billingService';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';
import './BillingPlanPage.css';

const BillingPlanPage: React.FC = () => {
  const [plans, setPlans] = useState<PlanoBackend[]>([]);
  const [subscription, setSubscription] = useState<AssinaturaBackend | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'trocar' | 'cancelar';
    planId?: number;
  }>({ open: false, type: 'trocar' });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os planos ativos
      const plansRes = await billingService.buscarTodosPlanos();
      if (plansRes.sucesso) {
        // Filtrar apenas planos ativos
        setPlans(plansRes.dados.filter(p => p.planoAtivo));
      }

      // Buscar assinatura ativa da empresa
      const subRes = await billingService.buscarAssinaturaAtiva();
      if (subRes && subRes.sucesso) {
        setSubscription(subRes.dados);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      toast.error('Erro ao carregar informações de faturamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    setProcessingPlanId(planId);
    try {
      const checkoutRes = await billingService.criarCheckout(planId);
      if (checkoutRes.sucesso && checkoutRes.dados.assinaturaCheckoutUrl) {
        toast.success('Checkout gerado com sucesso!');
        // Redireciona o usuário para a página de pagamento externa segura da AbacatePay
        window.open(checkoutRes.dados.assinaturaCheckoutUrl, '_blank', 'noopener,noreferrer');
        loadBillingData();
      } else {
        toast.error(checkoutRes.mensagem || 'Erro ao gerar checkout.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar contratação.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleTrocarPlano = (planId: number) => {
    setConfirmModal({ open: true, type: 'trocar', planId });
  };

  const handleCancelarAssinatura = () => {
    setConfirmModal({ open: true, type: 'cancelar' });
  };

  const executeConfirmedAction = async () => {
    if (confirmModal.type === 'trocar' && confirmModal.planId != null) {
      const planId = confirmModal.planId;
      setConfirmModal({ open: false, type: 'trocar' });
      setProcessingPlanId(planId);
      try {
        const res = await billingService.trocarPlano(planId);
        if (res.sucesso) {
          toast.success('Troca de plano solicitada! Será aplicada no início do próximo ciclo.');
          loadBillingData();
        } else {
          toast.error(res.mensagem || 'Erro ao solicitar troca de plano.');
        }
      } catch (error: any) {
        toast.error(error.message || 'Erro ao solicitar troca de plano.');
      } finally {
        setProcessingPlanId(null);
      }
    } else if (confirmModal.type === 'cancelar') {
      setConfirmModal({ open: false, type: 'cancelar' });
      setCancelling(true);
      try {
        const res = await billingService.cancelarAssinatura();
        if (res.sucesso) {
          toast.success('Assinatura cancelada com sucesso.');
          loadBillingData();
        } else {
          toast.error(res.mensagem || 'Erro ao cancelar assinatura.');
        }
      } catch (error: any) {
        toast.error(error.message || 'Erro ao cancelar assinatura.');
      } finally {
        setCancelling(false);
      }
    }
  };

  const getCicloLabel = (ciclo: string) => {
    switch (ciclo) {
      case 'WEEKLY': return 'semanal';
      case 'MONTHLY': return 'mês';
      case 'QUARTERLY': return 'trimestre';
      case 'SEMIANNUALLY': return 'semestre';
      case 'ANNUALLY': return 'ano';
      default: return 'mês';
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="sub-badge sub-badge-active">Ativa (Paga)</span>;
      case 'PENDING':
        return <span className="sub-badge sub-badge-pending">Aguardando Pagamento</span>;
      case 'CANCELLED':
        return <span className="sub-badge sub-badge-expired">Cancelada</span>;
      case 'EXPIRED':
        return <span className="sub-badge sub-badge-expired">Expirada</span>;
      case 'FAILED':
        return <span className="sub-badge sub-badge-expired">Falha na Cobrança</span>;
      default:
        return <span className="sub-badge">{status}</span>;
    }
  };

  // Encontra o plano atual baseado no planoId da assinatura
  const currentPlan = plans.find(p => p.planoId === subscription?.planoId);
  const currentPlanFeatures = currentPlan?.planoDescricao 
    ? currentPlan.planoDescricao.split(',').map(f => f.trim()) 
    : [];

  if (loading) {
    return (
      <div className="billing-loading-container">
        <FaSpinner className="billing-spinner" />
        <p>Carregando faturamento...</p>
      </div>
    );
  }

  return (
    <div className="billing-page-container">
      <div className="billing-page-header">
        <h1>Assinatura e Planos</h1>
        <p className="billing-page-subtitle">
          Gerencie seu plano atual e faça upgrades para obter novos recursos.
        </p>
      </div>

      {/* Seção da assinatura ativa */}
      {subscription ? (
        <section className="billing-section current-plan-card">
          <div className="current-plan-info">
            <div className="current-plan-main">
              <span className="current-plan-label">ASSINATURA ATUAL</span>
              <h2>{currentPlan ? currentPlan.planoNome : 'Carregando plano...'}</h2>
              <div className="status-row">
                {getSubscriptionStatusBadge(subscription.assinaturaStatus)}
                <span className="current-plan-price">
                  R$ {subscription.assinaturaValor.toFixed(2)}/{getCicloLabel(subscription.assinaturaCiclo)}
                </span>
              </div>
            </div>
            
            <div className="current-plan-details">
              {subscription.assinaturaExpiraEm && (
                <div className="detail-item">
                  <FaRegCalendarAlt />
                  <div>
                    <strong>Próxima renovação / expiração</strong>
                    <span>{new Date(subscription.assinaturaExpiraEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )}
              <div className="detail-item">
                <FaCreditCard />
                <div>
                  <strong>Forma de faturamento</strong>
                  <span>PIX ou Cartão via Gateway AbacatePay</span>
                </div>
              </div>
            </div>

            {/* Ações de Assinatura */}
            <div className="subscription-actions-row">
              {subscription.assinaturaStatus === 'PENDING' && subscription.assinaturaCheckoutUrl && (
                <a 
                  href={subscription.assinaturaCheckoutUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-pay-now-checkout"
                >
                  <FaCreditCard /> Concluir Pagamento <FaExternalLinkAlt />
                </a>
              )}
              {subscription.assinaturaStatus === 'PAID' && (
                <button 
                  onClick={handleCancelarAssinatura} 
                  className="btn-cancel-subscription"
                  disabled={cancelling}
                >
                  {cancelling ? <FaSpinner className="billing-spinner-small" /> : <><FaBan /> Cancelar Assinatura</>}
                </button>
              )}
            </div>
          </div>
          
          <div className="current-plan-features-list">
            <h4>Recursos inclusos no plano contratado:</h4>
            {currentPlanFeatures.length > 0 ? (
              <ul>
                {currentPlanFeatures.map((feature, idx) => (
                  <li key={idx}><FaCheck className="check-icon" /> {feature}</li>
                ))}
              </ul>
            ) : (
              <p className="no-features-text">{currentPlan?.planoDescricao || 'Consulte os termos do seu plano.'}</p>
            )}
          </div>
        </section>
      ) : (
        <section className="billing-section no-active-subscription">
          <div className="no-sub-alert">
            <FaExclamationTriangle />
            <div>
              <h4>Nenhuma Assinatura Ativa</h4>
              <p>Sua empresa está sem um plano ativo ou expirou. Contrate um dos planos abaixo para reativar seu acesso.</p>
            </div>
          </div>
        </section>
      )}

      <ConfirmationModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onConfirm={executeConfirmedAction}
        title={confirmModal.type === 'cancelar' ? 'Cancelar Assinatura' : 'Confirmar Troca de Plano'}
        message={
          confirmModal.type === 'cancelar'
            ? 'Tem certeza? O acesso será encerrado imediatamente. Esta ação é irreversível.'
            : 'Deseja solicitar a alteração do plano? A alteração será aplicada no próximo ciclo de faturamento.'
        }
        confirmText={confirmModal.type === 'cancelar' ? 'Sim, cancelar' : 'Confirmar Troca'}
        cancelText="Voltar"
        isConfirming={cancelling || processingPlanId !== null}
      />

      {/* Cards de Opções de Planos */}
      <section className="billing-section">
        <h3 className="section-title"><FaBoxOpen /> Alterar ou Contratar Plano</h3>
        <div className="plans-grid">
          {plans.map((plan) => {
            const isCurrent = subscription?.planoId === plan.planoId;
            const features = plan.planoDescricao ? plan.planoDescricao.split(',').map(f => f.trim()) : [];
            
            return (
              <div key={plan.planoId} className={`plan-card ${isCurrent ? 'plan-card-current' : ''}`}>
                <div className="plan-card-header">
                  <h3>{plan.planoNome}</h3>
                  <div className="plan-price">
                    <span className="currency">R$</span>
                    <span className="amount">{plan.planoPreco.toFixed(2)}</span>
                    <span className="period">/{getCicloLabel(plan.planoCiclo)}</span>
                  </div>
                </div>

                <ul className="plan-features">
                  {features.map((feat, index) => (
                    <li key={index}>
                      <FaCheck className="feature-check" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="plan-card-footer">
                  {isCurrent ? (
                    <button className="btn-plan btn-plan-current" disabled>
                      Plano Atual
                    </button>
                  ) : (
                    <button 
                      onClick={() => subscription ? handleTrocarPlano(plan.planoId) : handleSubscribe(plan.planoId)}
                      className="btn-plan btn-plan-primary"
                      disabled={processingPlanId !== null}
                    >
                      {processingPlanId === plan.planoId ? (
                        <FaSpinner className="billing-spinner-small" />
                      ) : (
                        <>
                          {subscription ? 'Mudar para este Plano' : 'Contratar Plano'} <FaArrowRight />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default BillingPlanPage;
