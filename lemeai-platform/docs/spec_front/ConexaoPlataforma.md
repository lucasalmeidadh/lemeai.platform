# ConexaoPlataforma — Documentação de Endpoints

Base URL: `/api/ConexaoPlataforma`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
`usuarioId`, `empresaId` e `role` são extraídos automaticamente do token JWT.

**Enums:**

| `Plataforma` | Valor |
|-------------|-------|
| WhatsappMeta | `1` |
| WhatsappEvolution | `2` |
| Instagram | `3` |
| FacebookMessenger | `4` |
| LeadAds | `5` |

| `Status` | Valor |
|----------|-------|
| Ativa | `1` |
| Inativa | `2` |
| Expirada | `3` |

---

## Leitura

### GET `/api/ConexaoPlataforma/BuscarTodos`

Retorna todas as conexões ativas da empresa, sem filtro de perfil. Usado por fluxos internos; o front-end deve usar `BuscarConexoesAtivas`.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexões encontradas.",
  "dados": [
    {
      "conexaoPlataformaId": 1,
      "branchId": 5,
      "plataforma": 1,
      "status": 1,
      "nome": "WhatsApp Principal",
      "identificador": "5511999990000",
      "identificadorSecundario": null,
      "tokenExpiracao": null,
      "configuracaoJson": null,
      "conexaoCreatedat": "2026-01-10T12:00:00",
      "conexaoUpdatedat": "2026-01-10T12:00:00",
      "usuarioAtribuidoId": null,
      "usuarioAtribuidoNome": null
    }
  ]
}
```

---

### GET `/api/ConexaoPlataforma/BuscarConexoesAtivas`

Listagem contextual por perfil de usuário. Este é o endpoint que o front-end deve usar.

| Cenário | Comportamento |
|---------|--------------|
| Multi OFF | Retorna todas as conexões da empresa |
| Multi ON + admin (`role == "1"`) | Retorna todas as conexões da empresa |
| Multi ON + não-admin | Retorna apenas conexões atribuídas ao usuário do token |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexões encontradas.",
  "dados": [
    {
      "conexaoPlataformaId": 3,
      "branchId": 5,
      "plataforma": 2,
      "status": 1,
      "nome": "Minha instância Evolution",
      "identificador": "instancia-joao",
      "identificadorSecundario": null,
      "tokenExpiracao": null,
      "configuracaoJson": null,
      "conexaoCreatedat": "2026-03-01T09:00:00",
      "conexaoUpdatedat": "2026-03-01T09:00:00",
      "usuarioAtribuidoId": 12,
      "usuarioAtribuidoNome": "João Silva"
    }
  ]
}
```

---

### GET `/api/ConexaoPlataforma/BuscarPorPlataforma/{plataforma}`

Retorna conexões ativas da empresa filtradas por plataforma.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `plataforma` | `int` | Valor do enum `PlataformaEnum` |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexões encontradas.",
  "dados": [
    {
      "conexaoPlataformaId": 1,
      "branchId": 5,
      "plataforma": 1,
      "status": 1,
      "nome": "WhatsApp Principal",
      "identificador": "5511999990000",
      "identificadorSecundario": "109876543210",
      "tokenExpiracao": null,
      "configuracaoJson": null,
      "conexaoCreatedat": "2026-01-10T12:00:00",
      "conexaoUpdatedat": "2026-01-10T12:00:00",
      "usuarioAtribuidoId": null,
      "usuarioAtribuidoNome": null
    }
  ]
}
```

---

### GET `/api/ConexaoPlataforma/BuscarPorId/{id}`

Retorna uma conexão específica da empresa.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID da conexão |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexão encontrada.",
  "dados": {
    "conexaoPlataformaId": 1,
    "branchId": 5,
    "plataforma": 1,
    "status": 1,
    "nome": "WhatsApp Principal",
    "identificador": "5511999990000",
    "identificadorSecundario": "109876543210",
    "tokenExpiracao": null,
    "configuracaoJson": null,
    "conexaoCreatedat": "2026-01-10T12:00:00",
    "conexaoUpdatedat": "2026-01-10T12:00:00",
    "usuarioAtribuidoId": null,
    "usuarioAtribuidoNome": null
  }
}
```

