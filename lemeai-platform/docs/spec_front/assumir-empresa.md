# Assumir Empresa (Modo Suporte) — Documentação de Endpoints

Permite que um usuário com a permissão `gbcode_admin_sistema` (admin global do LemeIA) gere uma sessão autenticada como administrador de **outra empresa**, para fins de suporte/diagnóstico na plataforma.

Controller: `AdministrarEmpresasController` — base URL `/api/AdministrarEmpresas`. Protegida por `[Authorize(Policy = "GBCodeAdminPolicy")]` + validação adicional de que `empresaId` do token do solicitante é `1` (empresa interna do GBCode). Todos os endpoints requerem `Authorization: Bearer <token>` do admin global.

> A autenticação do LemeIA é toda baseada em **cookies HttpOnly** (`jwt-token`/`refresh-token`, ver [login.md](login.md)) — o frontend nunca lê ou armazena o token manualmente, o browser envia o cookie automaticamente em cada request. Por isso `AssumirControleEmpresa` segue o mesmo padrão do `Login`: ao ter sucesso, **sobrescreve os cookies `jwt-token`/`refresh-token`** com os tokens do administrador da empresa alvo. A partir dessa chamada, toda requisição do browser passa a ser autenticada como esse administrador — é uma **troca de sessão real**, não uma sessão paralela.
>
> O endpoint também **invalida o refresh token atual do admin global** (mesma lógica do `Logout`) antes de gerar a nova sessão, para não deixar uma sessão de admin de sistema esquecida e renovável em paralelo enquanto durar o suporte.
>
> **Como voltar para a própria conta:** não é preciso guardar nada no frontend. O backend grava no próprio JWT impersonado a claim `impersonatedBy` (o `UserId` do admin global). Para voltar, basta chamar `POST /api/auth/encerrar-suporte` — o backend lê essa claim do token atual, reconstrói um token novo para o admin original (revalidando que ele ainda existe, está ativo e ainda tem a permissão `gbcode_admin_sistema`) e sobrescreve os cookies de novo. Nenhum token precisa transitar pelo frontend em nenhum momento.

Fluxo recomendado:
1. `GET /BuscarAdministradoresAtivos/{empresaId}` — listar os administradores ativos da empresa alvo.
2. `POST /AssumirControleEmpresa` — escolher um dos administradores retornados e gerar a sessão.
3. `GET /api/auth/Me` — usar normalmente durante a sessão de suporte; o campo `emModoSuporte` indica que a sessão atual é impersonada (útil inclusive após um F5, já que o estado vive no cookie, não em memória do frontend).
4. `POST /api/auth/encerrar-suporte` — quando o suporte terminar, retorna a sessão ao admin global.

---

## GET `/api/AdministrarEmpresas/BuscarAdministradoresAtivos/{empresaId}`

Lista os usuários ativos do tipo "Administrador" da empresa informada.

**Request:** sem body.

```http
GET /api/AdministrarEmpresas/BuscarAdministradoresAtivos/42
Authorization: Bearer <token_admin_global>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Administradores encontrados.",
  "dados": [
    {
      "userId": 18,
      "userName": "Maria Souza",
      "userEmail": "maria@empresacliente.com",
      "userBranchid": 42,
      "branchName": "Empresa Cliente Ltda",
      "userTypeuserid": 7,
      "userDeleted": false,
      "photoUrl": null
    }
  ]
}
```

**Response 400 — empresa não encontrada:**
```json
{
  "sucesso": false,
  "mensagem": "Empresa não encontrada.",
  "dados": null
}
```

**Response 400 — sem administrador ativo:**
```json
{
  "sucesso": false,
  "mensagem": "Nenhum administrador ativo encontrado para esta empresa.",
  "dados": null
}
```

**Response 403:** retornado quando o solicitante não pertence à empresa `1` (admin global) — checagem feita por `ValidarAcesso()`.

---

## POST `/api/AdministrarEmpresas/AssumirControleEmpresa`

Troca a sessão atual (cookies) pela sessão do administrador escolhido da empresa alvo.

**Body:**
```json
{
  "empresaId": 42,
  "usuarioId": 18
}
```

```http
POST /api/AdministrarEmpresas/AssumirControleEmpresa
Authorization: Bearer <token_admin_global>
Cookie: jwt-token=<token_admin_global>; refresh-token=<refresh_token_admin_global>
Content-Type: application/json
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Controle da empresa assumido com sucesso.",
  "dados": {
    "empresaId": 42,
    "usuarioId": 18,
    "nomeUsuario": "Maria Souza"
  }
}
```

Os tokens **não aparecem no corpo da resposta** — assim como no `Login`, eles são gravados diretamente nos cookies `jwt-token` (1h) e `refresh-token` (7 dias) da resposta. A partir daqui, o frontend já está autenticado como o administrador da empresa alvo; basta navegar normalmente, sem nenhuma chamada extra.

**Response 400 — usuário inexistente/inativo:**
```json
{
  "sucesso": false,
  "mensagem": "Usuário não encontrado ou inativo.",
  "dados": null
}
```

