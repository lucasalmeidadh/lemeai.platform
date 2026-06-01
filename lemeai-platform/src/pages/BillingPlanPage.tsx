import React, { useState, useEffect } from 'react';
import { 
  FaCheck, 
  FaCreditCard, 
  FaRegCalendarAlt, 
  FaHistory, 
  FaBoxOpen, 
  FaSpinner, 
  FaQrcode, 
  FaCopy, 
  FaCheckCircle, 
  FaArrowRight,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { billingService } from '../services/billingService';
import type { BillingSubscription, BillingInvoice, PlanOption } from '../services/billingService';
import toast from 'react-hot-toast';
import './BillingPlanPage.css';

const BillingPlanPage: React.FC = () => {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  
  // Estado para controle do modal de checkout mock
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [simulatingPaymentId, setSimulatingPaymentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pix' | 'card'>('pix');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = () => {
    try {
      setPlans(billingService.getPlans());
      setSubscription(billingService.getSubscription());
      setInvoices(billingService.getInvoices());
    } catch (error) {
      toast.error('Erro ao carregar informações de faturamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setProcessingPlanId(planId);
    try {
      const newInvoice = await billingService.createSubscriptionBilling(planId);
      toast.success('Cobrança gerada com sucesso!');
      loadBillingData();
      
      // Abre o modal de pagamento automaticamente se for uma cobrança pendente
      setSelectedInvoice(newInvoice);
    } catch (error) {
      toast.error('Erro ao iniciar a contratação do plano.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleOpenPayment = (invoice: BillingInvoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCopyPix = (payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedText(true);
    toast.success('PIX Copia e Cola copiado!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSimulatePayment = async (invoiceId: string) => {
    setSimulatingPaymentId(invoiceId);
    try {
      await billingService.simulatePaymentSuccess(invoiceId);
      toast.success('Pagamento confirmado com sucesso (Simulação)!');
      setSelectedInvoice(null);
      loadBillingData();
    } catch (error) {
      toast.error('Erro ao simular confirmação de pagamento.');
    } finally {
      setSimulatingPaymentId(null);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Deseja resetar os dados de faturamento para o estado inicial?')) {
      billingService.resetBillingData();
      loadBillingData();
      toast.success('Dados resetados com sucesso.');
    }
  };

  // Retorna classe CSS para o status da cobrança
  const getStatusBadgeClass = (status: BillingInvoice['status']) => {
    switch (status) {
      case 'paid': return 'billing-badge-paid';
      case 'pending': return 'billing-badge-pending';
      case 'expired': return 'billing-badge-expired';
      default: return 'billing-badge-default';
    }
  };

  // Tradução do status da cobrança
  const getStatusText = (status: BillingInvoice['status']) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  // Tradução do status da assinatura
  const getSubscriptionStatusBadge = (status: BillingSubscription['status']) => {
    switch (status) {
      case 'active':
        return <span className="sub-badge sub-badge-active">Ativa</span>;
      case 'pending':
        return <span className="sub-badge sub-badge-pending">Pagamento Pendente</span>;
      case 'expired':
        return <span className="sub-badge sub-badge-expired">Expirada</span>;
      case 'trial':
        return <span className="sub-badge sub-badge-trial">Período de Testes</span>;
      default:
        return <span className="sub-badge">{status}</span>;
    }
  };

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
      <header className="billing-header">
        <div>
          <h1>Assinatura e Planos</h1>
          <p className="billing-subtitle">Gerencie seu plano atual, confira faturas e faça novos upgrades.</p>
        </div>
        <button onClick={handleResetData} className="btn-reset-mock">
          Resetar Dados (Mock)
        </button>
      </header>

      {/* Seção do plano atual */}
      {subscription && (
        <section className="billing-section current-plan-card">
          <div className="current-plan-info">
            <div className="current-plan-main">
              <span className="current-plan-label">PLANO ATUAL</span>
              <h2>{subscription.planName}</h2>
              <div className="status-row">
                {getSubscriptionStatusBadge(subscription.status)}
                {subscription.price > 0 && (
                  <span className="current-plan-price">
                    R$ {subscription.price.toFixed(2)}/mês
                  </span>
                )}
              </div>
            </div>
            
            <div className="current-plan-details">
              <div className="detail-item">
                <FaRegCalendarAlt />
                <div>
                  <strong>Próximo vencimento</strong>
                  <span>{subscription.renewalDate}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaCreditCard />
                <div>
                  <strong>Forma de pagamento</strong>
                  <span>PIX ou Cartão via Checkout Seguro</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="current-plan-features-list">
            <h4>Recursos inclusos no plano:</h4>
            <ul>
              {subscription.features.map((feature, idx) => (
                <li key={idx}><FaCheck className="check-icon" /> {feature}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Cards de Opções de Planos */}
      <section className="billing-section">
        <h3 className="section-title"><FaBoxOpen /> Alterar ou Contratar Plano</h3>
        <div className="plans-grid">
          {plans.map((plan) => {
            const isCurrent = subscription?.planName === plan.name;
            return (
              <div key={plan.id} className={`plan-card ${plan.popular ? 'plan-card-popular' : ''} ${isCurrent ? 'plan-card-current' : ''}`}>
                {plan.popular && <span className="popular-badge">Mais Escolhido</span>}
                <div className="plan-card-header">
                  <h3>{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                  <div className="plan-price">
                    <span className="currency">R$</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">/mês</span>
                  </div>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feat, index) => (
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
                      onClick={() => handleSubscribe(plan.id)}
                      className={`btn-plan ${plan.popular ? 'btn-plan-primary' : 'btn-plan-secondary'}`}
                      disabled={processingPlanId !== null}
                    >
                      {processingPlanId === plan.id ? (
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

      {/* Histórico de Faturas */}
      <section className="billing-section">
        <h3 className="section-title"><FaHistory /> Histórico de Faturamento</h3>
        <div className="invoices-card">
          {invoices.length === 0 ? (
            <p className="no-invoices">Nenhuma cobrança registrada até o momento.</p>
          ) : (
            <div className="table-responsive">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Código da Fatura</th>
                    <th>Data de Emissão</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><span className="invoice-code">{invoice.id}</span></td>
                      <td>{invoice.createdAt}</td>
                      <td>{invoice.dueDate}</td>
                      <td>R$ {invoice.amount.toFixed(2)}</td>
                      <td>
                        <span className={`billing-badge ${getStatusBadgeClass(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td>
                        {invoice.status === 'pending' ? (
                          <button 
                            onClick={() => handleOpenPayment(invoice)} 
                            className="btn-pay-now"
                          >
                            Pagar Cobrança
                          </button>
                        ) : (
                          <span className="action-completed">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modal / Overlay de Checkout Mockado (Fluxo AbacatePay) */}
      {selectedInvoice && (
        <div className="billing-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="billing-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="billing-modal-close" onClick={() => setSelectedInvoice(null)}>×</button>
            
            <div className="checkout-header">
              <h3>Finalizar Assinatura</h3>
              <p className="checkout-invoice-id">Fatura #{selectedInvoice.id}</p>
            </div>

            <div className="checkout-body">
              <div className="checkout-summary">
                <span className="summary-label">Total a pagar:</span>
                <span className="summary-value">R$ {selectedInvoice.amount.toFixed(2)}</span>
              </div>

              <div className="payment-options-box">
                {/* Abas de Pagamento */}
                <div className="payment-tabs">
                  <button 
                    className={`payment-tab ${activeTab === 'pix' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pix')}
                  >
                    <FaQrcode /> PIX
                  </button>
                  <button 
                    className={`payment-tab ${activeTab === 'card' ? 'active' : ''}`}
                    onClick={() => setActiveTab('card')}
                  >
                    <FaCreditCard /> Cartão de Crédito
                  </button>
                </div>
                
                {/* Conteúdo Aba PIX */}
                {activeTab === 'pix' && (
                  <div className="pix-payment-box">
                    <div className="pix-header">
                      <FaQrcode className="pix-icon" />
                      <div>
                        <h5>Pagamento via PIX</h5>
                        <p>Escaneie o QR Code abaixo ou copie a chave Pix Copia e Cola.</p>
                      </div>
                    </div>

                    {selectedInvoice.pixQrCode && (
                      <div className="qr-code-wrapper">
                        <img src={selectedInvoice.pixQrCode} alt="QR Code Pix Mock" />
                      </div>
                    )}

                    {selectedInvoice.pixCopiaECola && (
                      <div className="pix-copy-paste">
                        <input 
                          type="text" 
                          readOnly 
                          value={selectedInvoice.pixCopiaECola} 
                          className="pix-input"
                        />
                        <button 
                          onClick={() => handleCopyPix(selectedInvoice.pixCopiaECola!)} 
                          className="btn-copy-pix"
                        >
                          {copiedText ? <FaCheckCircle /> : <FaCopy />}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Conteúdo Aba Cartão */}
                {activeTab === 'card' && (
                  <div className="card-payment-box">
                    <div className="card-payment-header">
                      <FaCreditCard className="card-icon" />
                      <div>
                        <h5>Cartão de Crédito</h5>
                        <p>Você será redirecionado para a nossa página de faturamento externa segura.</p>
                      </div>
                    </div>
                    
                    <a 
                      href={selectedInvoice.paymentUrl || 'https://checkout.exemplo.com'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-external-checkout"
                    >
                      Ir para Página de Pagamento <FaExternalLinkAlt />
                    </a>
                  </div>
                )}

                {/* Seção de simulação de sucesso */}
                <div className="simulation-actions">
                  <button 
                    onClick={() => handleSimulatePayment(selectedInvoice.id)}
                    className="btn-simulate-confirm"
                    disabled={simulatingPaymentId !== null}
                  >
                    {simulatingPaymentId === selectedInvoice.id ? (
                      <FaSpinner className="billing-spinner-small" />
                    ) : (
                      'Simular Confirmação de Pagamento (Sucesso)'
                    )}
                  </button>
                  <p className="simulation-note">
                    * Esse botão simula o recebimento do webhook de pagamento aprovado enviado pelo integrador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPlanPage;
