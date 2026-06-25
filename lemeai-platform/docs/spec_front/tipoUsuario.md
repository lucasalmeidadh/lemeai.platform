# Tipo de Usuário — Documentação de Endpoints

CRUD dos perfis/papéis de usuário (`TipoUsuario` / tabela `typeuser`). Cada empresa tem seu próprio conjunto de tipos — não existe mais tipo global compartilhado entre empresas.

Controller: `TipoUsuarioController` — base URL `/api/TipoUsuario`. Protegida por `[Authorize]` (qualquer usuário autenticado). Todos os endpoints requerem `Authorization: Bearer <token>` e operam sempre dentro da empresa do usuário autenticado (`empresaId` extraído do token — nunca recebido por parâmetro).

---

## GET `/api/TipoUsuario/BuscarTodos`

Lista todos os tipos de usuário (perfis) cadastrados na empresa do usuário autenticado.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tipos de usuário encontrados com sucesso.",
  "dados": [
    {
      "id": 4,
      "nome": "Administrador",
      "codigo": 1,
      "canReceiveLead": true
    },
    {
      "id": 5,
      "nome": "Vendedor",
      "codigo": null,
      "canReceiveLead": true
    },
    {
      "id": 6,
      "nome": "Suporte",
      "codigo": null,
      "canReceiveLead": false
    }
  ]
}
```

**Response 400 (erro inesperado):**
```json
{
  "sucesso": false,
  "mensagem": "Ocorreu um erro ao buscar os tipos de usuário.",
  "dados": null
}
```

---

## POST `/api/TipoUsuario/Criar`

Cria um novo tipo de usuário (perfil) na empresa do usuário autenticado.

**Body:**
```json
{
  "nome": "Vendedor",
  "canReceiveLead": true
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | `string` | sim | Nome do perfil (`TypeuserNome`). Único por empresa. |
| `canReceiveLead` | `bool` | sim | Se usuários desse tipo participam do rodízio de leads (`UsuariosVendedores`) |

> Não existe campo `codigo` no request. `TypeuserCodigo` nasce sempre `null` em tipos criados pela API — só é definido como `1` (Administrador) pelo seed automático ao criar a empresa, ou manualmente no banco para `2` (Serviço).

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Perfil criado com sucesso.",
  "dados": {
    "id": 7,
    "nome": "Vendedor",
    "codigo": null,
    "canReceiveLead": true
  }
}
```

**Response 400 (erro inesperado, ex.: nome duplicado na empresa):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao criar perfil de usuário, tente novamente.",
  "dados": null
}
```

---

## PUT `/api/TipoUsuario/Atualizar/{id}`

Atualiza o nome e/ou a flag `canReceiveLead` de um tipo de usuário existente. Exige que o tipo pertença à empresa do usuário autenticado.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID do tipo de usuário (`TypeuserId`) |

**Body:**
```json
{
  "nome": "Vendedor Sênior",
  "canReceiveLead": false
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | `string` | sim | Novo nome do perfil |
| `canReceiveLead` | `bool` | sim | Novo valor da flag de rodízio de leads |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Perfil atualizado com sucesso.",
  "dados": {
    "id": 7,
    "nome": "Vendedor Sênior",
    "codigo": null,
    "canReceiveLead": false
  }
}
```

**Response 400 (não encontrado):**
```json
{
  "sucesso": false,
  "mensagem": "Perfil não encontrado.",
  "dados": null
}
```

**Response 400 (pertence a outra empresa):**
```json
{
  "sucesso": false,
  "mensagem": "Acesso não autorizado.",
  "dados": null
}
```

> Atenção ao desmarcar `canReceiveLead` do perfil "Administrador": se nenhum outro tipo da empresa tiver a flag marcada, o rodízio de leads (`UsuariosVendedores`) deixa de retornar qualquer usuário e os leads novos caem no fallback hardcoded (`UserId = 1`).

---

## DELETE `/api/TipoUsuario/Deletar/{id}`

Remove um tipo de usuário. Exige que o tipo pertença à empresa do usuário autenticado.

> Remoção é física (`DELETE`), não soft delete — diverge do padrão do projeto, é um bug pré-existente e conhecido (fora do escopo da feature de multi-tenancy). Falha com erro genérico se houver usuários vinculados (`UserTypeuserid`) por violação de FK.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID do tipo de usuário (`TypeuserId`) |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Perfil removido com sucesso.",
  "dados": null
}
```

**Response 400 (não encontrado):**
```json
{
  "sucesso": false,
  "mensagem": "Perfil não encontrado.",
  "dados": null
}
```

**Response 400 (pertence a outra empresa):**
```json
{
  "sucesso": false,
  "mensagem": "Acesso não autorizado.",
  "dados": null
}
```

---

## Campo `codigo` — significado

| Valor | Significado |
|-------|-------------|
| `1` | Administrador — seedado automaticamente na criação da empresa |
| `2` | Serviço — atribuído apenas manualmente no banco (ex.: conta da IA/bot) |
| `null` | Tipo comum/customizado, sem papel especial (ex.: "Vendedor", "Suporte") |

Campo somente leitura: não existe no body de `Criar`/`Atualizar`. Representado em C# pelo enum `TipoUsuarioCodigoEnum`.

---

## Resumo dos Endpoints

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| `GET` | `/api/TipoUsuario/BuscarTodos` | Lista os tipos de usuário da empresa do token | Autenticado |
| `POST` | `/api/TipoUsuario/Criar` | Cria um tipo de usuário na empresa do token | Autenticado |
| `PUT` | `/api/TipoUsuario/Atualizar/{id}` | Atualiza nome/`canReceiveLead`, validando que pertence à empresa do token | Autenticado |
| `DELETE` | `/api/TipoUsuario/Deletar/{id}` | Remove (hard delete) um tipo de usuário, validando que pertence à empresa do token | Autenticado |
