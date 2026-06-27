# AbacatePay — Endpoints

Base URL: `https://api.lemeia.com.br`

Todos os endpoints autenticados exigem o header:
```
Authorization: Bearer <jwt-token>
```

---

## Visão Geral

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/assinatura/PlanosDisponiveis` | JWT | Lista planos ativos disponíveis |
| `GET` | `/api/assinatura/BuscarAssinatura` | JWT | Retorna assinatura da empresa autenticada |
| `POST` | `/api/assinatura/CriarCheckout` | JWT | Gera checkout de assinatura via cartão de crédito |
| `POST` | `/api/assinatura/CriarCheckoutPix` | JWT | Gera checkout PIX avulso (período controlado internamente) |
| `PATCH` | `/api/assinatura/TrocarPlano` | JWT | Troca plano no próximo ciclo (apenas CARD) |
| `DELETE` | `/api/assinatura/Cancelar` | JWT | Cancela assinatura (acesso mantido até expirar) |
| `POST` | `/api/webhook/abacatepay` | Sem JWT (secret via query) | Recebe eventos da AbacatePay |

> Endpoints de gerenciamento de plano (`/api/plano/*`, incluindo limites de usuário/conexão e plano de teste) estão documentados em [planos.md](planos.md).

---

## Status de Assinatura

| Status | Descrição |
|--------|-----------|
| `TRIAL` | Trial ativo — criado automaticamente no onboarding, vinculado ao plano de teste |
| `PENDING` | Checkout criado, aguardando pagamento |
| `PAID` | Ativa e paga |
| `CANCELLED` | Cancelada (acesso até `assinaturaExpiraEm`) |
| `EXPIRED` | Expirou sem renovação (encerrado pelo job automático) |

## Ciclos de Plano

| Valor | Período |
|-------|---------|
| `WEEKLY` | Semanal |
| `MONTHLY` | Mensal |
| `QUARTERLY` | Trimestral |
| `SEMIANNUALLY` | Semestral |
| `ANNUALLY` | Anual |

---

## Assinatura

> `empresaId` é extraído do JWT — não enviar no corpo.

---

### GET /api/assinatura/PlanosDisponiveis

Lista os planos ativos disponíveis para contratação. **O plano de teste (`planoIsTrial: true`) nunca aparece aqui** — ele só é atribuído automaticamente no onboarding.

```http
GET /api/assinatura/PlanosDisponiveis
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Planos disponíveis.",
  "dados": [
    {
      "planoId": 1,
      "planoNome": "Starter",
      "planoDescricao": "Até 3 usuários, 1 conexão WhatsApp",
      "planoPreco": 197.00,
      "planoCiclo": "MONTHLY",
      "planoAtivo": true,
      "planoLimiteUsuario": 3,
      "planoLimiteConexao": 1,
      "planoIntegradoAbacatePay": true,
      "planoIsTrial": false,
      "abacateProductId": "prod_abc123",
      "abacateStatus": "ACTIVE",
      "planoCreatedat": "2025-01-10T12:00:00Z"
    }
  ]
}
```

> Detalhes completos dos campos de limite de plano (`planoLimiteUsuario`/`planoLimiteConexao`) e do plano de teste em [planos.md](planos.md).

---

### GET /api/assinatura/BuscarAssinatura

Retorna a assinatura da empresa autenticada.

```http
GET /api/assinatura/BuscarAssinatura
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Assinatura encontrada.",
  "dados": {
    "assinaturaId": 7,
    "planoId": 1,
    "abacateSubscriptionId": "sub_abc123",
    "assinaturaStatus": "PAID",
    "assinaturaCiclo": "MONTHLY",
    "assinaturaValor": 197.00,
    "assinaturaMetodo": "CARD",
    "assinaturaCheckoutUrl": null,
    "assinaturaInicioEm": "2025-06-01T00:00:00Z",
    "assinaturaExpiraEm": "2025-07-01T00:00:00Z"
  }
}
```

- `assinaturaMetodo`: `"CARD"` ou `"PIX"`
- `assinaturaCheckoutUrl`: preenchido apenas enquanto status `PENDING`; `null` após confirmação do pagamento
- `assinaturaInicioEm` / `assinaturaExpiraEm`: `null` enquanto `PENDING`, preenchidos pelo webhook de confirmação

**Resposta 400**
```json
{ "sucesso": false, "mensagem": "Nenhuma assinatura encontrada.", "dados": null }
```

---

### POST /api/assinatura/CriarCheckout

Gera um link de checkout de assinatura recorrente via **cartão de crédito**. A AbacatePay gerencia a cobrança automática a cada ciclo. O status só muda para `PAID` após o webhook `subscription.completed`.

```http
POST /api/assinatura/CriarCheckout
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "planoId": 1
}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Checkout criado com sucesso.",
  "dados": {
    "assinaturaId": 7,
    "planoId": 1,
    "abacateSubscriptionId": "sub_abc123",
    "assinaturaStatus": "PENDING",
    "assinaturaCiclo": "MONTHLY",
    "assinaturaValor": 197.00,
    "assinaturaMetodo": "CARD",
    "assinaturaCheckoutUrl": "https://checkout.abacatepay.com/sub_abc123",
    "assinaturaInicioEm": null,
    "assinaturaExpiraEm": null
  }
}
```

Redirecionar o cliente para `assinaturaCheckoutUrl` para inserção dos dados do cartão.

**Resposta 400 — plano não sincronizado**
```json
{ "sucesso": false, "mensagem": "Plano ainda não sincronizado com a AbacatePay.", "dados": null }
```

**Resposta 400 — plano de teste**
```json
{ "sucesso": false, "mensagem": "O plano de teste não pode ser contratado diretamente.", "dados": null }
```

**Resposta 400 — empresa acima do limite do plano de destino**
```json
{ "sucesso": false, "mensagem": "Não é possível mudar para este plano: a empresa possui 5 usuários, mas o plano \"Starter\" permite no máximo 3. Remova o excedente antes de trocar de plano.", "dados": null }
```

> Detalhes sobre limites de usuário/conexão por plano em [planos.md](planos.md).

---

### POST /api/assinatura/CriarCheckoutPix

Gera um checkout PIX via `POST /v2/checkouts/create` na AbacatePay. A AbacatePay **não** renova automaticamente — o LemeIA controla o período de acesso com base no ciclo do plano. O status muda para `PAID` após o webhook `checkout.completed`.

```http
POST /api/assinatura/CriarCheckoutPix
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "planoId": 1
}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Checkout PIX criado com sucesso.",
  "dados": {
    "assinaturaId": 8,
    "planoId": 1,
    "abacateSubscriptionId": "bill_xyz789",
    "assinaturaStatus": "PENDING",
    "assinaturaCiclo": "MONTHLY",
    "assinaturaValor": 197.00,
    "assinaturaMetodo": "PIX",
    "assinaturaCheckoutUrl": "https://checkout.abacatepay.com/bill_xyz789",
    "assinaturaInicioEm": null,
    "assinaturaExpiraEm": null
  }
}
```

Redirecionar o cliente para `assinaturaCheckoutUrl` para visualizar e pagar o QR Code. Diferente do CARD, `abacateSubscriptionId` é um ID de checkout (`bill_`), não de assinatura.

**Resposta 400 — produto PIX não configurado**
```json
{ "sucesso": false, "mensagem": "Plano não possui produto PIX configurado na AbacatePay.", "dados": null }
```

> Planos criados antes da implementação do suporte PIX não possuem produto avulso e retornam esse erro.

**Resposta 400 — plano de teste / limite de plano**

Mesmos formatos de erro do `CriarCheckout` (bloqueio de plano de teste e validação de limites).

---

### PATCH /api/assinatura/TrocarPlano

Solicita a troca do plano na AbacatePay. A mudança é aplicada **no próximo ciclo de cobrança**, não imediatamente. Disponível apenas para assinaturas CARD.

```http
PATCH /api/assinatura/TrocarPlano
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "novoPlanoId": 2
}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Troca de plano solicitada. Será aplicada no próximo ciclo de cobrança.",
  "dados": null
}
```

**Resposta 400 — assinatura PIX**
```json
{
  "sucesso": false,
  "mensagem": "Troca de plano automática não disponível para assinaturas PIX. Cancele a assinatura atual e crie um novo checkout PIX com o plano desejado.",
  "dados": null
}
```

**Resposta 400 — plano de teste / limite de plano**

Mesmos formatos de erro do `CriarCheckout` (bloqueio de plano de teste e validação de limites — ver [planos.md](planos.md)).

---

### DELETE /api/assinatura/Cancelar

Cancela a assinatura. Para CARD, cancela também na AbacatePay (sem cobranças futuras). Para PIX, apenas cancela localmente.

**O acesso permanece ativo até `assinaturaExpiraEm`.** O job automático (`AssinaturaExpiracaoJob`) encerra o acesso quando a data chegar.

```http
DELETE /api/assinatura/Cancelar
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Assinatura cancelada. O acesso permanece ativo até o fim do período pago.",
  "dados": null
}
```

**Resposta 400 — sem assinatura**
```json
{ "sucesso": false, "mensagem": "Nenhuma assinatura ativa encontrada.", "dados": null }
```

---

## Webhook AbacatePay

Endpoint público — sem JWT. Configurar no painel AbacatePay:
```
POST https://api.lemeia.com.br/api/webhook/abacatepay?webhookSecret=SEU_SECRET
```

O `webhookSecret` é validado via query string quando `AbacatePay:WebhookSecret` estiver configurado no `appsettings`.

---

### POST /api/webhook/abacatepay

**Eventos tratados**

| Evento | Ação |
|--------|------|
| `subscription.completed` | Ativa CARD: status `PAID`, preenche `AssinaturaInicioEm`/`AssinaturaExpiraEm`, atualiza `BranchSubscriptionExpires`, remove trial |
| `subscription.renewed` | Renova CARD: status `PAID`, recalcula `AssinaturaExpiraEm` a partir do `UpdatedAt` do webhook |
| `subscription.cancelled` | Status → `CANCELLED` |
| `subscription.trial_started` | Ignorado (trial é gerenciado internamente) |
| `checkout.completed` | Ativa PIX: status `PAID`, preenche `AssinaturaInicioEm`/`AssinaturaExpiraEm` com base no `CreatedAt` do checkout e no ciclo do plano |

---

**Corpo — subscription.completed / subscription.renewed**

```json
{
  "id": "evt_aaa",
  "event": "subscription.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "subscription": {
      "id": "sub_abc123",
      "amount": 19700,
      "currency": "BRL",
      "method": "CREDIT_CARD",
      "status": "ACTIVE",
      "frequency": "MONTHLY",
      "trialDays": null,
      "trialEndsAt": null,
      "createdAt": "2025-06-01T00:00:00Z",
      "updatedAt": "2025-06-01T00:00:00Z",
      "canceledAt": null,
      "cancelPolicy": null,
      "cancelledDueTo": null
    },
    "customer": {
      "id": "cus_xxx",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "taxId": "12345678900"
    },
    "payment": {
      "id": "pay_xxx",
      "externalId": null,
      "amount": 19700,
      "paidAmount": 19700,
      "platformFee": 500,
      "status": "PAID",
      "methods": ["CREDIT_CARD"],
      "receiptUrl": "https://...",
      "createdAt": "2025-06-01T00:00:00Z",
      "updatedAt": "2025-06-01T00:00:00Z"
    },
    "checkout": {
      "id": "chk_xxx",
      "externalId": "7_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      "url": "https://checkout.abacatepay.com/...",
      "amount": 19700,
      "paidAmount": 19700,
      "status": "PAID",
      "methods": ["CREDIT_CARD"],
      "customerId": "cus_xxx",
      "createdAt": "2025-06-01T00:00:00Z",
      "updatedAt": "2025-06-01T00:00:00Z"
    }
  }
}
```

> Para `subscription.renewed`, o campo `data.subscription.updatedAt` é usado como base para recalcular `AssinaturaExpiraEm`.

---

**Corpo — checkout.completed (PIX)**

```json
{
  "id": "evt_bbb",
  "event": "checkout.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "subscription": null,
    "customer": {
      "id": "cus_xxx",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "taxId": "12345678900"
    },
    "payment": {
      "id": "pay_yyy",
      "externalId": null,
      "amount": 19700,
      "paidAmount": 19700,
      "platformFee": 500,
      "status": "PAID",
      "methods": ["PIX"],
      "receiptUrl": "https://...",
      "createdAt": "2025-06-16T10:00:00Z",
      "updatedAt": "2025-06-16T10:05:00Z"
    },
    "checkout": {
      "id": "bill_xyz789",
      "externalId": "7_f6e5d4c3b2a1z9y8x7w6v5u4t3s2r1q0",
      "url": "https://checkout.abacatepay.com/...",
      "amount": 19700,
      "paidAmount": 19700,
      "status": "PAID",
      "methods": ["PIX"],
      "customerId": "cus_xxx",
      "createdAt": "2025-06-16T10:00:00Z",
      "updatedAt": "2025-06-16T10:05:00Z"
    }
  }
}
```

> `data.subscription` é `null` para eventos PIX. A assinatura é localizada via `checkout.externalId` no formato `"{branchId}_{guid}"` (ex.: `"7_f6e5d4..."`).

---

**Corpo — subscription.cancelled**

```json
{
  "id": "evt_ccc",
  "event": "subscription.cancelled",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "subscription": {
      "id": "sub_abc123",
      "status": "CANCELLED",
      "cancelledDueTo": "user_request",
      "canceledAt": "2025-06-10T15:00:00Z",
      "createdAt": "2025-06-01T00:00:00Z",
      "updatedAt": "2025-06-10T15:00:00Z"
    },
    "customer": { "id": "cus_xxx", "name": "João Silva", "email": "joao@empresa.com" },
    "payment": null,
    "checkout": null
  }
}
```

---

**Resposta 200** (sempre retorna 200 para evitar reenvio desnecessário)
```json
{ "sucesso": true, "mensagem": "Webhook processado.", "dados": null }
```

**Resposta 401** — `webhookSecret` ausente ou incorreto quando configurado.
