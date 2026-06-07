# InstagramConexao — Documentação de Endpoints

Base URL: `/api/instagram`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
`empresaId` é extraído automaticamente do token JWT.

---

## Fluxo de Conexão

```
Front-end → obtém token de curta duração via login Meta
         → POST /api/instagram/conectar { tokenCurtaDuracao }
           → troca por token de longa duração (60 dias)
           → busca páginas Facebook e contas Instagram vinculadas
           → subscreve webhooks (DMs + Lead Ads)
           → salva dois registros em platform_connections:
               ConexaoPlataforma (Instagram): IGID + token
               ConexaoPlataforma (LeadAds):   page_id + token
```

---

## POST `/api/instagram/conectar`

Inicia a conexão Instagram/Facebook para a empresa. Recebe o token de curta duração obtido pelo front-end via Facebook Login e realiza toda a troca e configuração automaticamente.

**Auto-atribuição:** se `MultiWhatsappHabilitado == true` na empresa, as conexões criadas (Instagram + Lead Ads) são automaticamente atribuídas ao usuário do token (`UsuarioAtribuidoId = usuarioId`). Se multi estiver OFF, ficam compartilhadas (`UsuarioAtribuidoId = null`).

**Body:**
```json
{
  "tokenCurtaDuracao": "EAABsbCS1iHgBOZB..."
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tokenCurtaDuracao` | `string` | sim | Token de acesso de curta duração retornado pelo Facebook Login no front-end |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Instagram conectado com sucesso.",
  "dados": [
    {
      "instagramUsername": "minha_empresa",
      "facebookPageId": "109876543210123",
      "facebookPageName": "Minha Empresa Oficial"
    }
  ]
}
```

> `dados` é um array pois uma conta Meta pode ter múltiplas páginas/contas Instagram vinculadas. Cada item corresponde a uma conexão Instagram + Lead Ads criada.

**Response 400 (token inválido):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao trocar token de curta duração.",
  "dados": null
}
```

**Response 400 (sem páginas Instagram vinculadas):**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma conta Instagram Business encontrada para este token.",
  "dados": null
}
```

---

## GET `/api/instagram/status`

Retorna as conexões Instagram ativas para a empresa, incluindo dados de configuração (username, página do Facebook vinculada).

**Request:** sem body.

**Response 200 (com conexão ativa):**
```json
{
  "sucesso": true,
  "mensagem": "Status obtido com sucesso.",
  "dados": [
    {
      "conexaoPlataformaId": 7,
      "plataforma": 3,
      "status": 1,
      "nome": "minha_empresa",
      "identificador": "17841409169671234",
      "tokenExpiracao": "2026-08-03T10:00:00",
      "configuracaoJson": "{\"instagram_username\":\"minha_empresa\",\"facebook_page_id\":\"109876543210123\",\"facebook_page_name\":\"Minha Empresa Oficial\"}",
      "conexaoCreatedat": "2026-06-04T10:00:00",
      "conexaoUpdatedat": "2026-06-04T10:00:00",
      "usuarioAtribuidoId": null,
      "usuarioAtribuidoNome": null
    }
  ]
}
```

**Response 200 (sem conexão):**
```json
{
  "sucesso": true,
  "mensagem": "Status obtido com sucesso.",
  "dados": []
}
```

> O campo `configuracaoJson` contém um JSON serializado com `instagram_username`, `facebook_page_id` e `facebook_page_name` da conta conectada.

---

## DELETE `/api/instagram/desconectar/{paginaId}`

Desconecta uma conta Instagram da empresa. Remove as conexões `Instagram` e `LeadAds` associadas à página e cancela as subscrições de webhook na Meta.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `paginaId` | `string` | ID da página do Facebook vinculada à conta Instagram (campo `facebook_page_id` retornado no status) |

**Request:** sem body.

**Exemplo de chamada:**
```
DELETE /api/instagram/desconectar/109876543210123
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Instagram desconectado com sucesso.",
  "dados": null
}
```

**Response 400 (conexão não encontrada):**
```json
{
  "sucesso": false,
  "mensagem": "Conexão Instagram não encontrada para esta empresa.",
  "dados": null
}
```

**Response 400 (erro ao cancelar webhook):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao cancelar subscrição de webhook.",
  "dados": null
}
```

---

## Resumo dos Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/conectar` | Conectar conta Instagram via token Meta |
| `GET` | `/status` | Verificar conexões Instagram ativas da empresa |
| `DELETE` | `/desconectar/{paginaId}` | Desconectar conta Instagram e cancelar webhooks |
