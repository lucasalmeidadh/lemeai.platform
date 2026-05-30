# Meta Templates — Documentação de Endpoints

Base URL: `/api/meta/template`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
O `empresaId` é extraído automaticamente do token JWT — não deve ser enviado pelo cliente.

> **Pré-requisito:** A empresa deve ter uma **ConexaoPlataforma** ativa do tipo `WhatsappMeta` com o `WHATSAPP_BUSINESS_ACCOUNT_ID` (WABA ID) salvo no campo `Identificador` e o token de usuário de sistema salvo em `Token`. O token deve ter a permissão `whatsapp_business_management`.

---

## Índice

1. [Fluxo completo para template com mídia no header](#fluxo-completo-para-template-com-mídia-no-header)
2. [POST `/ObterHandleExemplo`](#post-apimetatemplateobterhandleexemplo)
3. [POST `/Criar`](#post-apimetatemplatecria)
4. [POST `/Sincronizar`](#post-apimetatemplateSincronizar)
6. [GET `/BuscarTodos`](#get-apimetatplatebuscartodos)
7. [GET `/BuscarPorId/{id}`](#get-apimetatplatebuscarporidid)
8. [DELETE `/Remover/{id}`](#delete-apimetatemplatereoverid)
9. [Exemplos de criação por categoria](#exemplos-de-criação-por-categoria)
10. [Status possíveis de um template](#status-possíveis-de-um-template)
11. [Regras de nomenclatura](#regras-de-nomenclatura)

---

## Fluxo completo para template com mídia no header

Quando o template tem `formatoHeader` `IMAGE`, `VIDEO` ou `DOCUMENT`, o seguinte fluxo deve ser seguido:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRIAÇÃO DO TEMPLATE                                                        │
│                                                                             │
│  1. Usuário seleciona a imagem no formulário                                │
│     ↓                                                                       │
│  2. POST /ObterHandleExemplo  (envia a imagem)                              │
│     ← retorna { handle, caminhoLocal }                                      │
│     ↓                                                                       │
│  3. POST /Criar  (com exemploHeaderHandle = handle,                         │
│                       caminhoMidiaHeader  = caminhoLocal)                   │
│     ← status PENDING, aguarda aprovação da Meta                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  DISPARO DA CAMPANHA  (após template APPROVED)                              │
│                                                                             │
│  4. POST /api/campanha/{id}/disparar                                        │
│     → componente HEADER com { "tipo": "image" } sem id/link                │
│     → backend detecta ausência de mídia, lê arquivo salvo no passo 2,      │
│       faz upload automático para a Meta e injeta o media_id                 │
│     ← O usuário não precisa enviar a imagem de novo                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Resumo para o frontend:** o usuário sobe a imagem uma única vez (passo 1). Guarde o `caminhoLocal` retornado e passe-o no campo `caminhoMidiaHeader` ao criar o template. No disparo, envie o componente HEADER com `{ "tipo": "image" }` **sem** `imagem.id` ou `imagem.link` — o backend faz o upload da mídia automaticamente.

---

## POST `/api/meta/template/ObterHandleExemplo`

Obtém o **handle de exemplo de mídia** exigido pela Meta para criar templates com header `IMAGE`, `VIDEO` ou `DOCUMENT`.  
Executa o fluxo **Resumable Upload API da Meta** internamente (diferente do upload comum de mensagem).  
Também salva o arquivo localmente para reutilização automática no disparo da campanha.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form-data:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `arquivo` | `file` | ✅ | Imagem/vídeo/documento de exemplo. Limite: 20 MB. |

**Formatos aceitos:**
| Tipo | MIME types |
|------|-----------|
| Imagem | `image/jpeg`, `image/png` |
| Vídeo | `video/mp4` |
| Documento | `application/pdf` |

**Exemplo de request:**
```
POST /api/meta/template/ObterHandleExemplo
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="arquivo"; filename="banner_produto.jpg"
Content-Type: image/jpeg

<bytes do arquivo>
------boundary--
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Handle obtido com sucesso.",
  "dados": {
    "handle": "4::aW1hZ2UvanBlZw==:ARZGHmFkb3NhZmlhc2RmYXNkZg==",
    "caminhoLocal": "TemplateMidia/2026-05-29/a3f1c2d4e5b6.jpg"
  }
}
```

> **O que fazer com o retorno:**
> - `handle` → passe em `exemploHeaderHandle` ao chamar `POST /Criar`
> - `caminhoLocal` → passe em `caminhoMidiaHeader` ao chamar `POST /Criar` — o backend usará este arquivo automaticamente no disparo da campanha, sem precisar que o usuário envie a imagem novamente

**Response 400 — sem conexão ativa:**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma conexão WhatsApp Meta ativa encontrada para esta empresa.",
  "dados": null
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

**Response 400 — erro da Meta:**
```json
{
  "sucesso": false,
  "mensagem": "Erro na API da Meta: ...",
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
| `idioma` | `string` | ✅ | Código de idioma. Padrão: `pt_BR`. |
| `textoBody` | `string` | ✅ | Texto principal. Use `{{1}}`, `{{2}}`... para variáveis. |
| `textoHeader` | `string` | ❌ | Texto do cabeçalho (obrigatório se `formatoHeader` for `TEXT`) |
| `formatoHeader` | `string` | ❌ | `TEXT`, `IMAGE`, `VIDEO` ou `DOCUMENT`. Se omitido e `textoHeader` informado, usa `TEXT`. |
| `exemploHeaderHandle` | `string` | ❌ | Handle de exemplo para header de mídia. Obtido via `POST /ObterHandleExemplo`. **Obrigatório pela Meta quando `formatoHeader` for `IMAGE`, `VIDEO` ou `DOCUMENT`.** |
| `caminhoMidiaHeader` | `string` | ❌ | Caminho local retornado por `POST /ObterHandleExemplo`. Quando informado, o backend reutiliza este arquivo automaticamente no disparo da campanha. |
| `exemploHeaderTexto` | `string` | ❌ | Texto de exemplo para header `TEXT` com variável `{{1}}`. |
| `textoFooter` | `string` | ❌ | Rodapé (sem variáveis). Máx. 60 caracteres. |
| `botoes` | `array` | ❌ | Lista de botões. Máx. 3 botões. |
| `exemplosBody` | `array<string>` | ❌ | Valores de exemplo para `{{1}}`, `{{2}}`... — **obrigatório pela Meta quando o body contém variáveis** |

**Objeto `botoes[*]`:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | `string` | ✅ | `URL`, `QUICK_REPLY` ou `PHONE_NUMBER` |
| `texto` | `string` | ✅ | Texto visível no botão. Máx. 25 caracteres. |
| `url` | `string` | ❌ | Obrigatório para tipo `URL` |
| `telefone` | `string` | ❌ | Obrigatório para tipo `PHONE_NUMBER` (formato E.164, ex: `+5511999999999`) |

**Exemplo de request — template com imagem no header (fluxo completo):**
```json
POST /api/meta/template/Criar
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "nome": "lancamento_produto",
  "categoria": "MARKETING",
  "idioma": "pt_BR",
  "formatoHeader": "IMAGE",
  "exemploHeaderHandle": "4::aW1hZ2UvanBlZw==:ARZGHmFkb3NhZmlhc2RmYXNkZg==",
  "caminhoMidiaHeader": "TemplateMidia/2026-05-29/a3f1c2d4e5b6.jpg",
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

> `exemploHeaderHandle` e `caminhoMidiaHeader` são os valores retornados por `POST /ObterHandleExemplo` no passo anterior.

**Exemplo de request — template sem mídia (apenas texto):**
```json
POST /api/meta/template/Criar
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "nome": "confirmacao_agendamento",
  "categoria": "UTILITY",
  "idioma": "pt_BR",
  "textoBody": "Olá, {{1}}! Seu agendamento para {{2}} às {{3}} está confirmado.",
  "textoFooter": "LemeIA – Atendimento inteligente",
  "exemplosBody": ["Maria", "15/06/2026", "14:00"],
  "botoes": [
    { "tipo": "QUICK_REPLY", "texto": "✅ Confirmar" },
    { "tipo": "QUICK_REPLY", "texto": "❌ Cancelar" }
  ]
}
```

**Response 200 — criado com sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Template criado com sucesso. Aguardando aprovação da Meta.",
  "dados": {
    "metaTemplateId": 3,
    "templateMetaId": "1122334455667788",
    "nome": "lancamento_produto",
    "categoria": "MARKETING",
    "idioma": "pt_BR",
    "status": "PENDING",
    "qualidade": null,
    "componentesJson": null,
    "motivoRejeicao": null,
    "sincronizadoEm": null,
    "criadoEm": "2026-05-29T10:00:00Z"
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

## POST `/api/meta/template/Sincronizar`

Busca todos os templates da Meta API e sincroniza com o banco local (upsert).  
Deve ser chamado periodicamente para atualizar status (PENDING → APPROVED/REJECTED) e qualidade.

**Request:** sem body.

**Exemplo de request:**
```
POST /api/meta/template/Sincronizar
Authorization: Bearer eyJhbGc...
```

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

> **Diagnóstico de erro 100 da Meta:** Se receber `(#100) Tried accessing nonexisting field (message_templates)`, o ID salvo em `platform_connections.identifier` pode ser um `phone_number_id` em vez de um `WHATSAPP_BUSINESS_ACCOUNT_ID`. Verificar em Meta Business Manager → Configurações do WhatsApp → IDs da conta.

---

## GET `/api/meta/template/BuscarTodos`

Retorna todos os templates armazenados localmente para a empresa autenticada (cache do banco).  
Use `POST /Sincronizar` antes para garantir dados atualizados.

**Request:** sem body.

**Exemplo de request:**
```
GET /api/meta/template/BuscarTodos
Authorization: Bearer eyJhbGc...
```

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
      "nome": "lancamento_produto",
      "categoria": "MARKETING",
      "idioma": "pt_BR",
      "status": "APPROVED",
      "qualidade": "HIGH",
      "componentesJson": null,
      "motivoRejeicao": null,
      "sincronizadoEm": null,
      "criadoEm": "2026-05-29T10:00:00Z"
    }
  ]
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao buscar templates.",
  "dados": null
}
```

---

## GET `/api/meta/template/BuscarPorId/{id}`

Retorna um template específico pelo ID interno.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID interno do template (`metaTemplateId`) |

**Exemplo de request:**
```
GET /api/meta/template/BuscarPorId/2
Authorization: Bearer eyJhbGc...
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Template encontrado.",
  "dados": {
    "metaTemplateId": 2,
    "templateMetaId": "9876543210987654",
    "nome": "lancamento_produto",
    "categoria": "MARKETING",
    "idioma": "pt_BR",
    "status": "APPROVED",
    "qualidade": "HIGH",
    "componentesJson": null,
    "motivoRejeicao": null,
    "sincronizadoEm": null,
    "criadoEm": "2026-05-29T10:00:00Z"
  }
}
```

**Response 400 — não encontrado:**
```json
{ "sucesso": false, "mensagem": "Template não encontrado.", "dados": null }
```

**Response 400 — acesso negado:**
```json
{ "sucesso": false, "mensagem": "Acesso não autorizado.", "dados": null }
```

---

## DELETE `/api/meta/template/Remover/{id}`

Remove o template da Meta API e do banco local.  
⚠️ A Meta exclui pelo **nome** do template — todos os idiomas com aquele nome serão excluídos.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID interno do template (`metaTemplateId`) |

**Exemplo de request:**
```
DELETE /api/meta/template/Remover/2
Authorization: Bearer eyJhbGc...
```

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
{ "sucesso": false, "mensagem": "Template não encontrado.", "dados": null }
```

**Response 400 — acesso negado:**
```json
{ "sucesso": false, "mensagem": "Acesso não autorizado.", "dados": null }
```

---

## Exemplos de criação por categoria

### Template com imagem no header — passo a passo completo

**Passo 1 — obter handle e salvar arquivo:**
```
POST /api/meta/template/ObterHandleExemplo
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data

arquivo: [banner_produto.jpg]
```
Retorno:
```json
{
  "sucesso": true,
  "mensagem": "Handle obtido com sucesso.",
  "dados": {
    "handle": "4::aW1hZ2UvanBlZw==:ARZGHmFkb3NhZmlhc2RmYXNkZg==",
    "caminhoLocal": "TemplateMidia/2026-05-29/a3f1c2d4e5b6.jpg"
  }
}
```

**Passo 2 — criar o template:**
```json
POST /api/meta/template/Criar
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "nome": "lancamento_produto",
  "categoria": "MARKETING",
  "idioma": "pt_BR",
  "formatoHeader": "IMAGE",
  "exemploHeaderHandle": "4::aW1hZ2UvanBlZw==:ARZGHmFkb3NhZmlhc2RmYXNkZg==",
  "caminhoMidiaHeader": "TemplateMidia/2026-05-29/a3f1c2d4e5b6.jpg",
  "textoBody": "Olá, {{1}}! Nosso novo produto {{2}} chegou com condições especiais!",
  "textoFooter": "Responda SAIR para não receber mais mensagens",
  "exemplosBody": ["Ana", "ProMax X1"],
  "botoes": [
    { "tipo": "URL", "texto": "Comprar agora", "url": "https://loja.exemplo.com.br/produto/promax-x1" }
  ]
}
```
Retorno:
```json
{
  "sucesso": true,
  "mensagem": "Template criado com sucesso. Aguardando aprovação da Meta.",
  "dados": {
    "metaTemplateId": 5,
    "templateMetaId": "1122334455667788",
    "nome": "lancamento_produto",
    "categoria": "MARKETING",
    "idioma": "pt_BR",
    "status": "PENDING",
    ...
  }
}
```

**Passo 3 — aguardar aprovação (PENDING → APPROVED)**

Use `POST /Sincronizar` para atualizar o status no banco local. Apenas templates com `status: "APPROVED"` podem ser disparados.

**Passo 4 — disparar a campanha:**
```json
POST /api/campanha/42/disparar
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "destinatarios": [
    { "numero": "5511999990001" },
    { "numero": "5511999990002" }
  ],
  "componentes": [
    {
      "tipo": "HEADER",
      "parametros": [
        { "tipo": "image" }
      ]
    },
    {
      "tipo": "BODY",
      "parametros": [
        { "tipo": "text", "texto": "Ana" },
        { "tipo": "text", "texto": "ProMax X1" }
      ]
    }
  ]
}
```

> O componente HEADER tem `{ "tipo": "image" }` **sem** `imagem.id` ou `imagem.link`. O backend detecta isso automaticamente, lê o arquivo `TemplateMidia/2026-05-29/a3f1c2d4e5b6.jpg` salvo no passo 1, faz upload para a Meta e injeta o `media_id` antes do envio. O usuário não precisa subir a imagem de novo.

---

### Outros exemplos de request para POST /Criar

#### UTILITY: Confirmação de agendamento com variáveis e botões

```json
{
  "nome": "confirmacao_agendamento",
  "categoria": "UTILITY",
  "idioma": "pt_BR",
  "textoBody": "Olá, {{1}}! Seu agendamento para o dia {{2}} às {{3}} está confirmado. Para cancelar, responda CANCELAR.",
  "textoFooter": "LemeIA – Atendimento inteligente",
  "exemplosBody": ["Maria", "15/06/2026", "14:00"],
  "botoes": [
    { "tipo": "QUICK_REPLY", "texto": "✅ Confirmar" },
    { "tipo": "QUICK_REPLY", "texto": "❌ Cancelar" }
  ]
}
```

#### MARKETING: Header de texto com botão de URL

```json
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
    { "tipo": "URL", "texto": "Ver ofertas", "url": "https://loja.exemplo.com.br/black-friday" },
    { "tipo": "QUICK_REPLY", "texto": "Não tenho interesse" }
  ]
}
```

#### UTILITY: Lembrete de pagamento com URL dinâmica

```json
{
  "nome": "lembrete_pagamento",
  "categoria": "UTILITY",
  "idioma": "pt_BR",
  "textoBody": "Olá, {{1}}! Seu boleto no valor de R$ {{2}} vence em {{3}}. Acesse o link abaixo para pagar.",
  "exemplosBody": ["Carlos", "350,00", "28/06/2026"],
  "botoes": [
    { "tipo": "URL", "texto": "Pagar boleto", "url": "https://pagamentos.exemplo.com.br/boleto/{{1}}" }
  ]
}
```

#### UTILITY: Notificação simples sem variáveis

```json
{
  "nome": "aviso_manutencao",
  "categoria": "UTILITY",
  "idioma": "pt_BR",
  "textoBody": "Informamos que nosso sistema estará em manutenção no dia 25/06/2026 das 02h às 04h. Pedimos desculpas pelo inconveniente.",
  "textoFooter": "LemeIA – Suporte"
}
```

#### MARKETING: Botão de telefone

```json
{
  "nome": "suporte_comercial",
  "categoria": "MARKETING",
  "idioma": "pt_BR",
  "textoBody": "Olá, {{1}}! Nosso consultor está disponível para atender você. Entre em contato agora mesmo!",
  "exemplosBody": ["Pedro"],
  "botoes": [
    { "tipo": "PHONE_NUMBER", "texto": "Ligar agora", "telefone": "+5511999999999" },
    { "tipo": "QUICK_REPLY", "texto": "Prefiro WhatsApp" }
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
| Resumable Upload API | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#resumable-upload |
| Códigos de erro da Meta | https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes |
