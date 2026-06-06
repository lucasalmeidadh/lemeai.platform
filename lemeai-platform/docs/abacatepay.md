# AbacatePay — Requisições HTTP

Base URL: `https://api.lemeia.com.br`

Todos os endpoints autenticados exigem o header:
```
Authorization: Bearer <jwt-token>
```

---

## Planos

> Requer permissão `gbcode_admin_sistema`. Apenas o admin do sistema pode gerenciar planos.

---

### GET /api/plano/BuscarTodos

Lista todos os planos ativos do sistema.

**Requisição**
```http
GET /api/plano/BuscarTodos
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Planos encontrados.",
  "dados": [
    {
      "planoId": 1,
      "planoNome": "Starter",
      "planoDescricao": "Até 2 usuários e 500 conversas/mês",
      "planoPreco": 99.00,
      "planoCiclo": "MONTHLY",
      "planoAtivo": true,
      "abacateProductId": "prod_abc123",
      "abacateStatus": "ACTIVE",
      "planoCreatedat": "2026-01-15T10:00:00Z"
    },
    {
      "planoId": 2,
      "planoNome": "Pro",
      "planoDescricao": "Usuários ilimitados e conversas ilimitadas",
      "planoPreco": 199.00,
      "planoCiclo": "MONTHLY",
      "planoAtivo": true,
      "abacateProductId": "prod_def456",
      "abacateStatus": "ACTIVE",
      "planoCreatedat": "2026-01-15T10:05:00Z"
    }
  ]
}
```

---

### GET /api/plano/BuscarPorId/{id}

Retorna um plano pelo ID.

**Requisição**
```http
GET /api/plano/BuscarPorId/1
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Plano encontrado.",
  "dados": {
    "planoId": 1,
    "planoNome": "Starter",
    "planoDescricao": "Até 2 usuários e 500 conversas/mês",
    "planoPreco": 99.00,
    "planoCiclo": "MONTHLY",
    "planoAtivo": true,
    "abacateProductId": "prod_abc123",
    "abacateStatus": "ACTIVE",
    "planoCreatedat": "2026-01-15T10:00:00Z"
  }
}
```

**Resposta 400 — não encontrado**
```json
{
  "sucesso": false,
  "mensagem": "Plano não encontrado.",
  "dados": null
}
```

---

### POST /api/plano/Criar

Cria um novo plano e registra o produto na AbacatePay automaticamente.

Valores válidos para `ciclo`: `WEEKLY` · `MONTHLY` · `QUARTERLY` · `SEMIANNUALLY` · `ANNUALLY`

**Requisição**
```http
POST /api/plano/Criar
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "nome": "Pro",
  "descricao": "Usuários ilimitados e conversas ilimitadas",
  "preco": 199.00,
  "ciclo": "MONTHLY"
}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Plano criado com sucesso.",
  "dados": {
    "planoId": 2,
    "planoNome": "Pro",
    "planoDescricao": "Usuários ilimitados e conversas ilimitadas",
    "planoPreco": 199.00,
    "planoCiclo": "MONTHLY",
    "planoAtivo": true,
    "abacateProductId": "prod_def456",
    "abacateStatus": "ACTIVE",
    "planoCreatedat": "2026-06-06T14:30:00Z"
  }
}
```

> Se a AbacatePay não estiver configurada (ApiKey vazia), o plano é salvo localmente com `abacateProductId: null`. O plano funciona, mas não poderá ser usado para criar checkouts até ser sincronizado.

**Resposta 400 — erro**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao criar plano.",
  "dados": null
}
```

---

### PUT /api/plano/Atualizar

Atualiza nome, descrição, preço e status ativo de um plano. A atualização é apenas local — a AbacatePay não possui endpoint de edição de produto.

**Requisição**
```http
PUT /api/plano/Atualizar
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "planoId": 2,
  "nome": "Pro",
  "descricao": "Usuários ilimitados, conversas ilimitadas e suporte prioritário",
  "preco": 219.00,
  "ativo": true
}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Plano atualizado com sucesso.",
  "dados": null
}
```

**Resposta 400 — não encontrado**
```json
{
  "sucesso": false,
  "mensagem": "Plano não encontrado.",
  "dados": null
}
```

---

### DELETE /api/plano/Remover/{id}

Soft delete do plano. O produto permanece na AbacatePay — assinaturas existentes não são afetadas.

**Requisição**
```http
DELETE /api/plano/Remover/2
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Plano removido com sucesso.",
  "dados": null
}
```

**Resposta 400 — não encontrado**
```json
{
  "sucesso": false,
  "mensagem": "Plano não encontrado.",
  "dados": null
}
```

---

## Assinaturas

> Requer JWT de usuário autenticado. O `empresaId` é extraído automaticamente do token — não enviar no corpo.

---

### GET /api/assinatura/BuscarAssinatura

Retorna a assinatura ativa da empresa do usuário logado.

**Requisição**
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
    "abacateSubscriptionId": "subs_xyz789",
    "assinaturaStatus": "PAID",
    "assinaturaCiclo": "MONTHLY",
    "assinaturaValor": 99.00,
    "assinaturaCheckoutUrl": null,
    "assinaturaInicioEm": "2026-06-01T00:00:00Z",
    "assinaturaExpiraEm": "2026-07-01T00:00:00Z"
  }
}
```

