# Chat — Documentação de Endpoints

Base URL: `/api/Chat`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
`usuarioId`, `empresaId` e `role` são extraídos automaticamente do token JWT.

---

## Conversas

### GET `/api/Chat/ConversasPorVendedor`

Retorna todas as conversas atribuídas ao usuário autenticado.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conversas encontradas.",
  "dados": [
    {
      "idConversa": 10,
      "nomeContato": "Carlos Souza",
      "telefoneContato": "5511999990000",
      "ultimaMensagem": "Olá, tudo bem?",
      "dataUltimaMensagem": "2026-05-02T14:30:00",
      "statusId": 1,
      "tipoLeadId": 2
    }
  ]
}
```

---

### GET `/api/Chat/Conversas/{idConversa}/Mensagens`

Retorna todas as mensagens de uma conversa. Respeita a role do usuário para controle de acesso.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Mensagens encontradas.",
  "dados": [
    {
      "idMensagem": 101,
      "conteudo": "Olá, tudo bem?",
      "remetente": "contato",
      "dataEnvio": "2026-05-02T14:30:00",
      "tipoMidia": null
    },
    {
      "idMensagem": 102,
      "conteudo": "Tudo ótimo! Como posso ajudar?",
      "remetente": "usuario",
      "dataEnvio": "2026-05-02T14:31:00",
      "tipoMidia": null
    }
  ]
}
```

---

### POST `/api/Chat/Conversas/{idConversa}/EnviarMensagem`

Envia uma mensagem de texto para a conversa.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Request body:** `string` (texto puro, com `Content-Type: application/json`)
```json
"Olá! Sua proposta foi aprovada."
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Mensagem enviada com sucesso.",
  "dados": null
}
```

---

### POST `/api/Chat/Conversa/{idConversa}/EnviarMidia`

Envia um arquivo de mídia (imagem, documento, áudio, etc.) para a conversa.  
Deve ser enviado como `multipart/form-data`.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Form fields:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `Arquivo` | `file` | Sim | Arquivo a ser enviado |
| `TipoMidia` | `string` | Sim | Tipo da mídia (ex: `"image"`, `"document"`, `"audio"`, `"video"`) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Mídia enviada com sucesso.",
  "dados": null
}
```

**Response 400** (arquivo ausente):
```json
"Arquivo não enviado."
```

---

### PATCH `/api/Chat/Conversas/{idConversa}/AtualizarStatus`

Atualiza o status de uma conversa (ex: aberto, fechado, em atendimento).

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Request body:**
```json
{
  "idStatus": 2,
  "valor": 1500.00
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `idStatus` | `int` | Sim | ID do novo status |
| `valor` | `float?` | Não | Valor associado ao status (ex: valor de venda) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Status atualizado com sucesso.",
  "dados": null
}
```

---

### PATCH `/api/Chat/Conversas/{idConversa}/TranferirConversa`

Transfere a responsabilidade de uma conversa para outro usuário.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Request body:**
```json
{
  "idResponsavelAtual": 5,
  "idNovoResponsavel": 8
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `idResponsavelAtual` | `int` | Sim | ID do usuário que atualmente gerencia a conversa |
| `idNovoResponsavel` | `int` | Sim | ID do usuário que receberá a conversa |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conversa transferida com sucesso.",
  "dados": null
}
```

---

### GET `/api/Chat/Conversas/BuscarUsuariosTranferencia`

Retorna os usuários disponíveis para receber transferência de conversa (da mesma empresa, excluindo o próprio usuário).

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Usuários encontrados.",
  "dados": [
    {
      "userId": 8,
      "userName": "Ana Lima",
      "userEmail": "ana@empresa.com",
      "userBranchid": 2,
      "branchName": "Empresa Beta",
      "userTypeuserid": 2,
      "userDeleted": false
    }
  ]
}
```

---

### PATCH `/api/Chat/Conversa/{idConversa}/TipoLead`

Atualiza o tipo de lead de uma conversa.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Request body:**
```json
{
  "tipoLeadId": 2
}
```

| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|-------------|-----------|-----------|
| `tipoLeadId` | `int` | Sim | Deve ser `1`, `2` ou `3` | Tipo do lead |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tipo de lead atualizado com sucesso.",
  "dados": null
}
```

**Response 400** (valor inválido):
```json
{
  "sucesso": false,
  "mensagem": "TipoLeadId inválido!",
  "dados": null
}
```

---

### POST `/api/Chat/Conversas/ProcessarInatividade`

Processa conversas inativas, enviando aviso ou encerrando automaticamente.  
**Requer role `3` (administrador).**

**Query param:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `minutosAviso` | `int` | `60` | Minutos de inatividade para disparar o aviso |

Exemplo: `POST /api/Chat/Conversas/ProcessarInatividade?minutosAviso=30`

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conversas inativas processadas.",
  "dados": null
}
```

