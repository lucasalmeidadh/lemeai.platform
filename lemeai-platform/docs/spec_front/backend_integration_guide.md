# Guia de Integração do Faturamento com AbacatePay

Este documento descreve como implementar a integração de cobranças e assinaturas reais no backend da plataforma Leme AI utilizando a API do **AbacatePay**.

---

## 1. Visão Geral do Fluxo de Pagamentos
O fluxo implementado no front-end simula o comportamento da API do AbacatePay:
1. O usuário clica em "Contratar Plano" na interface de assinaturas.
2. O front-end faz um POST para o backend (`/api/billing/subscribe`) enviando o ID do plano desejado.
3. O backend cria ou localiza o cliente (Customer) no AbacatePay e gera um link de cobrança (Billing Session).
4. O backend retorna a URL de checkout gerada, o ID da cobrança e, se aplicável, as instruções de Pix imediatas (QR Code e Copia e Cola).
5. O usuário efetua o pagamento. O AbacatePay dispara um webhook informando a confirmação do pagamento (`billing.status.paid`).
6. O webhook do backend atualiza o status no banco de dados e ativa os recursos do plano na conta do cliente.

---

## 2. API Endpoints Sugeridos no Backend

### A. Listar Planos e Status Atual
`GET /api/billing/subscription`
- **Autenticação**: Requer token do usuário
- **Retorno Esperado**:
```json
{
  "subscription": {
    "planName": "Profissional",
    "status": "active", // "active" | "pending" | "expired" | "trial"
    "renewalDate": "2026-07-01",
    "price": 197.00,
    "interval": "monthly",
    "features": [
      "Até 10.000 contatos ativos",
      "3 Conexões de WhatsApp"
    ]
  },
  "invoices": [
    {
      "id": "inv_2048",
      "createdAt": "2026-06-01",
      "dueDate": "2026-06-04",
      "amount": 197.00,
      "status": "paid",
      "paymentUrl": "https://abacatepay.com/checkout/f47d9a-..."
    }
  ]
}
```

### B. Criar Sessão de Cobrança / Assinatura
`POST /api/billing/subscribe`
- **Autenticação**: Requer token do usuário
- **Payload**:
```json
{
  "planId": "plan_pro"
}
```
- **Lógica do Backend**:
  1. Identificar o tenant/usuário logado.
  2. Verificar se já existe um `customer` criado no AbacatePay. Se não, criar usando o endpoint:
     - `POST https://api.abacatepay.com/v1/customer/create`
  3. Criar uma cobrança no AbacatePay:
     - `POST https://api.abacatepay.com/v1/billing/create`
     - Definir no payload os metadados (ex: `customerId`, `planId`, `tenantId`) para conseguir identificar a transação no webhook posteriormente.
     - Definir o array de produtos (o plano contratado).
     - Habilitar métodos de pagamento (Pix, Cartão, Boleto).
  4. Salvar o registro da fatura pendente localmente no banco de dados do CRM.
  5. Retornar os dados de checkout gerados pelo AbacatePay.

- **Resposta de Sucesso**:
```json
{
  "invoiceId": "inv_2048",
  "paymentUrl": "https://abacatepay.com/checkout/f47d9a-...",
  "pix": {
    "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=...",
    "copiaECola": "0002010102122687..."
  }
}
```

---

## 3. Webhook de Confirmação (AbacatePay -> Backend)
Configure uma URL pública no console do AbacatePay (ex: `https://api.lemeai.com/webhooks/abacatepay`).

### Payload do Webhook (`billing.status.paid`)
O AbacatePay enviará um POST informando o pagamento da cobrança:
```json
{
  "event": "billing.status.paid",
  "data": {
    "id": "bill_abacate_90812",
    "amount": 19700, // Valor em centavos
    "status": "PAID",
    "metadata": {
      "tenantId": "tenant_uuid_12345",
      "planId": "plan_pro"
    },
    "customer": {
      "id": "cust_1234",
      "email": "cliente@email.com"
    }
  }
}
```

### Ação no Backend:
1. **Segurança**: Validar a assinatura do Webhook enviada nos headers para certificar-se de que a requisição veio do AbacatePay.
2. **Atualização**: Localizar a conta do cliente usando o `tenantId` contido no `metadata`.
3. **Ativação**:
   - Atualizar a assinatura local para `active` e definir a próxima data de renovação (+30 dias ou +365 dias).
   - Atualizar o status da fatura para `paid`.
   - Limpar ou restabelecer limites de envio e conexões com base no plano contratado.

---

## 4. Documentação Oficial do AbacatePay
Para consultar headers, chaves de API e SDKs oficiais, consulte a documentação original em:
- [https://docs.abacatepay.com/](https://docs.abacatepay.com/)
