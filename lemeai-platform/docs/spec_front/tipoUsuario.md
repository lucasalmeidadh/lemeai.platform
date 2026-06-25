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

## GET `/api/TipoUsuario/ImpactoExclusao/{id}`

Retorna os usuários e as permissões que serão afetados caso este tipo de usuário seja excluído, além de indicar se a exclusão é permitida. **Deve ser chamado pelo frontend antes de confirmar a exclusão**, para montar uma tela de confirmação (ex.: "Ao excluir este perfil, X usuário(s) e Y permissão(ões) também serão removidos") ou desabilitar a ação quando `podeExcluir` for `false`. Exige que o tipo pertença à empresa do usuário autenticado.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID do tipo de usuário (`TypeuserId`) |

**Request:** sem body.

**Response 200 (com impacto, exclusão permitida):**
```json
{
  "sucesso": true,
  "mensagem": "Impacto da exclusão calculado com sucesso.",
  "dados": {
    "tipoUsuarioId": 7,
    "tipoUsuarioNome": "Vendedor",
    "podeExcluir": true,
    "motivoBloqueio": null,
    "usuarios": [
      { "userId": 12, "userName": "Maria Silva", "userEmail": "maria@empresa.com" },
      { "userId": 15, "userName": "João Souza", "userEmail": "joao@empresa.com" }
    ],
    "permissoes": [
      { "idPermissao": 3, "nomePermissao": "chat", "nomeTela": "Chat" },
      { "idPermissao": 5, "nomePermissao": "painel", "nomeTela": "Painel" }
    ]
  }
}
```

**Response 200 (sem nenhum impacto — tipo sem usuários/permissões vinculados):**
```json
{
  "sucesso": true,
  "mensagem": "Impacto da exclusão calculado com sucesso.",
  "dados": {
    "tipoUsuarioId": 9,
    "tipoUsuarioNome": "Suporte",
    "podeExcluir": true,
    "motivoBloqueio": null,
    "usuarios": [],
    "permissoes": []
  }
}
```

> Listas vazias **não** são tratadas como erro — é o caso normal de um tipo de usuário recém-criado, sem ninguém vinculado ainda.

**Response 200 (perfil Administrador — exclusão bloqueada):**
```json
{
  "sucesso": true,
  "mensagem": "Impacto da exclusão calculado com sucesso.",
  "dados": {
    "tipoUsuarioId": 4,
    "tipoUsuarioNome": "Administrador",
    "podeExcluir": false,
    "motivoBloqueio": "O perfil Administrador não pode ser excluído. Toda empresa precisa manter pelo menos um.",
    "usuarios": [
      { "userId": 1, "userName": "Dono da Conta", "userEmail": "dono@empresa.com" }
    ],
    "permissoes": [
      { "idPermissao": 1, "nomePermissao": "gerenciar_usuarios", "nomeTela": "Usuários" }
    ]
  }
}
```

> O bloqueio é identificado pelo campo `codigo`/`TypeuserCodigo` (`1` = Administrador), não pelo nome — o nome do perfil pode ter sido alterado via `PUT /api/TipoUsuario/Atualizar/{id}`. Mesmo bloqueada, a resposta continua trazendo `usuarios`/`permissoes` (informativo); o frontend deve usar `podeExcluir` para decidir se habilita a ação.

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

## DELETE `/api/TipoUsuario/Deletar/{id}`

Remove um tipo de usuário **e cascateia a exclusão** sobre os usuários e permissões vinculados a ele. Exige que o tipo pertença à empresa do usuário autenticado. **O perfil Administrador nunca pode ser excluído** — toda empresa deve manter pelo menos esse perfil sempre.

Ordem da cascata (quando não é o Administrador):
1. Todos os `Usuario` com esse `TypeuserId` (na mesma empresa, ainda não deletados) são **soft-deletados** (`UserDeleted = true`) e perdem o vínculo com o tipo (`UserTypeuserid = null`).
2. Todos os vínculos de permissão (`PermissaoUsuario`/`user_permission`) desse tipo são removidos fisicamente (tabela de junção, sem soft delete).
3. O `TipoUsuario` é removido (remoção física — divergência conhecida do padrão de soft delete do projeto, documentada em `docs/tipo-usuario-por-empresa/especificacao.md`).

> Recomenda-se sempre chamar `GET /api/TipoUsuario/ImpactoExclusao/{id}` antes deste endpoint — além de mostrar o impacto, ele já indica antecipadamente (`podeExcluir`) se a exclusão será bloqueada.

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

**Response 400 (é o perfil Administrador):**
```json
{
  "sucesso": false,
  "mensagem": "O perfil Administrador não pode ser excluído. Toda empresa precisa manter pelo menos um.",
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
| `GET` | `/api/TipoUsuario/ImpactoExclusao/{id}` | Lista os usuários e permissões que serão afetados ao excluir o tipo — chamar antes de `Deletar` | Autenticado |
| `DELETE` | `/api/TipoUsuario/Deletar/{id}` | Remove o tipo de usuário cascateando: soft delete dos usuários vinculados + remoção dos vínculos de permissão | Autenticado |
