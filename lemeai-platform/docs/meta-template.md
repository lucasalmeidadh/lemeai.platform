# Meta Templates — Documentação de Endpoints

Base URL: `/api/meta/template`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
O `empresaId` é extraído automaticamente do token JWT — não deve ser enviado pelo cliente.

> **Pré-requisito:** A empresa deve ter uma **ConexaoPlataforma** ativa do tipo `WhatsappMeta` com o `WHATSAPP_BUSINESS_ACCOUNT_ID` (WABA ID) salvo no campo `Identificador` e o token de usuário de sistema salvo em `Token`. O token deve ter a permissão `whatsapp_business_management`.

---

## Índice

1. [GET `/BuscarTodos`](#get-apimetatplatebuscartodos)
2. [GET `/BuscarPorId/{id}`](#get-apimetatplatebuscarporidid)
3. [POST `/Criar`](#post-apimetatemplatecria)
4. [DELETE `/Remover/{id}`](#delete-apimetatemplatereoverid)
5. [POST `/Sincronizar`](#post-apimetatemplateSincronizar)
6. [POST `/UploadMidia`](#post-apimetatemplateuploadmidia)
7. [Exemplos de criação por categoria](#exemplos-de-criação-por-categoria)
8. [Status possíveis de um template](#status-possíveis-de-um-template)
9. [Regras de nomenclatura](#regras-de-nomenclatura)

---

## GET `/api/meta/template/BuscarTodos`

Retorna todos os templates armazenados localmente para a empresa autenticada (cache do banco).  
Use [`POST /Sincronizar`](#post-apimetatemplateSincronizar) antes para garantir dados atualizados.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Templates encontrados.",
  "dados": [
    {
      "metaTemplateId": 1,
      "templateMetaId": "1234567890123456",
      "nome": "confirmacao_agendamento",
      "categoria": "UTILITY",
      "idioma": "pt_BR",
      "status": "APPROVED",
      "qualidade": "HIGH",
      "componentesJson": "[{\"type\":\"BODY\",\"text\":\"Olá, {{1}}! Seu agendamento para {{2}} está confirmado.\"}]",
      "motivoRejeicao": null,
      "sincronizadoEm": "2026-05-23T02:12:00Z",
      "criadoEm": "2026-05-20T10:00:00Z"
    },
    {
      "metaTemplateId": 2,
      "templateMetaId": "9876543210987654",
      "nome": "boas_vindas_marketing",
      "categoria": "MARKETING",
      "idioma": "pt_BR",
      "status": "PENDING",
      "qualidade": null,
      "componentesJson": null,
      "motivoRejeicao": null,
      "sincronizadoEm": null,
      "criadoEm": "2026-05-23T02:00:00Z"
    }
  ]
}
```

**Response 400 (erro interno):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao buscar templates.",
  "dados": null
}
```

---

## GET `/api/meta/template/BuscarPorId/{id}`

Retorna um template específico pelo ID interno (não pelo ID da Meta).

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID interno do template (`metaTemplateId`) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Template encontrado.",
  "dados": {
    "metaTemplateId": 1,
    "templateMetaId": "1234567890123456",
    "nome": "confirmacao_agendamento",
    "categoria": "UTILITY",
    "idioma": "pt_BR",
    "status": "APPROVED",
    "qualidade": "HIGH",
    "componentesJson": "[{\"type\":\"BODY\",\"text\":\"Olá, {{1}}! Seu agendamento para {{2}} está confirmado.\"}]",
    "motivoRejeicao": null,
    "sincronizadoEm": "2026-05-23T02:12:00Z",
    "criadoEm": "2026-05-20T10:00:00Z"
  }
}
```

**Response 400 — template não encontrado:**
```json
{
  "sucesso": false,
  "mensagem": "Template não encontrado.",
  "dados": null
}
```

**Response 400 — template de outra empresa:**
```json
{
  "sucesso": false,
  "mensagem": "Acesso não autorizado.",
  "dados": null
}
```

---

## POST `/api/meta/template/Criar`

Cria um novo template diretamente na API da Meta e registra no banco local com status `PENDING`.  
O template fica disponível para envio somente após aprovação da Meta (pode levar até 24h).

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | `string` | ✅ | Nome único em snake_case (ex: `confirmacao_pedido`). A API converte espaços para `_` automaticamente. |
| `categoria` | `string` | ✅ | `MARKETING`, `UTILITY` ou `AUTHENTICATION` |
| `idioma` | `string` | ✅ | Código de idioma. Padrão: `pt_BR`. Ver [lista completa](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/supported-languages) |
| `textoBody` | `string` | ✅ | Texto principal. Use `{{1}}`, `{{2}}`... para variáveis. |
| `textoHeader` | `string` | ❌ | Texto do cabeçalho (obrigatório se `formatoHeader` for `TEXT`) |
| `formatoHeader` | `string` | ❌ | `TEXT`, `IMAGE`, `VIDEO` ou `DOCUMENT`. Se omitido e `textoHeader` informado, usa `TEXT`. |
| `exemploHeaderHandle` | `string` | ❌ | Handle de mídia de exemplo para `formatoHeader` `IMAGE`, `VIDEO` ou `DOCUMENT`. Obtido via Resumable Upload API da Meta. **Obrigatório pela Meta quando o header for de mídia.** |
| `exemploHeaderTexto` | `string` | ❌ | Texto de exemplo para `formatoHeader` `TEXT` quando o `textoHeader` contiver `{{1}}`. |
| `textoFooter` | `string` | ❌ | Rodapé (sem variáveis). Máx. 60 caracteres. |
| `botoes` | `array` | ❌ | Lista de botões. Máx. 3 botões. |
| `exemplosBody` | `array<string>` | ❌ | Valores de exemplo para as variáveis `{{1}}`, `{{2}}`... — **obrigatório pela Meta quando o body contém variáveis** |

**Objeto `botoes[*]`:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | `string` | ✅ | `URL`, `QUICK_REPLY` ou `PHONE_NUMBER` |
| `texto` | `string` | ✅ | Texto visível no botão. Máx. 25 caracteres. |
| `url` | `string` | ❌ | Obrigatório para tipo `URL` |
| `telefone` | `string` | ❌ | Obrigatório para tipo `PHONE_NUMBER` (formato E.164, ex: `+5511999999999`) |

**Response 200 — criado com sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Template criado com sucesso. Aguardando aprovação da Meta.",
  "dados": {
    "metaTemplateId": 3,
    "templateMetaId": "1122334455667788",
    "nome": "confirmacao_pedido",
    "categoria": "UTILITY",
    "idioma": "pt_BR",
    "status": "PENDING",
    "qualidade": null,
    "componentesJson": null,
    "motivoRejeicao": null,
    "sincronizadoEm": null,
    "criadoEm": "2026-05-23T03:00:00Z"
  }
}
```

**Response 400 — sem conexão WhatsApp ativa:**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma conexão WhatsApp Meta ativa encontrada para esta empresa.",
  "dados": null
}
```

**Response 400 — erro da API Meta:**
```json
{
  "sucesso": false,
  "mensagem": "Erro na API da Meta: (#100) ...",
  "dados": null
}
```

---

## DELETE `/api/meta/template/Remover/{id}`

Remove o template da Meta API e do banco local.  
⚠️ A Meta exclui pelo **nome** do template — todos os idiomas com aquele nome serão excluídos.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID interno do template (`metaTemplateId`) |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Template removido com sucesso.",
  "dados": null
}
```

**Response 400 — não encontrado:**
```json
{
  "sucesso": false,
  "mensagem": "Template não encontrado.",
  "dados": null
}
```

**Response 400 — acesso negado:**
```json
{
  "sucesso": false,
  "mensagem": "Acesso não autorizado.",
  "dados": null
}
```

---

## POST `/api/meta/template/Sincronizar`

Busca todos os templates da Meta API e sincroniza com o banco local (upsert).  
Deve ser chamado periodicamente para atualizar status (PENDING → APPROVED/REJECTED) e qualidade.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Sincronização concluída. 2 criados, 5 atualizados.",
  "dados": {
    "criados": 2,
    "atualizados": 5,
    "total": 7
  }
}
```

**Response 400 — sem conexão ativa:**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma conexão WhatsApp Meta ativa encontrada para esta empresa.",
  "dados": null
}
```

> **Diagnóstico de erro 100 da Meta:** Se receber `(#100) Tried accessing nonexisting field (message_templates)`, o ID salvo em `platform_connections.identifier` pode ser um `phone_number_id` em vez de um `WHATSAPP_BUSINESS_ACCOUNT_ID`. Verificar em [Meta Business Manager](https://business.facebook.com) → Configurações do WhatsApp → IDs da conta. O WABA ID tem formato numérico diferente do Phone Number ID.

---

## POST `/api/meta/template/UploadMidia`

Faz upload de uma mídia (imagem, vídeo ou documento) para o servidor local e para a Meta.  
Retorna o `media_id` da Meta, que deve ser usado no campo `imagem.id`, `video.id` ou `documento.id` do componente `HEADER` ao disparar uma campanha com header de mídia.

**Pré-requisito:** A empresa deve ter uma **ConexaoPlataforma** ativa do tipo `WhatsappMeta`. O upload é feito via `POST /{phone-number-id}/media`.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form-data:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `arquivo` | `file` | ✅ | Arquivo da mídia. Limite: 20 MB. |

**Formatos suportados pela Meta:**
| Tipo | Formatos |
|------|----------|
| Imagem | `image/jpeg`, `image/png` |
| Vídeo | `video/mp4`, `video/3gpp` |
| Documento | `application/pdf`, `application/msword`, `.docx`, `.pptx`, `.xlsx` |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Upload realizado com sucesso.",
  "dados": {
    "mediaId": "1234567890123456",
    "caminhoLocal": "TemplateMidia/2026-05-29/1234567890123456.jpg",
    "mimeType": "image/jpeg"
  }
}
```

**Response 400 — arquivo não enviado:**
```json
{
  "sucesso": false,
  "mensagem": "Arquivo não enviado.",
  "dados": null
}
```

**Response 400 — sem conexão ativa:**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma conexão WhatsApp Meta ativa encontrada para esta empresa.",
  "dados": null
}
```

**Response 400 — erro da Meta:**
```json
{
  "sucesso": false,
  "mensagem": "Erro na API da Meta: ...",
  "dados": null
}
```

> **Onde o arquivo é salvo:** localmente em `{BasePath}/TemplateMidia/{data}/{mediaId}.{ext}`, seguindo o mesmo padrão do armazenamento de mídias do chat.

> **Fluxo de uso para disparo com header de imagem:**
> 1. `POST /api/meta/template/UploadMidia` → recebe `mediaId`
> 2. `POST /api/campanha/{id}/disparar` com componente HEADER usando `{ "tipo": "image", "imagem": { "id": "<mediaId>" } }`

---

## Exemplos de criação por categoria

### Exemplo 1 — UTILITY: Confirmação de agendamento (com variáveis)

```json
POST /api/meta/template/Criar

{
  "nome": "confirmacao_agendamento",
  "categoria": "UTILITY",
  "idioma": "pt_BR",
  "textoBody": "Olá, {{1}}! Seu agendamento para o dia {{2}} às {{3}} está confirmado. Para cancelar, responda CANCELAR.",
  "textoFooter": "LemeIA – Atendimento inteligente",
  "exemplosBody": ["Maria", "15/06/2026", "14:00"],
  "botoes": [
    {
      "tipo": "QUICK_REPLY",
      "texto": "✅ Confirmar"
    },
    {
      "tipo": "QUICK_REPLY",
      "texto": "❌ Cancelar"
    }
  ]
}
```

---

### Exemplo 2 — MARKETING: Promoção com header de texto e botão de URL

```json
POST /api/meta/template/Criar

{
  "nome": "promocao_black_friday",
  "categoria": "MARKETING",
  "idioma": "pt_BR",
  "formatoHeader": "TEXT",
  "textoHeader": "🔥 Black Friday especial para você!",
  "textoBody": "Olá, {{1}}! Temos {{2}} de desconto em toda a loja. Oferta válida até {{3}}. Aproveite!",
  "textoFooter": "Para não receber ofertas, responda SAIR",
  "exemplosBody": ["João", "50%", "30/11/2026"],
  "botoes": [
    {
      "tipo": "URL",
      "texto": "Ver ofertas",
      "url": "https://loja.exemplo.com.br/black-friday"
    },
    {
      "tipo": "QUICK_REPLY",
      "texto": "Não tenho interesse"
    }
  ]
}
```

---

### Exemplo 3 — MARKETING: Promoção com header de imagem

```json
POST /api/meta/template/Criar

{
  "nome": "lancamento_produto",
  "categoria": "MARKETING",
  "idioma": "pt_BR",
  "formatoHeader": "IMAGE",
  "exemploHeaderHandle": "4::aW1hZ2UvanBlZw==:ARZGHmFkb...",
  "textoBody": "Olá, {{1}}! Nosso novo produto {{2}} chegou. Seja um dos primeiros a garantir o seu com condições especiais!",
  "textoFooter": "Responda SAIR para não receber mais mensagens",
  "exemplosBody": ["Ana", "ProMax X1"],
  "botoes": [
    {
      "tipo": "URL",
      "texto": "Comprar agora",
      "url": "https://loja.exemplo.com.br/produto/promax-x1"
    }
  ]
}
```

> **Nota:** `exemploHeaderHandle` é obrigatório pela Meta quando `formatoHeader` for `IMAGE`, `VIDEO` ou `DOCUMENT`. Ele é obtido via **Resumable Upload API da Meta** (não via `/UploadMidia`). A mídia do `exemploHeaderHandle` é apenas para aprovação do template. No disparo real, use um `link` público ou o `id` retornado por `/UploadMidia`.

---

### Exemplo 4 — UTILITY: Notificação simples sem variáveis

```json
POST /api/meta/template/Criar

{
  "nome": "aviso_manutencao",
  "categoria": "UTILITY",
  "idioma": "pt_BR",
  "textoBody": "Informamos que nosso sistema estará em manutenção no dia 25/06/2026 das 02h às 04h. Pedimos desculpas pelo inconveniente.",
  "textoFooter": "LemeIA – Suporte"
}
```

---

### Exemplo 5 — UTILITY: Cobrança/lembrete de pagamento

```json
POST /api/meta/template/Criar

{
  "nome": "lembrete_pagamento",
  "categoria": "UTILITY",
  "idioma": "pt_BR",
  "textoBody": "Olá, {{1}}! Seu boleto no valor de R$ {{2}} vence em {{3}}. Acesse o link abaixo para pagar.",
  "exemplosBody": ["Carlos", "350,00", "28/06/2026"],
  "botoes": [
    {
      "tipo": "URL",
      "texto": "Pagar boleto",
      "url": "https://pagamentos.exemplo.com.br/boleto/{{1}}"
    }
  ]
}
```

> **Nota:** Quando a URL contém variável dinâmica (`{{1}}`), adicione o valor de exemplo no array `exemplosBody`. A Meta exige exemplos para URLs dinâmicas.

---

### Exemplo 6 — MARKETING: Contato com botão de telefone

```json
POST /api/meta/template/Criar

{
  "nome": "suporte_comercial",
  "categoria": "MARKETING",
  "idioma": "pt_BR",
  "textoBody": "Olá, {{1}}! Nosso consultor está disponível para atender você. Entre em contato agora mesmo!",
  "exemplosBody": ["Pedro"],
  "botoes": [
    {
      "tipo": "PHONE_NUMBER",
      "texto": "Ligar agora",
      "telefone": "+5511999999999"
    },
    {
      "tipo": "QUICK_REPLY",
      "texto": "Prefiro WhatsApp"
    }
  ]
}
```

---

## Status possíveis de um template

| Status | Descrição | Pode enviar? |
|--------|-----------|:---:|
| `PENDING` | Aguardando análise da Meta | ❌ |
| `IN_REVIEW` | Em análise (pode levar até 24h úteis) | ❌ |
| `APPROVED` | Aprovado pela Meta | ✅ |
| `REJECTED` | Rejeitado — ver `motivoRejeicao` | ❌ |
| `FLAGGED` | Sinalizado por baixa qualidade — uso limitado | ⚠️ |
| `DISABLED` | Desabilitado temporariamente | ❌ |
| `PAUSED` | Pausado por excesso de bloqueios de usuários | ❌ |

**Motivos comuns de rejeição (`motivoRejeicao`):**

| Valor | Descrição |
|-------|-----------|
| `ABUSIVE_CONTENT` | Conteúdo abusivo ou violador de políticas |
| `INCORRECT_CATEGORY` | Categoria incorreta para o tipo de mensagem |
| `INVALID_FORMAT` | Formato inválido (variáveis mal formatadas, etc.) |
| `SCAM` | Conteúdo identificado como fraude |
| `NONE` | Sem motivo especificado |

---

## Regras de nomenclatura

- **Nome do template:** obrigatoriamente em `snake_case` (letras minúsculas e underscores)
- Espaços são convertidos automaticamente para `_` pela API
- Não use acentos, símbolos especiais ou letras maiúsculas no nome
- O nome + idioma formam um par único — o mesmo nome pode existir em idiomas diferentes
- ⚠️ Ao remover um template, **todos os idiomas** com aquele nome são excluídos na Meta

**Exemplos válidos:**
```
confirmacao_agendamento
lembrete_pagamento_vencimento
boas_vindas_cliente_novo
```

**Exemplos inválidos:**
```
Confirmação Agendamento   ← tem espaços e acento
lembretePagemento!        ← tem caractere especial
BOAS_VINDAS               ← letras maiúsculas
```

---

## Referências

| Recurso | URL |
|---------|-----|
| Documentação de templates | https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates |
| Idiomas suportados | https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/supported-languages |
| Categorias de template | https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines |
| Códigos de erro da Meta | https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes |
