# Autenticação — Login, Refresh Token e Logout

> Endpoints do `AuthController` (`/api/auth`). Os tokens são retornados no corpo da resposta **e** definidos automaticamente em cookies HTTP (`jwt-token` e `refresh-token`).

---

## POST /api/auth/Login

Autentica o usuário e inicia a sessão.

### Request

```http
POST /api/auth/Login
Content-Type: application/json
```

```json
{
  "email": "usuario@empresa.com",
  "password": "minhasenha123"
}
```

### Response — 200 OK

```json
{
  "message": "Login bem-sucedido!"
}
```

Cookies definidos na resposta:

| Cookie | Conteúdo | Expiração | Flags |
|--------|----------|-----------|-------|
| `jwt-token` | Access token JWT | 1 hora | HttpOnly, Secure, SameSite=None |
| `refresh-token` | Refresh token | 7 dias | HttpOnly, Secure, SameSite=None |

### Response — 401 Unauthorized (credenciais inválidas)

```json
{
  "message": "Credenciais inválidas."
}
```

### Response — 500 Internal Server Error

```json
{
  "message": "Erro interno no servidor."
}
```

---

## POST /api/auth/refresh-token

Renova o access token usando o refresh token. Lê `jwt-token` e `refresh-token` automaticamente dos cookies da requisição — não recebe body.

### Request

```http
POST /api/auth/refresh-token
Cookie: jwt-token=<access_token_expirado>; refresh-token=<refresh_token>
```

### Response — 200 OK

```json
{
  "message": "Sessão renovada com sucesso!"
}
```

Os cookies `jwt-token` e `refresh-token` são atualizados com os novos tokens (rotação). O refresh token anterior é marcado como usado e invalidado — não pode ser reutilizado.

### Response — 401 Unauthorized

Retornado quando os tokens não estão presentes nos cookies, quando o refresh token é inválido/expirado/já utilizado, ou quando o access token possui assinatura/issuer/audience inválidos. Em todos os casos os cookies `jwt-token` e `refresh-token` são limpos.

```json
{
  "message": "Sessão expirada, faça login novamente."
}
```

```json
{
  "message": "Tokens não encontrados nos cookies."
}
```

### Response — 500 Internal Server Error

```json
{
  "message": "Erro interno no servidor."
}
```

---

## POST /api/auth/logout

> Requer autenticação (`[Authorize]`).

Invalida o refresh token da sessão atual e limpa os cookies de autenticação.

### Request

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
Cookie: refresh-token=<refresh_token>
```

### Response — 200 OK

```json
{
  "message": "Logout realizado com sucesso."
}
```

Os cookies `jwt-token` e `refresh-token` são removidos (expiração definida no passado).

---

## GET /api/auth/Me

> Requer autenticação (`[Authorize]`).

Retorna os dados do usuário autenticado extraídos do token JWT.

### Request

```http
GET /api/auth/Me
Authorization: Bearer <access_token>
```

### Response — 200 OK

```json
{
  "id": "12",
  "email": "usuario@empresa.com",
  "nome": "Fulano da Silva",
  "role": "2",
  "tipoUsuarioDescricao": "Administrador",
  "empresaDescricao": "Empresa Exemplo Ltda",
  "permissoes": ["painel", "chat", "produto"],
  "photoUrl": "https://api.exemplo.com/api/media/usuarios/12/foto.jpg"
}
```

### Response — 401 Unauthorized

```json
"Token inválido ou usuário não autenticado."
```

---

## Notas de Segurança (rotação de refresh token)

- A rotação do refresh token é **atômica**: a marcação `used=true`/`invalidated=true` é feita em um único `UPDATE` condicional (`WHERE used=false AND invalidated=false`). Se duas requisições de refresh chegarem simultaneamente com o mesmo refresh token, apenas uma terá sucesso — a outra recebe `401` com "Sessão expirada, faça login novamente.".
- O `GetPrincipalFromExpiredToken` (usado no refresh) agora valida `Issuer` e `Audience` do access token, além da assinatura.
- Falhas no refresh sempre limpam os cookies `jwt-token` e `refresh-token`, evitando loops de erro por cookies inválidos persistentes.
