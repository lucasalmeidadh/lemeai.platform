export interface BillingSubscription {
  planName: string;
  status: 'active' | 'pending' | 'expired' | 'trial';
  renewalDate: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export interface BillingInvoice {
  id: string;
  createdAt: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'expired' | 'refunded';
  paymentUrl?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
}

export interface PlanOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: 'plan_pro',
    name: 'Plano Profissional',
    price: 259,
    description: 'Acesso completo a todas as ferramentas e automações do CRM para impulsionar suas vendas.',
    features: [
      'Contatos ativos ilimitados',
      'Conexões de WhatsApp integradas',
      'Múltiplos funis de vendas ilimitados',
      'Disparador ativo de campanhas',
      'Suporte prioritário via WhatsApp',
      'Métricas e relatórios avançados'
    ],
    popular: true
  }
];

// Dados em cache no LocalStorage para simular persistência no front-end
const STORAGE_KEY_SUB = 'lemeai_mock_subscription';
const STORAGE_KEY_INVOICES = 'lemeai_mock_invoices';

const defaultSubscription: BillingSubscription = {
  planName: 'Gratuito (Teste)',
  status: 'trial',
  renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
  price: 0,
  interval: 'monthly',
  features: ['Acesso ao CRM essencial', '1 canal ativo', 'Até 100 contatos']
};

const defaultInvoices: BillingInvoice[] = [
  {
    id: 'inv_1092',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    dueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    amount: 259,
    status: 'paid'
  },
  {
    id: 'inv_2048',
    createdAt: new Date().toLocaleDateString('pt-BR'),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    amount: 259,
    status: 'pending',
    paymentUrl: 'https://checkout.exemplo.com/pay/inv_2048',
    pixQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021226870014br.gov.bcb.pix2565pix.abacatepay.com/fake-checkout-pix-lemeai-mock-data-qrcodes',
    pixCopiaECola: '00020101021226870014br.gov.bcb.pix2565pix.abacatepay.com/fake-checkout-pix-lemeai-mock-data-qrcodes-hash-mock-2048'
  }
];

export const billingService = {
  getPlans(): PlanOption[] {
    return PLANS;
  },

  getSubscription(): BillingSubscription {
    const cached = localStorage.getItem(STORAGE_KEY_SUB);
    if (!cached) {
      localStorage.setItem(STORAGE_KEY_SUB, JSON.stringify(defaultSubscription));
      return defaultSubscription;
    }
    return JSON.parse(cached);
  },

  getInvoices(): BillingInvoice[] {
    const cached = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (!cached) {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(defaultInvoices));
      return defaultInvoices;
    }
    return JSON.parse(cached);
  },

  // Simula o clique do usuário em assinar um plano, gerando uma fatura pendente
  createSubscriptionBilling(planId: string): Promise<BillingInvoice> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const plan = PLANS.find(p => p.id === planId) || PLANS[1];
        const invoices = this.getInvoices();
        
        // Criar uma nova fatura com status pendente
        const newInvoice: BillingInvoice = {
          id: `inv_${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toLocaleDateString('pt-BR'),
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          amount: plan.price,
          status: 'pending',
          paymentUrl: `https://checkout.exemplo.com/pay/new_${plan.id}`,
          pixQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021226870014br.gov.bcb.pix2565pix.abacatepay.com/checkout-pix-generated-lemeai-mock',
          pixCopiaECola: '00020101021226870014br.gov.bcb.pix2565pix.abacatepay.com/checkout-pix-generated-lemeai-mock-payload-hash-value'
        };

        // Atualiza a assinatura para "Pendente" do plano escolhido
        const newSubscriptionState: BillingSubscription = {
          planName: plan.name,
          status: 'pending',
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          price: plan.price,
          interval: 'monthly',
          features: plan.features
        };

        localStorage.setItem(STORAGE_KEY_SUB, JSON.stringify(newSubscriptionState));
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify([newInvoice, ...invoices]));

        resolve(newInvoice);
      }, 800);
    });
  },

  // Simulação de confirmação do Pix (Webhook/Callback de Sucesso)
  simulatePaymentSuccess(invoiceId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invoices = this.getInvoices();
        const updatedInvoices = invoices.map(inv => {
          if (inv.id === invoiceId) {
            return { ...inv, status: 'paid' as const };
          }
          return inv;
        });
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(updatedInvoices));

        // Se a fatura paga for a mais recente correspondente à assinatura pendente, ativa a assinatura
        const sub = this.getSubscription();
        if (sub.status === 'pending' || sub.status === 'trial') {
          const updatedSub: BillingSubscription = {
            ...sub,
            status: 'active' as const
          };
          localStorage.setItem(STORAGE_KEY_SUB, JSON.stringify(updatedSub));
        }

        resolve();
      }, 500);
    });
  },

  resetBillingData(): void {
    localStorage.removeItem(STORAGE_KEY_SUB);
    localStorage.removeItem(STORAGE_KEY_INVOICES);
  }
};
