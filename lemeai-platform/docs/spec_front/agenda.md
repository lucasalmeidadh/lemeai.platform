# Agenda — Documentação de Endpoints

Base URL: `/api/Agenda`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
O `empresaId` é extraído automaticamente do token JWT — não deve ser enviado pelo cliente.

---

## GET `/api/Agenda/BuscarTodos`

Retorna todos os eventos de agenda da empresa autenticada.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Eventos encontrados.",
  "dados": [
    {
      "agendaId": 1,
      "descricao": "Reunião com cliente",
      "dataInicio": "2026-05-10T09:00:00",
      "dataFim": "2026-05-10T10:00:00",
      "contatoId": 42,
      "detalhes": "Discutir proposta comercial",
      "dataCriacao": "2026-05-01T14:30:00"
    }
  ]
}
```

---

## GET `/api/Agenda/BuscarPorId/{id}`

Retorna um evento específico pelo ID.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID do evento |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento encontrado.",
  "dados": {
    "agendaId": 1,
    "descricao": "Reunião com cliente",
    "dataInicio": "2026-05-10T09:00:00",
    "dataFim": "2026-05-10T10:00:00",
    "contatoId": 42,
    "detalhes": "Discutir proposta comercial",
    "dataCriacao": "2026-05-01T14:30:00"
  }
}
```

**Response 400** (não encontrado):
```json
{
  "sucesso": false,
  "mensagem": "Evento não encontrado.",
  "dados": null
}
```

---

## GET `/api/Agenda/EventosDoDia`

Retorna os eventos do dia atual que ainda não ocorreram (hora de início >= agora).

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Eventos do dia encontrados.",
  "dados": [
    {
      "agendaId": 3,
      "descricao": "Follow-up proposta",
      "dataInicio": "2026-05-02T15:00:00",
      "dataFim": "2026-05-02T15:30:00",
      "contatoId": null,
      "detalhes": null,
      "dataCriacao": "2026-04-30T08:00:00"
    }
  ]
}
```

---

## GET `/api/Agenda/EventosProximoDia`

Retorna todos os eventos agendados para amanhã.

**Request:** sem body.

**Response 200:** mesmo formato de `BuscarTodos`.

---

## POST `/api/Agenda/Criar`

Cria um novo evento na agenda.

**Request body:**
```json
{
  "descricao": "Reunião com cliente",
  "dataInicio": "2026-05-10T09:00:00",
  "dataFim": "2026-05-10T10:00:00",
  "contatoId": 42,
  "detalhes": "Discutir proposta comercial"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `descricao` | `string` | Sim | Título/descrição do evento |
| `dataInicio` | `datetime` | Sim | Data e hora de início (ISO 8601) |
| `dataFim` | `datetime` | Sim | Data e hora de término (ISO 8601) |
| `contatoId` | `int?` | Não | ID do contato vinculado ao evento |
| `detalhes` | `string?` | Não | Detalhes adicionais |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento criado com sucesso.",
  "dados": {
    "agendaId": 7,
    "descricao": "Reunião com cliente",
    "dataInicio": "2026-05-10T09:00:00",
    "dataFim": "2026-05-10T10:00:00",
    "contatoId": 42,
    "detalhes": "Discutir proposta comercial",
    "dataCriacao": "2026-05-02T10:00:00"
  }
}
```

---

## PUT `/api/Agenda/Atualizar`

Atualiza um evento existente.

**Request body:**
```json
{
  "agendaId": 7,
  "descricao": "Reunião com cliente — atualizada",
  "dataInicio": "2026-05-10T10:00:00",
  "dataFim": "2026-05-10T11:00:00",
  "contatoId": 42,
  "detalhes": "Nova pauta adicionada"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `agendaId` | `int` | Sim | ID do evento a atualizar |
| `descricao` | `string` | Sim | Novo título/descrição |
| `dataInicio` | `datetime` | Sim | Nova data/hora de início |
| `dataFim` | `datetime` | Sim | Nova data/hora de término |
| `contatoId` | `int?` | Não | ID do contato vinculado |
| `detalhes` | `string?` | Não | Novos detalhes |

**Response 200:** mesmo formato de `Criar`.

**Response 400** (evento não encontrado ou de outra empresa):
```json
{
  "sucesso": false,
  "mensagem": "Evento não encontrado.",
  "dados": null
}
```

---

## DELETE `/api/Agenda/Remover/{id}`

Remove um evento da agenda.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID do evento a remover |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento removido com sucesso.",
  "dados": null
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Evento não encontrado.",
  "dados": null
}
```
