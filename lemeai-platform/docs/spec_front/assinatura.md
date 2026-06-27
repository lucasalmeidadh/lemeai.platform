# Assinatura — Endpoints

Base URL: `https://api.lemeia.com.br`

Todos os endpoints exigem o header:
```
Authorization: Bearer <jwt-token>
```

`empresaId` é sempre extraído do token — nunca enviado por parâmetro.

---

## Visão Geral

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/assinatura/PlanosDisponiveis` | Lista planos pagos disponíveis para contratação (oculta o plano de teste) |
| `GET` | `/api/assinatura/BuscarAssinatura` | Busca a assinatura vigente da empresa |
| `POST` | `/api/assinatura/CriarCheckout` | Cria checkout de assinatura recorrente (CARD) na AbacatePay |
| `POST` | `/api/assinatura/CriarCheckoutPix` | Cria checkout avulso (PIX) na AbacatePay |
| `PATCH` | `/api/assinatura/TrocarPlano` | Troca o plano da assinatura ativa (apenas CARD) |
| `DELETE` | `/api/assinatura/Cancelar` | Cancela a assinatura ativa |

---

### GET /api/assinatura/PlanosDisponiveis

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
      "planoDescricao": "Até 3 usuários",
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

> O plano de teste (`planoIsTrial: true`) nunca aparece nesta lista.

---

### GET /api/assinatura/BuscarAssinatura

Retorna a assinatura vigente da empresa, já com o nome e a descrição do plano vinculado (sem expor o objeto completo do plano).

```http
GET /api/assinatura/BuscarAssinatura
Authorization: Bearer <token>
```

**Resposta 200 — plano pago**
```json
{
  "sucesso": true,
  "mensagem": "Assinatura encontrada.",
  "dados": {
    "assinaturaId": 10,
    "planoId": 1,
    "abacateSubscriptionId": "sub_abc123",
    "assinaturaStatus": "PAID",
    "assinaturaCiclo": "MONTHLY",
    "assinaturaValor": 197.00,
    "assinaturaMetodo": "CARD",
    "assinaturaCheckoutUrl": "https://checkout.abacatepay.com/...",
    "assinaturaInicioEm": "2025-06-01T10:00:00Z",
    "assinaturaExpiraEm": "2025-07-01T10:00:00Z",
    "nomePlano": "Starter",
    "descricaoPlano": "Até 3 usuários"
  }
}
```

**Resposta 200 — plano de teste (trial)**

Para assinaturas vinculadas ao plano de teste, `assinaturaValor`, `assinaturaCiclo` e `assinaturaMetodo` são sobrescritos para deixar claro ao front que não há cobrança — independente dos valores gravados na assinatura/plano:

```json
{
  "sucesso": true,
  "mensagem": "Assinatura encontrada.",
  "dados": {
    "assinaturaId": 11,
    "planoId": 2,
    "abacateSubscriptionId": "trial_55_a1b2c3",
    "assinaturaStatus": "TRIAL",
    "assinaturaCiclo": "Gratuito",
    "assinaturaValor": 0,
    "assinaturaMetodo": "Plano Gratuito - Sem Cobrança",
    "assinaturaCheckoutUrl": null,
    "assinaturaInicioEm": "2026-06-12T09:00:00Z",
    "assinaturaExpiraEm": "2026-06-27T09:00:00Z",
    "nomePlano": "Teste Gratuito",
    "descricaoPlano": "Plano de teste — 15 dias"
  }
}
```

**Resposta 400 — sem assinatura**
```json
{ "sucesso": false, "mensagem": "Nenhuma assinatura encontrada.", "dados": null }
```

---

### POST /api/assinatura/CriarCheckout

Cria uma assinatura recorrente (cobrança via cartão) na AbacatePay para o plano informado.

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
    "assinaturaId": 10,
    "planoId": 1,
    "abacateSubscriptionId": "sub_abc123",
    "assinaturaStatus": "PENDING",
    "assinaturaCiclo": "MONTHLY",
    "assinaturaValor": 197.00,
    "assinaturaMetodo": "CARD",
    "assinaturaCheckoutUrl": "https://checkout.abacatepay.com/...",
    "assinaturaInicioEm": null,
    "assinaturaExpiraEm": null,
    "nomePlano": "",
    "descricaoPlano": null
  }
}
```

> `nomePlano`/`descricaoPlano` só são preenchidos em `BuscarAssinatura` (a entidade `Assinatura` recém-criada ainda não carrega a navegação `Plano` em memória neste fluxo).

**Resposta 400 — plano não encontrado**
```json
{ "sucesso": false, "mensagem": "Plano não encontrado.", "dados": null }
```