**Response 400 (não encontrada):**
```json
{
  "sucesso": false,
  "mensagem": "Conexão não encontrada.",
  "dados": null
}
```

---

## Escrita

### POST `/api/ConexaoPlataforma/Criar`

Cria uma conexão sem validação de perfil. Usado por fluxos internos (Instagram OAuth, ConfigurarWhatsapp). O front-end deve usar `CriarComPermissao`.

**Body:**
```json
{
  "plataforma": 2,
  "nome": "Instância Vendas",
  "identificador": "instancia-vendas",
  "identificadorSecundario": null,
  "token": "evo_token_abc123",
  "tokenExpiracao": null,
  "configuracaoJson": null
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `plataforma` | `int` | sim | Valor do enum `PlataformaEnum` |
| `nome` | `string` | sim | Nome amigável da conexão |
| `identificador` | `string` | sim | `phone_number_id` (Meta), `instance_name` (Evolution), IGID (Instagram) |
| `identificadorSecundario` | `string?` | não | WABA ID (Meta) ou outros |
| `token` | `string?` | não | Token de autenticação da plataforma |
| `tokenExpiracao` | `datetime?` | não | Data de expiração do token |
| `configuracaoJson` | `string?` | não | JSON livre com configurações extras |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexão criada com sucesso.",
  "dados": {
    "conexaoPlataformaId": 4,
    "branchId": 5,
    "plataforma": 2,
    "status": 1,
    "nome": "Instância Vendas",
    "identificador": "instancia-vendas",
    "identificadorSecundario": null,
    "tokenExpiracao": null,
    "configuracaoJson": null,
    "conexaoCreatedat": "2026-06-04T10:00:00",
    "conexaoUpdatedat": "2026-06-04T10:00:00",
    "usuarioAtribuidoId": null,
    "usuarioAtribuidoNome": null
  }
}
```

---

### POST `/api/ConexaoPlataforma/CriarComPermissao`

Cria uma conexão com validação de perfil de usuário.

| Cenário | Comportamento |
|---------|--------------|
| Admin (`role == "1"`) | Sempre pode criar, em qualquer empresa |
| Não-admin + multi OFF | Bloqueado — retorna erro |
| Não-admin + multi ON | Pode criar; conexão é auto-atribuída ao usuário do token |

**Body:** mesmo schema de `Criar`.

```json
{
  "plataforma": 2,
  "nome": "Minha instância",
  "identificador": "instancia-maria",
  "identificadorSecundario": null,
  "token": "evo_token_xyz",
  "tokenExpiracao": null,
  "configuracaoJson": null
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexão criada com sucesso.",
  "dados": {
    "conexaoPlataformaId": 5,
    "branchId": 5,
    "plataforma": 2,
    "status": 1,
    "nome": "Minha instância",
    "identificador": "instancia-maria",
    "identificadorSecundario": null,
    "tokenExpiracao": null,
    "configuracaoJson": null,
    "conexaoCreatedat": "2026-06-04T10:05:00",
    "conexaoUpdatedat": "2026-06-04T10:05:00",
    "usuarioAtribuidoId": 12,
    "usuarioAtribuidoNome": "Maria Oliveira"
  }
}
```

**Response 400 (não-admin com multi OFF):**
```json
{
  "sucesso": false,
  "mensagem": "Multi-conexão não está habilitado para esta empresa.",
  "dados": null
}
```

---

### PUT `/api/ConexaoPlataforma/Atualizar`

Atualiza dados de uma conexão existente.

