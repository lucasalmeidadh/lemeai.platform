# Motivo de Perda do Lead — Endpoints

Base URL: `https://api.lemeia.com.br`

Todos os endpoints exigem o header:
```
Authorization: Bearer <jwt-token>
```

> Ver especificação completa em [docs/motivo-perda-lead/especificacao.md](../motivo-perda-lead/especificacao.md).

---

## Visão Geral

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/motivoperda/BuscarTodos` | Lista os motivos de perda ativos da empresa do usuário autenticado |
| `GET` | `/api/motivoperda/BuscarPorId/{idMotivoPerda}` | Busca um motivo de perda específico |
| `POST` | `/api/motivoperda/Criar` | Cria um novo motivo de perda para a empresa |
| `PUT` | `/api/motivoperda/Atualizar/{idMotivoPerda}` | Atualiza a descrição de um motivo de perda |
| `DELETE` | `/api/motivoperda/Deletar/{idMotivoPerda}` | Remove (soft delete) um motivo de perda |
| `PATCH` | `/api/chat/Conversas/{idConversa}/AtualizarStatus` | **(já existe, alterado)** Exige `motivoPerdaId` no body quando `idStatus = 6` (VendaPerdida); aceita `motivoPerdaDetalhe` opcional |
| `GET` | `/api/oportunidadevenda/MotivosPerda/{idConversa}` | Lista o histórico completo de motivos de perda de uma conversa (mais recente primeiro) |

O `empresaId` usado no catálogo é sempre extraído do token JWT — nunca informado pelo cliente.

---

## Catálogo de Motivos de Perda

### GET /api/motivoperda/BuscarTodos

```http
GET /api/motivoperda/BuscarTodos
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Motivos de perda buscados com sucesso",
  "dados": [
    {
      "motivoPerdaId": 1,
      "descricao": "Preço",
      "dataCriacao": "2026-05-10T12:00:00Z"
    },
    {
      "motivoPerdaId": 2,
      "descricao": "Concorrência",
      "dataCriacao": "2026-05-10T12:01:00Z"
    },
    {
      "motivoPerdaId": 3,
      "descricao": "Sem resposta",
      "dataCriacao": "2026-05-10T12:02:00Z"
    }
  ]
}
```

**Resposta 400 — nenhum motivo cadastrado**
```json
{ "sucesso": false, "mensagem": "Nenhum motivo de perda encontrado.", "dados": null }
```

---

### GET /api/motivoperda/BuscarPorId/{idMotivoPerda}

```http
GET /api/motivoperda/BuscarPorId/1
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Motivo de perda buscado com sucesso",
  "dados": {
    "motivoPerdaId": 1,
    "descricao": "Preço",
    "dataCriacao": "2026-05-10T12:00:00Z"
  }
}
```

**Resposta 400**
```json
{ "sucesso": false, "mensagem": "Motivo de perda não encontrado.", "dados": null }
```

---

### POST /api/motivoperda/Criar

```http
POST /api/motivoperda/Criar
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "descricao": "Sem orçamento"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `descricao` | `string` | sim | Nome do motivo de perda. Sem validação de duplicidade — a mesma empresa pode ter dois motivos com descrições repetidas/parecidas |

**Resposta 200**
```json
{ "sucesso": true, "mensagem": "Motivo de perda criado com sucesso", "dados": null }
```

---

### PUT /api/motivoperda/Atualizar/{idMotivoPerda}

```http
PUT /api/motivoperda/Atualizar/3
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "descricao": "Sem resposta do cliente"
}
```

**Resposta 200**
```json
{ "sucesso": true, "mensagem": "Motivo de perda atualizado com sucesso", "dados": null }
```

**Resposta 400 — motivo não encontrado**
```json
{ "sucesso": false, "mensagem": "Motivo de perda não encontrado.", "dados": null }
```

**Resposta 400 — motivo pertence a outra empresa**
```json
{ "sucesso": false, "mensagem": "Acesso não autorizado.", "dados": null }
```

---

### DELETE /api/motivoperda/Deletar/{idMotivoPerda}

Soft delete — o registro deixa de aparecer em `BuscarTodos`, mas o histórico em `conversation_loss_reasons` (tabela dedicada) continua exibindo a descrição normalmente, já que o motivo nunca é removido fisicamente do catálogo.

```http
DELETE /api/motivoperda/Deletar/3
Authorization: Bearer <token>
```

**Resposta 200**
```json
{ "sucesso": true, "mensagem": "Motivo de perda deletado com sucesso", "dados": null }
```

**Resposta 400**
```json
{ "sucesso": false, "mensagem": "Motivo de perda não encontrado.", "dados": null }
```

---