**Response 403** (role diferente de 3): sem body.

---

### DELETE `/api/Chat/Conversas/{idConversa}`

Remove uma conversa da empresa autenticada.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa a remover |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conversa removida com sucesso.",
  "dados": null
}
```

---

## Documentos / Anexos da Conversa

### GET `/api/Chat/Conversas/{idConversa}/AnexosContato`

Retorna todos os anexos vinculados ao contato de uma conversa.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Anexos encontrados.",
  "dados": [
    {
      "id": 3,
      "conversaId": 10,
      "caminhoAnexo": "anexos/empresa2/contrato.pdf",
      "tipoAnexo": "document",
      "dataCriacao": "2026-04-20T09:00:00"
    }
  ]
}
```

---

### GET `/api/Chat/Anexos/{idAnexo}/Arquivo`

Retorna o arquivo bruto do anexo para download/exibição direta no browser.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idAnexo` | `int` | ID do anexo |

**Response 200:** Arquivo binário com o `Content-Type` correspondente (ex: `application/pdf`, `image/jpeg`).

**Response 404:**
```json
{
  "sucesso": false,
  "mensagem": "Anexo não encontrado.",
  "dados": null
}
```

---

### POST `/api/Chat/Conversas/{idConversa}/AdicionarAnexoContato`

Adiciona um documento/anexo ao contato vinculado à conversa.  
Deve ser enviado como `multipart/form-data`.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Form fields:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `Arquivo` | `file` | Sim | Arquivo a ser salvo como documento do contato |
| `TipoAnexo` | `string` | Sim | Categoria do anexo (ex: `"document"`, `"image"`, `"audio"`) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Anexo adicionado com sucesso.",
  "dados": {
    "id": 5,
    "conversaId": 10,
    "caminhoAnexo": "anexos/empresa2/rg_carlos.jpg",
    "tipoAnexo": "image",
    "dataCriacao": "2026-05-02T11:00:00"
  }
}
```

**Response 400** (arquivo ausente):
```json
{
  "sucesso": false,
  "mensagem": "Arquivo não enviado.",
  "dados": null
}
```

---

### DELETE `/api/Chat/Anexos/{idAnexo}/Remover`

Remove um anexo da conversa/contato.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idAnexo` | `int` | ID do anexo a remover |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Anexo removido com sucesso.",
  "dados": null
}
```

---

## Agendamentos da Conversa

### GET `/api/Chat/Conversas/{idConversa}/Agendamentos`

Retorna todos os eventos de agenda vinculados a uma conversa.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Agendamentos encontrados.",
  "dados": [
    {
      "agendaId": 4,
      "descricao": "Ligação de follow-up",
      "dataInicio": "2026-05-05T10:00:00",
      "dataFim": "2026-05-05T10:30:00",
      "contatoId": 42,
      "detalhes": null,
      "dataCriacao": "2026-05-02T09:00:00"
    }
  ]
}
```

---

### POST `/api/Chat/Conversas/{idConversa}/AdicionarAgendamento`

Cria um novo evento de agenda vinculado a uma conversa.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idConversa` | `int` | ID da conversa |

**Request body:**
```json
{
  "descricao": "Ligação de follow-up",
  "dataInicio": "2026-05-05T10:00:00",
  "dataFim": "2026-05-05T10:30:00",
  "detalhes": "Confirmar fechamento do contrato"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `descricao` | `string` | Sim | Título/descrição do agendamento |
| `dataInicio` | `datetime` | Sim | Data e hora de início (ISO 8601) |
| `dataFim` | `datetime` | Sim | Data e hora de término (ISO 8601) |
| `detalhes` | `string?` | Não | Informações adicionais |

> Diferente do endpoint `/api/Agenda/Criar`, este não aceita `contatoId` — o contato é derivado automaticamente da conversa.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Agendamento criado com sucesso.",
  "dados": {
    "agendaId": 4,
    "descricao": "Ligação de follow-up",
    "dataInicio": "2026-05-05T10:00:00",
    "dataFim": "2026-05-05T10:30:00",
    "contatoId": 42,
    "detalhes": "Confirmar fechamento do contrato",
    "dataCriacao": "2026-05-02T09:00:00"
  }
}
```