**Response 400 — usuário não pertence à empresa informada:**
```json
{
  "sucesso": false,
  "mensagem": "Usuário não pertence à empresa informada.",
  "dados": null
}
```

**Response 400 — usuário não é administrador:**
```json
{
  "sucesso": false,
  "mensagem": "Usuário informado não é um administrador da empresa.",
  "dados": null
}
```

**Response 403:** mesma checagem de `ValidarAcesso()` do endpoint acima.

---

## GET `/api/auth/Me` — como o frontend sabe que está em modo suporte

O frontend **não decodifica o JWT** — ele já chama `/api/auth/Me` para saber quem é o usuário logado, e essa é a única fonte de verdade usada hoje. Por isso a claim `impersonatedBy` foi exposta também na resposta desse endpoint, em vez de exigir que o frontend abra o token.

```http
GET /api/auth/Me
Cookie: jwt-token=<token_da_sessao_de_suporte>
```

**Response 200 (sessão normal):**
```json
{
  "id": "18",
  "email": "maria@empresacliente.com",
  "nome": "Maria Souza",
  "role": "7",
  "tipoUsuarioDescricao": "Administrador",
  "empresaDescricao": "Empresa Cliente Ltda",
  "empresaId": 42,
  "permissoes": ["painel", "chat", "produto"],
  "photoUrl": null,
  "logoEmpresa": null,
  "empresaEmTrial": false,
  "assinaturaVencida": false,
  "dataExpiracaoPlano": null,
  "emModoSuporte": false,
  "nomeAdminSuporte": null
}
```

**Response 200 (sessão de suporte ativa):** os mesmos campos de sempre — `id`, `nome`, `permissoes` etc. já são os do administrador da empresa alvo (Maria) — mais dois campos novos:

```json
{
  "...": "...",
  "emModoSuporte": true,
  "nomeAdminSuporte": "João (Admin GBCode)"
}
```

Use `emModoSuporte` para exibir o banner fixo "Modo suporte — sessão assumida por {nomeAdminSuporte}" com um botão "Encerrar suporte". Como esse estado vem do cookie (via JWT), ele sobrevive a um F5 — não depende de nenhum estado guardado em memória/local storage no frontend.

---

## POST `/api/auth/encerrar-suporte`

> Requer apenas autenticação (`[Authorize]`) — **não** exige a policy `GBCodeAdminPolicy`, porque quem chama esse endpoint está autenticado como o administrador da empresa alvo (sem a permissão `gbcode_admin_sistema`), não como o admin global.

Encerra a sessão de suporte atual e devolve a sessão ao admin global que a iniciou.

```http
POST /api/auth/encerrar-suporte
Cookie: jwt-token=<token_da_sessao_de_suporte>; refresh-token=<refresh_token_da_sessao_de_suporte>
```

**Response 200:**
```json
{
  "message": "Sessão de suporte encerrada com sucesso."
}
```

Os cookies `jwt-token`/`refresh-token` são sobrescritos com uma sessão nova do admin global — o refresh token da sessão de suporte é invalidado antes da troca.

**Response 400 — sessão atual não é de suporte (não tem `impersonatedBy`):**
```json
{
  "message": "A sessão atual não é uma sessão de suporte."
}
```

**Response 401 — admin original não existe mais, está inativo, mudou de empresa ou perdeu a permissão `gbcode_admin_sistema`** (revalidado a cada chamada, não confia apenas na claim do token antigo):
```json
{
  "message": "Sessão de suporte inválida. Faça login novamente."
}
```
Nesse caso os cookies são limpos e o usuário precisa fazer login normalmente.

---

## Detalhes do token gerado (claims)

O `accessToken` retornado é um JWT igual ao de um login normal — contém `sub`, `email`, `name`, `role`, `tipoUsuarioCodigo`, `empresaId` (já apontando para a empresa **alvo**) e os claims `permissao` reais do administrador escolhido.

**Importante:** o token impersonado **nunca** contém a claim `permissao=gbcode_admin_sistema`, mesmo que o solicitante seja admin global — as permissões do token são exclusivamente as do usuário-alvo, então a sessão de suporte fica restrita ao escopo da empresa cliente.

Claim adicional exclusiva da impersonação:

| Claim | Valor | Uso |
|-------|-------|-----|
| `impersonatedBy` | `UserId` do admin global que assumiu o controle | Usada pelo backend em `/api/auth/Me` (campo `emModoSuporte`/`nomeAdminSuporte`) e em `/api/auth/encerrar-suporte` para reconstruir a sessão original. O frontend não precisa ler essa claim diretamente. |

---

## Auditoria

Toda chamada bem-sucedida a `AssumirControleEmpresa` e a `encerrar-suporte` gera um log de nível **Warning** (`AdministrarEmpresasService` / `AuthController`) com os IDs envolvidos — não há tabela de auditoria dedicada, a rastreabilidade hoje é feita via log4net.
