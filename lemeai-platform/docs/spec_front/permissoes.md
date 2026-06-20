# Permissões — Documentação de Endpoints

Duas controllers compõem o módulo de permissões:

| Controller | Base URL | Para que serve |
|------------|----------|-----------------|
| [`PermissaoController`](#permissaocontroller-catálogo-global) | `/api/Permissao` | CRUD do **catálogo global** de permissões (as "telas" do sistema) |
| [`PermissaoAcessoController`](#permissaoacessocontroller-vínculo-perfilpermissão) | `/api/PermissaoAcesso` | Consulta e configuração de **quais permissões cada perfil (`TipoUsuario`) possui**, por empresa |

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).

---

## `PermissaoController` (catálogo global)

Protegida por `[Authorize(Policy = "GBCodeAdminPolicy")]` — **somente administradores do sistema LemeIA** (equipe interna), não os clientes. O catálogo é global: as mesmas permissões/telas existem para todas as empresas, e cada uma decide o que cada perfil pode acessar (ver `PermissaoAcessoController`).

Não existe endpoint de remoção — decisão de produto. Uma permissão que deixa de ser usada deve ter seus vínculos removidos manualmente em `PermissaoAcesso`, mas permanece no catálogo.

### GET `/api/Permissao/BuscarTodos`

Lista todas as permissões cadastradas no catálogo global.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Permissões encontradas com sucesso!",
  "dados": [
    {
      "idPermissao": 1,
      "nomePermissao": "produto",
      "nomeTela": "Produtos"
    },
    {
      "idPermissao": 2,
      "nomePermissao": "gerenciar_permissoes",
      "nomeTela": "Gestão de Permissões"
    }
  ]
}
```

---

### GET `/api/Permissao/BuscarPorId/{id}`

Busca uma permissão específica do catálogo.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID da permissão (`PermissionId`) |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Permissão encontrada.",
  "dados": {
    "idPermissao": 1,
    "nomePermissao": "produto",
    "nomeTela": "Produtos"
  }
}
```

**Response 400 (não encontrada):**
```json
{
  "sucesso": false,
  "mensagem": "Permissão não encontrada.",
  "dados": null
}
```

---

### POST `/api/Permissao/Criar`

Cria uma nova permissão (tela) no catálogo global.

> **Atenção:** criar uma permissão aqui só tem efeito de bloqueio real em algum endpoint se um desenvolvedor também mapear uma `Policy` correspondente em `Program.cs` usando o mesmo `nome`. Sem isso, a permissão é "decorativa" — aparece na configuração de perfis, mas não restringe nenhuma rota.

**Body:**
```json
{
  "nome": "relatorios",
  "nomeTela": "Relatórios"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | `string` | sim | Código técnico da permissão (`PermissionName`), usado nas claims/policies |
| `nomeTela` | `string` | sim | Nome amigável exibido no front-end (`PermissionPageName`) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Permissão criada com sucesso.",
  "dados": {
    "idPermissao": 6,
    "nomePermissao": "relatorios",
    "nomeTela": "Relatórios"
  }
}
```

**Response 400 (nome duplicado):**
```json
{
  "sucesso": false,
  "mensagem": "Já existe uma permissão com este nome.",
  "dados": null
}
```

---

### PUT `/api/Permissao/Atualizar`

Atualiza o nome técnico e/ou o nome de tela de uma permissão existente no catálogo.

**Body:**
```json
{
  "permissaoId": 6,
  "nome": "relatorios_avancados",
  "nomeTela": "Relatórios Avançados"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `permissaoId` | `int` | sim | ID da permissão a atualizar |
| `nome` | `string` | sim | Novo código técnico (`PermissionName`) |
| `nomeTela` | `string` | sim | Novo nome amigável (`PermissionPageName`) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Permissão atualizada com sucesso.",
  "dados": null
}
```

**Response 400 (não encontrada):**
```json
{
  "sucesso": false,
  "mensagem": "Permissão não encontrada.",
  "dados": null
}
```

---

## `PermissaoAcessoController` (vínculo perfil↔permissão)

Acessível por qualquer usuário autenticado (`[Authorize]`). Cada empresa configura, para cada perfil (`TipoUsuario` — Administrador, Vendedor, Serviço etc.), quais permissões do catálogo global ele possui. O vínculo é escopado por empresa (`BranchId`); o catálogo consultado em `TiposPermissoes` é o mesmo para todas as empresas.