**Resposta 400 — plano não sincronizado com a AbacatePay**
```json
{ "sucesso": false, "mensagem": "Plano ainda não sincronizado com a AbacatePay.", "dados": null }
```

**Resposta 400 — tentativa de contratar o plano de teste**
```json
{ "sucesso": false, "mensagem": "O plano de teste não pode ser contratado diretamente.", "dados": null }
```

> Antes de criar o checkout, o sistema valida os limites de usuário/conexão do plano de destino via `ILimitePlanoService` — ver [planos.md](planos.md#limite-de-usuário-e-conexão-por-plano).

---

### POST /api/assinatura/CriarCheckoutPix

Cria um checkout avulso (PIX, sem recorrência automática) na AbacatePay.

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
    "assinaturaId": 12,
    "planoId": 1,
    "abacateSubscriptionId": "checkout_xyz789",
    "assinaturaStatus": "PENDING",
    "assinaturaCiclo": "MONTHLY",
    "assinaturaValor": 197.00,
    "assinaturaMetodo": "PIX",
    "assinaturaCheckoutUrl": "https://checkout.abacatepay.com/...",
    "assinaturaInicioEm": null,
    "assinaturaExpiraEm": null,
    "nomePlano": "",
    "descricaoPlano": null
  }
}
```

**Resposta 400 — plano sem produto PIX configurado**
```json
{ "sucesso": false, "mensagem": "Plano não possui produto PIX configurado na AbacatePay.", "dados": null }
```

---

### PATCH /api/assinatura/TrocarPlano

Solicita a troca de plano da assinatura ativa. Só é aplicada no próximo ciclo de cobrança e **não está disponível** para assinaturas PIX (sem recorrência automática na AbacatePay).

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
{ "sucesso": true, "mensagem": "Troca de plano solicitada. Será aplicada no próximo ciclo de cobrança.", "dados": null }
```

**Resposta 400 — assinatura PIX**
```json
{ "sucesso": false, "mensagem": "Troca de plano automática não disponível para assinaturas PIX. Aguarde o vencimento e crie uma nova assinatura com o plano desejado.", "dados": null }
```

**Resposta 400 — tentativa de trocar para o plano de teste**
```json
{ "sucesso": false, "mensagem": "O plano de teste não pode ser contratado diretamente.", "dados": null }
```

---

### DELETE /api/assinatura/Cancelar

Cancela a assinatura ativa imediatamente. Para assinaturas `CARD`, cancela também na AbacatePay.

```http
DELETE /api/assinatura/Cancelar
Authorization: Bearer <token>
```

**Resposta 200**
```json
{ "sucesso": true, "mensagem": "Assinatura cancelada. O acesso foi encerrado imediatamente.", "dados": null }
```

**Resposta 400 — sem assinatura ativa**
```json
{ "sucesso": false, "mensagem": "Nenhuma assinatura ativa encontrada.", "dados": null }
```

---

## Campos de `AssinaturaResponse`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `assinaturaId` | `int` | |
| `planoId` | `int` | |
| `abacateSubscriptionId` | `string` | ID da assinatura/checkout na AbacatePay (ou `trial_*`/`checkout_*` sintético) |
| `assinaturaStatus` | `string` | `TRIAL` / `PENDING` / `PAID` / `CANCELLED` / `EXPIRED` |
| `assinaturaCiclo` | `string` | Ciclo de cobrança do plano (`MONTHLY`, etc.) — `"Gratuito"` quando o plano é trial |
| `assinaturaValor` | `decimal` | Valor cobrado — `0` quando o plano é trial |
| `assinaturaMetodo` | `string` | `CARD` / `PIX` / `TRIAL` — sobrescrito para `"Plano Gratuito - Sem Cobrança"` quando o plano é trial |
| `assinaturaCheckoutUrl` | `string?` | URL de checkout da AbacatePay |
| `assinaturaInicioEm` | `DateTime?` | |
| `assinaturaExpiraEm` | `DateTime?` | |
| `nomePlano` | `string` | Nome do plano vinculado à assinatura |
| `descricaoPlano` | `string?` | Descrição do plano vinculado à assinatura |

> O objeto completo do `Plano` **não é exposto** ao front — apenas `nomePlano`/`descricaoPlano` são extraídos dele. Demais dados do plano (preço, limites, ciclo etc.) devem ser obtidos via `GET /api/assinatura/PlanosDisponiveis` ou `GET /api/plano/BuscarTodos` (admin).

> Quando a assinatura está vinculada ao plano de teste (`planoIsTrial: true`), os campos `assinaturaValor`, `assinaturaCiclo` e `assinaturaMetodo` são sobrescritos pelo service em `BuscarAssinatura` — ver [planos.md](planos.md#plano-de-teste-trial).