**Body:**
```json
{
  "conexaoPlataformaId": 4,
  "nome": "Instância Vendas Atualizada",
  "token": "evo_token_novo",
  "tokenExpiracao": null,
  "configuracaoJson": null,
  "status": 1
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `conexaoPlataformaId` | `int` | sim | ID da conexão a atualizar |
| `nome` | `string` | sim | Novo nome amigável |
| `token` | `string?` | não | Novo token |
| `tokenExpiracao` | `datetime?` | não | Nova data de expiração |
| `configuracaoJson` | `string?` | não | Novo JSON de configuração |
| `status` | `int` | sim | Valor do enum `StatusConexaoEnum` |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexão atualizada com sucesso.",
  "dados": null
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Conexão não encontrada.",
  "dados": null
}
```

---

### DELETE `/api/ConexaoPlataforma/Remover/{id}`

Remove (soft delete) uma conexão sem validação de perfil. Usado por fluxos internos. O front-end deve usar `RemoverComPermissao`.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID da conexão |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexão removida com sucesso.",
  "dados": null
}
```

---

### DELETE `/api/ConexaoPlataforma/RemoverComPermissao/{id}`

Remove (soft delete) uma conexão com validação de perfil de usuário.

| Cenário | Comportamento |
|---------|--------------|
| Admin (`role == "1"`) | Pode remover qualquer conexão da empresa |
| Não-admin | Pode remover apenas suas próprias conexões (`UsuarioAtribuidoId == usuarioId`) |

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID da conexão |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conexão removida com sucesso.",
  "dados": null
}
```

**Response 400 (sem permissão):**
```json
{
  "sucesso": false,
  "mensagem": "Você não tem permissão para remover esta conexão.",
  "dados": null
}
```

**Response 400 (não encontrada):**
```json
{
  "sucesso": false,
  "mensagem": "Conexão não encontrada.",
  "dados": null
}
```

---

### PATCH `/api/ConexaoPlataforma/{conexaoId}/atribuir-usuario`

Atribui ou desatribui um usuário de uma conexão. Requer que `MultiWhatsappHabilitado` esteja ativo na empresa (ao atribuir).

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `conexaoId` | `int` | ID da conexão |

**Body:**
```json
{
  "userId": 12
}
```

Para desatribuir (voltar ao modo compartilhado), enviar `null`:
```json
{
  "userId": null
}
```

**Response 200 (atribuição):**
```json
{
  "sucesso": true,
  "mensagem": "Usuário atribuído à conexão com sucesso.",
  "dados": null
}
```

**Response 200 (desatribuição):**
```json
{
  "sucesso": true,
  "mensagem": "Conexão retornada ao modo compartilhado.",
  "dados": null
}
```

**Response 400 (multi desabilitado):**
```json
{
  "sucesso": false,
  "mensagem": "Multi-WhatsApp não está habilitado para esta empresa.",
  "dados": null
}
```

**Response 400 (usuário de outra empresa):**
```json
{
  "sucesso": false,
  "mensagem": "Usuário não encontrado nesta empresa.",
  "dados": null
}
```

---

## Resumo dos Endpoints

| Método | Rota | Descrição | Uso recomendado |
|--------|------|-----------|-----------------|
| `GET` | `/BuscarTodos` | Todas as conexões da empresa | Fluxos internos |
| `GET` | `/BuscarConexoesAtivas` | Listagem contextual por perfil | **Front-end** |
| `GET` | `/BuscarPorPlataforma/{plataforma}` | Filtrado por plataforma | Fluxos internos |
| `GET` | `/BuscarPorId/{id}` | Conexão por ID | Front-end / interno |
| `POST` | `/Criar` | Criar sem validação de perfil | Fluxos internos |
| `POST` | `/CriarComPermissao` | Criar com validação de perfil | **Front-end** |
| `PUT` | `/Atualizar` | Atualizar conexão | Front-end / interno |
| `DELETE` | `/Remover/{id}` | Remover sem validação de perfil | Fluxos internos |
| `DELETE` | `/RemoverComPermissao/{id}` | Remover com validação de perfil | **Front-end** |
| `PATCH` | `/{conexaoId}/atribuir-usuario` | Atribuir/desatribuir usuário | Front-end (admin) |