## Alteração no fluxo de troca de status (`AtualizarStatus`)

### PATCH /api/chat/Conversas/{idConversa}/AtualizarStatus

Quando `idStatus` for `6` (`VendaPerdida`), o motivo de perda passa a ser **obrigatório** — no mesmo padrão da exigência de produto vinculado para `VendaFechada` (`idStatus = 3`). Ao aplicar o status, `conversaFechadaEm` também é preenchido (mesmo comportamento já existente para venda fechada), e um novo registro de histórico é gravado na tabela dedicada `conversation_loss_reasons` (nenhuma coluna é sobrescrita em `conversations`).

**Marcando como perdida — motivo + detalhe**
```http
PATCH /api/chat/Conversas/42/AtualizarStatus
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "idStatus": 6,
  "motivoPerdaId": 1,
  "motivoPerdaDetalhe": "Cliente achou caro comparado ao concorrente X"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `idStatus` | `int` | sim | Novo status da conversa (`StatusConversaEnum`) |
| `valor` | `float?` | não | Valor da oportunidade (uso já existente, não relacionado ao motivo de perda) |
| `motivoPerdaId` | `int?` | **sim quando `idStatus = 6`** | ID de um `MotivoPerda` cadastrado, pertencente à mesma empresa da conversa |
| `motivoPerdaDetalhe` | `string?` | não | Texto livre complementar ao motivo catalogado (ex.: detalhe específico do caso) |

**Resposta 200**
```json
{ "sucesso": true, "mensagem": "Status atualizado com sucesso", "dados": null }
```

**Resposta 400 — motivo não informado**
```json
{ "sucesso": false, "mensagem": "Para marcar a venda como perdida, é necessário informar o motivo da perda.", "dados": null }
```

> Retornado quando `motivoPerdaId` é `null`, `0` ou negativo.

**Resposta 400 — motivo inexistente ou de outra empresa**
```json
{ "sucesso": false, "mensagem": "Motivo de perda não encontrado.", "dados": null }
```

> Retornado tanto quando o `motivoPerdaId` não existe quanto quando ele pertence a uma empresa diferente da conversa (isolamento multi-tenant).

**Marcando como perdida — sem detalhe (opcional)**
```json
{
  "idStatus": 6,
  "motivoPerdaId": 2
}
```

> `motivoPerdaDetalhe` pode ser omitido ou `null`. O motivo é armazenado em uma tabela de histórico (`conversation_loss_reasons`, no mesmo padrão de `DetalheConversa`): se a oportunidade for reaberta e perdida novamente, um **novo registro** é criado — o anterior não é apagado, apenas deixa de ser o mais recente.

---

## Histórico de motivos de perda de uma conversa

A listagem principal de oportunidades (`GET /api/oportunidadevenda/BuscarTodas`) **não traz mais** o motivo de perda embutido no `OportunidadeVendaResponseDTO` — essa informação é consultada à parte, sob demanda, por conversa.

### GET /api/oportunidadevenda/MotivosPerda/{idConversa}

Retorna todos os registros de `conversation_loss_reasons` daquela conversa, do mais recente para o mais antigo — inclui perdas anteriores caso a oportunidade tenha sido reaberta e perdida mais de uma vez.

```http
GET /api/oportunidadevenda/MotivosPerda/42
Authorization: Bearer <token>
```

**Resposta 200 — com histórico**
```json
{
  "sucesso": true,
  "mensagem": "Motivo de Perda encontrado com sucesso",
  "dados": [
    {
      "idMotivoPerda": 2,
      "idConversa": 42,
      "descricaoMotivo": "Concorrência",
      "detalhesMotivo": "Fechou com o concorrente Y por um preço menor",
      "dataMotivo": "2026-07-03T09:15:00Z"
    },
    {
      "idMotivoPerda": 1,
      "idConversa": 42,
      "descricaoMotivo": "Preço",
      "detalhesMotivo": "Cliente achou caro comparado ao concorrente X",
      "dataMotivo": "2026-07-01T14:30:00Z"
    }
  ]
}
```

> O primeiro item do array é sempre o motivo **mais recente** (ex.: se a oportunidade foi reaberta após a primeira perda e perdida de novo por outro motivo). `detalhesMotivo` vem como `""` (string vazia) quando a conversa não tiver informado o detalhe opcional — nunca `null`.

**Resposta 200 — sem nenhuma perda registrada**
```json
{ "sucesso": true, "mensagem": "Nenhum motivo de Perda encontrado", "dados": null }
```

**Resposta 400 — erro inesperado**
```json
{ "sucesso": false, "mensagem": "Erro ao buscar Motivo de Perda, tente novamente!", "dados": null }
```