### GET `/api/PermissaoAcesso/PermissoesPorTipoUsuario/{tipoUsuario}`

Lista as permissões vinculadas a um perfil, dentro da empresa do usuário autenticado (token).

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `tipoUsuario` | `int` | ID do perfil (`TipoUsuarioEnum`: `1` Administrador, `2` Vendedor, `3` Serviço) |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Permissões encontradas com sucesso!",
  "dados": {
    "tipoUsuario": 2,
    "permissoes": [
      {
        "idPermissao": 1,
        "nomePermissao": "produto",
        "nomeTela": "Produtos"
      },
      {
        "idPermissao": 3,
        "nomePermissao": "chat",
        "nomeTela": "Chat"
      }
    ]
  }
}
```

**Response 400 (nenhuma permissão vinculada):**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma permissão encontrada para esse tipo de usuário!",
  "dados": null
}
```

---

### GET `/api/PermissaoAcesso/TiposPermissoes`

Lista o catálogo completo de permissões disponíveis (global — igual para todas as empresas). Usado pelo front-end para montar a tela de configuração de perfis.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Permissões encontradas com sucesso!",
  "dados": [
    {
      "idPermissao": 1,
      "nomePermissao": "produto",
      "nomeTela": "Produtos"
    },
    {
      "idPermissao": 2,
      "nomePermissao": "gerenciar_permissoes",
      "nomeTela": "Gestão de Permissões"
    },
    {
      "idPermissao": 3,
      "nomePermissao": "chat",
      "nomeTela": "Chat"
    }
  ]
}
```

---

### PATCH `/api/PermissaoAcesso/PermissoesPorTipoUsuario`

Substitui (diff) o conjunto de permissões de um perfil, dentro da empresa do token. Envia a lista completa de permissões desejadas — o backend calcula o que precisa ser adicionado e removido e aplica tudo em uma única transação.

Os `IdPermissao` enviados são validados contra o catálogo global antes de qualquer alteração; se algum ID não existir, nada é persistido.

**Body:**
```json
{
  "tipoUsuario": 2,
  "permissoes": [
    { "idPermissao": 1 },
    { "idPermissao": 3 }
  ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipoUsuario` | `int` | sim | ID do perfil a configurar (`TipoUsuarioEnum`) |
| `permissoes` | `array` | sim | Lista final de permissões que o perfil deve ter (substitui a anterior) |
| `permissoes[].idPermissao` | `int` | sim | ID da permissão no catálogo global |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Permissões atualizadas",
  "dados": null
}
```

**Response 400 (id inexistente no catálogo):**
```json
{
  "sucesso": false,
  "mensagem": "Permissão(ões) inexistente(s) no catálogo: 99, 100",
  "dados": null
}
```

---

## Resumo dos Endpoints

| Controller | Método | Rota | Descrição | Acesso |
|------------|--------|------|-----------|--------|
| `Permissao` | `GET` | `/BuscarTodos` | Lista o catálogo global de permissões | `GBCodeAdminPolicy` |
| `Permissao` | `GET` | `/BuscarPorId/{id}` | Busca uma permissão do catálogo | `GBCodeAdminPolicy` |
| `Permissao` | `POST` | `/Criar` | Cria uma nova permissão no catálogo | `GBCodeAdminPolicy` |
| `Permissao` | `PUT` | `/Atualizar` | Atualiza nome técnico/tela de uma permissão | `GBCodeAdminPolicy` |
| `PermissaoAcesso` | `GET` | `/PermissoesPorTipoUsuario/{tipoUsuario}` | Permissões vinculadas a um perfil, na empresa do token | Autenticado |
| `PermissaoAcesso` | `GET` | `/TiposPermissoes` | Catálogo global (consulta, sem CRUD) | Autenticado |
| `PermissaoAcesso` | `PATCH` | `/PermissoesPorTipoUsuario` | Substitui (diff) as permissões de um perfil, na empresa do token | Autenticado |

> Ao criar uma nova empresa, o perfil `Administrador` (`TipoUsuarioEnum = 1`) recebe automaticamente **todas** as permissões do catálogo global — os demais perfis nascem sem nenhuma, e precisam ser configurados manualmente via `PATCH /api/PermissaoAcesso/PermissoesPorTipoUsuario`.