**Resposta 400 — sem assinatura**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma assinatura encontrada.",
  "dados": null
}
```

---

### POST /api/assinatura/CriarCheckout

Gera um checkout de assinatura na AbacatePay para o plano escolhido. Retorna a URL de pagamento para redirecionar o cliente.

**Requisição**
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
    "abacateSubscriptionId": "subs_xyz789",
    "assinaturaStatus": "PENDING",
    "assinaturaCiclo": "MONTHLY",
    "assinaturaValor": 99.00,
    "assinaturaCheckoutUrl": "https://checkout.abacatepay.com/pay/subs_xyz789",
    "assinaturaInicioEm": null,
    "assinaturaExpiraEm": null
  }
}
```

**Resposta 400 — plano não sincronizado**
```json
{
  "sucesso": false,
  "mensagem": "Plano ainda não sincronizado com a AbacatePay.",
  "dados": null
}
```

**Resposta 400 — erro na AbacatePay**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao criar checkout na AbacatePay.",
  "dados": null
}
```

---

### PATCH /api/assinatura/TrocarPlano

Solicita troca de plano da assinatura ativa. A mudança é aplicada **no início do próximo ciclo de cobrança** — o ciclo atual permanece inalterado.

**Requisição**
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

**Resposta 400 — sem assinatura ativa**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma assinatura ativa encontrada.",
  "dados": null
}
```

**Resposta 400 — novo plano não encontrado**
```json
{
  "sucesso": false,
  "mensagem": "Plano não encontrado.",
  "dados": null
}
```

**Resposta 400 — erro na AbacatePay**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao solicitar troca de plano na AbacatePay.",
  "dados": null
}
```

---

### DELETE /api/assinatura/Cancelar

Cancela a assinatura ativa imediatamente. O acesso é encerrado na hora — ação irreversível.

**Requisição**
```http
DELETE /api/assinatura/Cancelar
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Assinatura cancelada. O acesso foi encerrado imediatamente.",
  "dados": null
}
```

**Resposta 400 — sem assinatura ativa**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma assinatura ativa encontrada.",
  "dados": null
}
```

---

## Webhook AbacatePay

> Endpoint público — sem autenticação JWT. Validado via header `x-abacatepay-signature`.

Configurar no painel AbacatePay apontando para:
```
POST https://api.lemeia.com.br/api/webhook/abacatepay
```

### POST /api/webhook/abacatepay

Recebe eventos da AbacatePay e atualiza o estado da assinatura e da empresa.

**Headers**
```http
x-abacatepay-signature: <webhook-secret>
Content-Type: application/json
```

**Eventos tratados**

| Evento | Ação |
|--------|------|
| `subscription.activated` | Status → `PAID`, atualiza `BranchSubscriptionExpires`, desativa trial |
| `billing.paid` | Status → `PAID`, estende `BranchSubscriptionExpires` |
| `subscription.cancelled` | Status → `CANCELLED` |
| `subscription.expired` | Status → `EXPIRED` |
| `billing.failed` | Status → `FAILED` |

---

**Exemplo — subscription.activated / billing.paid**
```http
POST /api/webhook/abacatepay
x-abacatepay-signature: meu-webhook-secret
Content-Type: application/json
```
```json
{
  "event": "subscription.activated",
  "data": {
    "id": "subs_xyz789",
    "externalId": "42",
    "status": "PAID",
    "startedAt": "2026-06-06T14:00:00.000Z",
    "expiresAt": "2026-07-06T14:00:00.000Z"
  }
}
```

**Exemplo — billing.paid (renovação)**
```json
{
  "event": "billing.paid",
  "data": {
    "id": "bill_abc111",
    "externalId": "42",
    "status": "PAID",
    "startedAt": "2026-07-06T14:00:00.000Z",
    "expiresAt": "2026-08-06T14:00:00.000Z"
  }
}
```

**Exemplo — subscription.cancelled**
```json
{
  "event": "subscription.cancelled",
  "data": {
    "id": "subs_xyz789",
    "externalId": "42",
    "status": "CANCELLED",
    "startedAt": null,
    "expiresAt": null
  }
}
```

**Resposta 200** (para qualquer evento, inclusive desconhecidos)
```json
{
  "sucesso": true,
  "mensagem": "Webhook processado.",
  "dados": null
}
```

**Resposta 401 — secret inválido**
```
HTTP 401 Unauthorized
```

---

## Status de Assinatura

| Status | Descrição |
|--------|-----------|
| `PENDING` | Checkout criado, aguardando pagamento |
| `PAID` | Assinatura ativa e paga |
| `CANCELLED` | Cancelada manualmente |
| `EXPIRED` | Expirou sem renovação |
| `FAILED` | Renovação falhou |

## Ciclos de Plano

| Valor | Descrição |
|-------|-----------|
| `WEEKLY` | Semanal |
| `MONTHLY` | Mensal |
| `QUARTERLY` | Trimestral |
| `SEMIANNUALLY` | Semestral |
| `ANNUALLY` | Anual |
