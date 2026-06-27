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
  FaExclamationTriangle,
  FaQrcode,
  FaTimes,
  FaExchangeAlt,
  FaGift
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
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; planId: number | null }>({
    open: false,
    planId: null,
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      const plansRes = await billingService.buscarPlanosDisponiveis();
      if (plansRes.sucesso) {
        setPlans(plansRes.dados);
      }

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

  const handleSubscribeChoice = (planId: number) => {
    setPaymentModal({ open: true, planId });
  };

  const handleCheckout = async (method: 'CARD' | 'PIX') => {
    const planId = paymentModal.planId!;
    setPaymentModal({ open: false, planId: null });
    setProcessingPlanId(planId);
    try {
      const checkoutRes =
        method === 'PIX'
          ? await billingService.criarCheckoutPix(planId)
          : await billingService.criarCheckout(planId);

      if (checkoutRes.sucesso && checkoutRes.dados.assinaturaCheckoutUrl) {
        toast.success('Checkout gerado com sucesso!');
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
    if (subscription?.assinaturaMetodo === 'PIX') {
      toast.error('Troca automática não disponível para PIX. Cancele a assinatura e crie um novo checkout.');
      return;
    }
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
          toast.success('Assinatura cancelada. O acesso permanece ativo até o fim do período pago.');
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
      case 'TRIAL':
        return <span className="sub-badge sub-badge-trial">Período de Teste</span>;
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

  const isTrialSubscription = subscription?.assinaturaStatus === 'TRIAL';
  // O plano de teste é ocultado de PlanosDisponiveis, então o nome/descrição
  // vêm sempre de BuscarAssinatura, não da lista de planos contratáveis.
  const currentPlan = plans.find(p => p.planoId === subscription?.planoId);
  const currentPlanName = subscription?.nomePlano || currentPlan?.planoNome || 'Plano Desconhecido';
  const currentPlanDescricao = subscription?.descricaoPlano || currentPlan?.planoDescricao || '';
  const currentPlanFeatures = currentPlanDescricao
    ? currentPlanDescricao.split(',').map(f => f.trim())
    : [];

  const isSubscriptionCancelled = subscription?.assinaturaStatus === 'CANCELLED';
  const isSubscriptionExpired = subscription?.assinaturaExpiraEm
    ? new Date(subscription.assinaturaExpiraEm) < new Date()
    : false;
  const canStartNewSubscription = isSubscriptionCancelled || isSubscriptionExpired;

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

      {/* Assinatura ativa */}
      {subscription ? (
        <section className="billing-section current-plan-card">
          <div className="current-plan-info">
            <div className="current-plan-main">
              <span className="current-plan-label">ASSINATURA ATUAL</span>
              <h2>{currentPlanName}</h2>
              <div className="status-row">
                {getSubscriptionStatusBadge(subscription.assinaturaStatus)}
                <span className="current-plan-price">
                  {isTrialSubscription
                    ? 'Gratuito'
                    : `R$ ${subscription.assinaturaValor.toFixed(2)}/${getCicloLabel(subscription.assinaturaCiclo)}`}
                </span>
              </div>
            </div>

            <div className="current-plan-details">
              {subscription.assinaturaExpiraEm && (
                <div className="detail-item">
                  <FaRegCalendarAlt />
                  <div>
                    <strong>{isTrialSubscription ? 'Fim do período de teste' : 'Próxima renovação / expiração'}</strong>
                    <span>{new Date(subscription.assinaturaExpiraEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )}
              <div className="detail-item">
                {subscription.assinaturaMetodo === 'PIX' ? (
                  <FaQrcode />
                ) : subscription.assinaturaMetodo === 'CARD' ? (
                  <FaCreditCard />
                ) : (
                  <FaGift />
                )}
                <div>
                  <strong>Forma de pagamento</strong>
                  <span>
                    {subscription.assinaturaMetodo === 'PIX'
                      ? 'PIX (pagamento avulso por ciclo)'
                      : subscription.assinaturaMetodo === 'CARD'
                      ? 'Cartão de crédito (recorrente)'
                      : subscription.assinaturaMetodo}
                  </span>
                </div>
              </div>
            </div>

            {isSubscriptionExpired && (
              <div className="subscription-expired-alert">
                <FaExclamationTriangle />
                <div>
                  <strong>Sua assinatura expirou</strong>
                  <p>A data de expiração já passou. Inicie uma nova assinatura para manter o acesso.</p>
                </div>
              </div>
            )}

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
              {subscription.assinaturaStatus === 'PAID' && !isSubscriptionExpired && (
                <button
                  onClick={handleCancelarAssinatura}
                  className="btn-cancel-subscription"
                  disabled={cancelling}
                >
                  {cancelling ? <FaSpinner className="billing-spinner-small" /> : <><FaBan /> Cancelar Assinatura</>}
                </button>
              )}
              {canStartNewSubscription && (
                <button
                  onClick={() => handleSubscribeChoice(subscription.planoId)}
                  className="btn-new-subscription"
                  disabled={processingPlanId !== null}
                >
                  {processingPlanId === subscription.planoId ? (
                    <FaSpinner className="billing-spinner-small" />
                  ) : (
                    <><FaArrowRight /> Iniciar Nova Assinatura</>
                  )}
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
              <p className="no-features-text">{currentPlanDescricao || 'Consulte os termos do seu plano.'}</p>
            )}
          </div>
        </section>
      ) : (
        <section className="billing-section no-active-subscription">
          <div className="no-sub-alert">
            <FaExclamationTriangle />
            <div>
              <h4>Nenhuma Assinatura Ativa</h4>
              <p>Sua empresa está sem um plano ativo. Contrate um dos planos abaixo para reativar o acesso.</p>
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
            ? 'Tem certeza? A assinatura será cancelada, mas o acesso permanece ativo até o fim do período pago.'
            : 'Deseja solicitar a alteração do plano? A alteração será aplicada no próximo ciclo de faturamento.'
        }
        confirmText={confirmModal.type === 'cancelar' ? 'Sim, cancelar' : 'Confirmar Troca'}
        cancelText="Voltar"
        isConfirming={cancelling || processingPlanId !== null}
      />

      {/* Modal de seleção de forma de pagamento */}
      {paymentModal.open && (
        <div className="modal-overlay" onClick={() => setPaymentModal({ open: false, planId: null })}>
          <div className="payment-method-modal" onClick={e => e.stopPropagation()}>
            <div className="payment-method-modal-header">
              <h2>Forma de Pagamento</h2>
              <button
                aria-label="Fechar"
                className="payment-method-close"
                onClick={() => setPaymentModal({ open: false, planId: null })}
              >
                <FaTimes />
              </button>
            </div>
            <p className="payment-method-desc">Escolha como deseja pagar o plano selecionado.</p>
            <div className="payment-method-options">
              <button className="payment-method-card-btn" onClick={() => handleCheckout('CARD')}>
                <span className="payment-method-icon"><FaCreditCard /></span>
                <span className="payment-method-title">Cartão de Crédito</span>
                <span className="payment-method-subtitle">Cobrança recorrente automática a cada ciclo</span>
              </button>
              <button className="payment-method-card-btn" onClick={() => handleCheckout('PIX')}>
                <span className="payment-method-icon payment-method-icon-pix"><FaQrcode /></span>
                <span className="payment-method-title">PIX</span>
                <span className="payment-method-subtitle">Pagamento avulso via QR Code, renovação manual</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Planos */}
      <section className="billing-section">
        <h3 className="section-title"><FaBoxOpen /> Alterar ou Contratar Plano</h3>
        <div className="plans-grid">
          {plans.map((plan) => {
            const isCurrent = subscription?.planoId === plan.planoId;
            const features = plan.planoDescricao ? plan.planoDescricao.split(',').map(f => f.trim()) : [];
            // Assinaturas de teste não têm recorrência real na AbacatePay, então
            // a contratação de um plano pago passa pelo fluxo de checkout normal,
            // não pela troca de plano (TrocarPlano).
            const canSwitch = subscription && !canStartNewSubscription && !isTrialSubscription;
            const isPixSub = subscription?.assinaturaMetodo === 'PIX';

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
                  {isCurrent && !canStartNewSubscription ? (
                    <button className="btn-plan btn-plan-current" disabled>
                      Plano Atual
                    </button>
                  ) : canSwitch ? (
                    <button
                      onClick={() => isPixSub
                        ? toast.error('Para PIX, cancele a assinatura atual e contrate o novo plano.')
                        : handleTrocarPlano(plan.planoId)
                      }
                      className={`btn-plan ${isPixSub ? 'btn-plan-current' : 'btn-plan-secondary'}`}
                      disabled={processingPlanId !== null || isPixSub}
                      title={isPixSub ? 'Troca de plano não disponível para assinaturas PIX' : undefined}
                    >
                      {processingPlanId === plan.planoId ? (
                        <FaSpinner className="billing-spinner-small" />
                      ) : (
                        <><FaExchangeAlt /> Mudar para este Plano</>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribeChoice(plan.planoId)}
                      className="btn-plan btn-plan-primary"
                      disabled={processingPlanId !== null}
                    >
                      {processingPlanId === plan.planoId ? (
                        <FaSpinner className="billing-spinner-small" />
                      ) : (
                        <>Contratar Plano <FaArrowRight /></>
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
