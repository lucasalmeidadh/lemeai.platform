# Assinatura e Planos (BillingPlanPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **BillingPlanPage** é o portal do cliente para o faturamento (Self-Service Billing). Negocialmente, é a tela mais crítica para a retenção de receita da GB Code. Ela permite que a empresa inquilina (Lojista) visualize seu plano atual (com os features descritos), quando ele vence, qual o valor e o ciclo (mensal, anual, etc.).
O cliente também pode, autonomamente, realizar um *Upgrade* ou *Downgrade* de plano, gerar um novo link de pagamento via Cartão de Crédito ou PIX (via gateway integrado - ex: Asaas ou Stripe), e solicitar o cancelamento de sua assinatura (Churn).

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/BillingPlanPage.tsx`
- **Rotas:** `/configuracao/assinatura`
- **Mapeamento de Status:** Interpreta retornos textuais da API (`PAID`, `PENDING`, `CANCELLED`, `EXPIRED`, `FAILED`) para transformar em Badges (Etiquetas) visuais (`sub-badge-active`, `sub-badge-expired`, etc.).
- **Integração de Pagamento:**
  - Suporta dois métodos: `CARD` (Cartão de Crédito via `criarCheckout`) e `PIX` (`criarCheckoutPix`).
  - Um pagamento em Cartão de Crédito é inerentemente Recorrente, enquanto o PIX é tratado como Avulso (sem renovação automática). Por isso, se a empresa for PIX, o botão de "Trocar Plano" é bloqueado, forçando o cancelamento e uma nova compra.
  - Ao invés de processar o cartão na tela, o backend retorna uma URL de Checkout Segura (`assinaturaCheckoutUrl`) que é aberta em nova guia (`window.open`).

## 3. Componentes e Estrutura
- **Section do Plano Atual:** O card superior em destaque. Se o cliente tiver uma assinatura, mostra o nome do plano atual e botões para "Cancelar Assinatura" ou "Concluir Pagamento" (se Pending).
- **Lista de Planos Disponíveis:** Uma Grid iterando todos os `plans` com suas `planoDescricao` quebraveis por vírgula em Bullet Points de Features com ícone de `FaCheck`.
- **Modais de Ação:**
  - `PaymentMethodModal`: Para o usuário escolher PIX ou Cartão ao assinar.
  - `ConfirmationModal`: Para duplo fator de segurança ao Trocar ou Cancelar (prevenção de churn acidental).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `billingService` (`buscarPlanosDisponiveis`, `buscarAssinaturaAtiva`, `criarCheckout`, `criarCheckoutPix`, `trocarPlano`, `cancelarAssinatura`).
- Uma vez que o plano seja cancelado ou fique como `EXPIRED`, grande parte das rotas da API principal da LemeAI irá retornar erro 403 (Subscription Expired), forçando o usuário a voltar a esta página.
- A listagem de planos aqui é alimentada pela tela de `PlanManagementPage` gerida pela Master Admin.
