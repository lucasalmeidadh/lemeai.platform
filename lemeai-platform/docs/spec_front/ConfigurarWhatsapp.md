# ConfigurarWhatsapp — Documentação de Endpoints

Base URL: `/api/ConfigurarWhatsapp`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
`empresaId` e `role` são extraídos automaticamente do token JWT.

---

## GET `/api/ConfigurarWhatsapp/Status`

Retorna as configurações de integração WhatsApp da empresa: quais conexões estão ativas, se multi-conexão está habilitado, etc.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Configurações obtidas com sucesso.",
  "dados": {
    "multiWhatsappHabilitado": true,
    "conexoes": [
      {
        "conexaoPlataformaId": 1,
        "plataforma": 1,
        "status": 1,
        "nome": "WhatsApp Principal",
        "identificador": "5511999990000",
        "usuarioAtribuidoId": null,
        "usuarioAtribuidoNome": null
      },
      {
        "conexaoPlataformaId": 2,
        "plataforma": 2,
        "status": 1,
        "nome": "Evolution Vendas",
        "identificador": "instancia-vendas",
        "usuarioAtribuidoId": 12,
        "usuarioAtribuidoNome": "João Silva"
      }
    ]
  }
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao obter configurações.",
  "dados": null
}
```

---

## GET `/api/ConfigurarWhatsapp/MetaConfig`

Retorna o `AppId` e o `ConfigurationId` do aplicativo Meta configurados no servidor. Usado pelo front-end para iniciar o fluxo de conexão embedded via Meta (Coexistência).

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Configurações de coexistência obtidas com sucesso.",
  "dados": {
    "appId": "1234567890123456",
    "configurationId": "987654321098765"
  }
}
```

> Este endpoint não filtra por empresa — retorna as credenciais globais do app Meta cadastradas em `appsettings.json`.

---

## POST `/api/ConfigurarWhatsapp/Coexistencia`

Finaliza o fluxo de conexão WhatsApp Business via Meta Embedded Signup. O front-end obtém o `code` do popup Meta e envia junto com os dados do número selecionado.

**Auto-atribuição:** se `MultiWhatsappHabilitado == true` na empresa, a conexão criada/atualizada é automaticamente atribuída ao usuário do token (`UsuarioAtribuidoId = usuarioId`). Se multi estiver OFF, a conexão fica compartilhada (`UsuarioAtribuidoId = null`).

**Body:**
```json
{
  "code": "AQD...",
  "phoneNumberId": "107648382031235",
  "wabaId": "109123456789012",
  "phoneNumber": "+5511999990000"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `code` | `string` | sim | Código de autorização retornado pelo popup Meta |
| `phoneNumberId` | `string` | sim | ID do número de telefone na Meta Business |
| `wabaId` | `string` | sim | ID da conta WhatsApp Business (WABA) |
| `phoneNumber` | `string?` | não | Número de telefone formatado (exibição) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "WhatsApp configurado com sucesso.",
  "dados": {
    "conexaoPlataformaId": 1,
    "plataforma": 1,
    "status": 1,
    "nome": "+5511999990000",
    "identificador": "107648382031235",
    "identificadorSecundario": "109123456789012",
    "tokenExpiracao": null,
    "conexaoCreatedat": "2026-06-04T10:00:00",
    "conexaoUpdatedat": "2026-06-04T10:00:00",
    "usuarioAtribuidoId": null,
    "usuarioAtribuidoNome": null
  }
}
```

**Response 400 (código inválido ou expirado):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao trocar código por token com a Meta.",
  "dados": null
}
```

---

## PATCH `/api/ConfigurarWhatsapp/MultiWhatsapp`

Habilita ou desabilita o modo multi-conexão para a empresa. **Restrito a admin** (`role == "1"`). Não-admins recebem `403 Forbidden`.

A flag `MultiWhatsappHabilitado` controla o comportamento de listagem e criação de conexões para WhatsApp (Meta e Evolution) e Instagram.

**Body:**
```json
{
  "habilitado": true
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `habilitado` | `bool` | sim | `true` para ativar multi-conexão, `false` para desativar |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Multi-WhatsApp habilitado com sucesso.",
  "dados": null
}
```

**Response 403 (não-admin):**  
Retornado diretamente pelo ASP.NET Core — sem body JSON.

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao configurar multi-WhatsApp.",
  "dados": null
}
```

---

## Resumo dos Endpoints

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| `GET` | `/Status` | Status e conexões ativas da empresa | Todos autenticados |
| `GET` | `/MetaConfig` | AppId e ConfigurationId do app Meta | Todos autenticados |
| `POST` | `/Coexistencia` | Conectar número WhatsApp via Meta Embedded Signup | Todos autenticados |
| `PATCH` | `/MultiWhatsapp` | Habilitar/desabilitar multi-conexão | **Somente admin** (`role == "1"`) |
