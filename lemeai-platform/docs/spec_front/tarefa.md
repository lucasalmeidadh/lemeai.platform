# Endpoints — Tarefa e TipoTarefa

> Todos os endpoints requerem autenticação via `Authorization: Bearer <token>`.
> O `empresaId` é extraído automaticamente do token JWT — não enviar no body.

---

## TipoTarefa

Base URL: `/api/TipoTarefa`

### Buscar todos os tipos de tarefa

```http
GET /api/TipoTarefa/BuscarTodos
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tipos de tarefa encontrados.",
  "dados": [
    {
      "tipoTarefaId": 1,
      "nome": "Ligação",
      "dataCriacao": "2026-05-31T12:00:00Z"
    },
    {
      "tipoTarefaId": 2,
      "nome": "E-mail",
      "dataCriacao": "2026-05-31T12:05:00Z"
    }
  ]
}
```

---

### Buscar tipo de tarefa por ID

```http
GET /api/TipoTarefa/BuscarPorId/1
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tipo de tarefa encontrado.",
  "dados": {
    "tipoTarefaId": 1,
    "nome": "Ligação",
    "dataCriacao": "2026-05-31T12:00:00Z"
  }
}
```

**Response 400 (não encontrado):**
```json
{
  "sucesso": false,
  "mensagem": "Tipo de tarefa não encontrado.",
  "dados": null
}
```

---

### Criar tipo de tarefa

```http
POST /api/TipoTarefa/Criar
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Visita presencial"
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tipo de tarefa criado com sucesso.",
  "dados": {
    "tipoTarefaId": 3,
    "nome": "Visita presencial",
    "dataCriacao": "2026-05-31T14:00:00Z"
  }
}
```

---

### Atualizar tipo de tarefa

```http
PUT /api/TipoTarefa/Atualizar
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipoTarefaId": 3,
  "nome": "Visita ao cliente"
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tipo de tarefa atualizado com sucesso.",
  "dados": null
}
```

---

### Remover tipo de tarefa (soft delete)

```http
DELETE /api/TipoTarefa/Remover/3
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tipo de tarefa removido com sucesso.",
  "dados": null
}
```

---

## Tarefa

Base URL: `/api/Tarefa`

### Buscar todas as tarefas da empresa

```http
GET /api/Tarefa/BuscarTodos
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tarefas encontradas.",
  "dados": [
    {
      "tarefaId": 1,
      "usuarioCriacaoId": 5,
      "conversaId": 42,
      "descricao": "Ligar para o cliente para agendar visita",
      "estaConcluida": false,
      "tipoTarefaId": 1,
      "dataRetorno": "2026-06-05T09:00:00Z",
      "dataCriacao": "2026-05-31T10:00:00Z"
    }
  ]
}
```

---

### Buscar tarefas por conversa

```http
GET /api/Tarefa/BuscarPorConversa/42
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tarefas da conversa encontradas.",
  "dados": [
    {
      "tarefaId": 1,
      "usuarioCriacaoId": 5,
      "conversaId": 42,
      "descricao": "Ligar para o cliente para agendar visita",
      "estaConcluida": false,
      "tipoTarefaId": 1,
      "dataRetorno": "2026-06-05T09:00:00Z",
      "dataCriacao": "2026-05-31T10:00:00Z"
    }
  ]
}
```

---

### Buscar tarefa por ID

```http
GET /api/Tarefa/BuscarPorId/1
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tarefa encontrada.",
  "dados": {
    "tarefaId": 1,
    "usuarioCriacaoId": 5,
    "conversaId": 42,
    "descricao": "Ligar para o cliente para agendar visita",
    "estaConcluida": false,
    "tipoTarefaId": 1,
    "dataRetorno": "2026-06-05T09:00:00Z",
    "dataCriacao": "2026-05-31T10:00:00Z"
  }
}
```

---

### Criar tarefa

> O `usuarioCriacaoId` é preenchido automaticamente pelo token JWT — não informar no body.

```http
POST /api/Tarefa/Criar
Authorization: Bearer <token>
Content-Type: application/json

{
  "descricao": "Enviar proposta por e-mail",
  "conversaId": 42,
  "tipoTarefaId": 2,
  "dataRetorno": "2026-06-05T09:00:00Z"
}
```

> `conversaId` e `dataRetorno` são opcionais. Use `null` quando não se aplicar.

```json
{
  "descricao": "Revisar contrato interno",
  "conversaId": null,
  "tipoTarefaId": 1,
  "dataRetorno": null
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tarefa criada com sucesso.",
  "dados": {
    "tarefaId": 2,
    "usuarioCriacaoId": 5,
    "conversaId": 42,
    "descricao": "Enviar proposta por e-mail",
    "estaConcluida": false,
    "tipoTarefaId": 2,
    "dataRetorno": "2026-06-05T09:00:00Z",
    "dataCriacao": "2026-05-31T14:30:00Z"
  }
}
```

---

### Atualizar tarefa

```http
PUT /api/Tarefa/Atualizar
Authorization: Bearer <token>
Content-Type: application/json

{
  "tarefaId": 2,
  "descricao": "Enviar proposta revisada por e-mail",
  "estaConcluida": true,
  "tipoTarefaId": 2,
  "dataRetorno": "2026-06-10T09:00:00Z"
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tarefa atualizada com sucesso.",
  "dados": null
}
```

---

### Remover tarefa (soft delete)

```http
DELETE /api/Tarefa/Remover/2
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tarefa removida com sucesso.",
  "dados": null
}
```

---

## Fluxo sugerido

1. Criar os tipos de tarefa necessários via `POST /api/TipoTarefa/Criar`
2. Ao abrir uma conversa, criar tarefas vinculadas via `POST /api/Tarefa/Criar` com `conversaId`
3. Listar tarefas da conversa via `GET /api/Tarefa/BuscarPorConversa/{conversaId}`
4. Marcar como concluída via `PUT /api/Tarefa/Atualizar` com `estaConcluida: true`
