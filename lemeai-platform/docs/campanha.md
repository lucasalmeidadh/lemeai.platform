# Campanhas — Documentação de Endpoints

Base URL: `/api/campanha`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
O `empresaId` e o `usuarioId` são extraídos automaticamente do token JWT — não devem ser enviados pelo cliente.

> **Pré-requisito para disparo:** A empresa deve ter uma **ConexaoPlataforma** ativa do tipo `WhatsappMeta` com o `phone_number_id` salvo em `Identificador` e o token de acesso em `Token`. O template usado no disparo deve estar com status `APPROVED` na Meta. Consulte [meta-template.md](meta-template.md) para criar e sincronizar templates.

---

## Índice

1. [GET `/BuscarTodos`](#get-apicampanhaBuscarTodos)
2. [GET `/ResumoMetricas`](#get-apicampanhaResumoMetricas)
3. [GET `/{campanhaId}/conversas`](#get-apicampanhacampanhaIdconversas)
4. [POST `/Criar`](#post-apicampanhaCriar)
5. [PUT `/Atualizar`](#put-apicampanhaAtualizar)
6. [DELETE `/Remover/{id}`](#delete-apicampanhaRemoverid)
7. [POST `/{id}/disparar`](#post-apicampanhaiddisparar)
8. [Ciclo de vida de uma campanha](#ciclo-de-vida-de-uma-campanha)
9. [Controle de rate limit no disparo](#controle-de-rate-limit-no-disparo)
10. [Estrutura dos componentes (parâmetros variáveis)](#estrutura-dos-componentes-parâmetros-variáveis)

---

## GET `/api/campanha/BuscarTodos`

Retorna todas as campanhas da empresa autenticada (não deletadas).

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Campanhas encontradas.",
  "dados": [
    {
      "campanhaId": 1,
      "campanhaNome": "Black Friday 2026",
      "campanhaTemplateNome": "promocao_black_friday",
      "campanhaTemplateIdioma": "pt_BR",
      "campanhaCategoria": "MARKETING",
      "campanhaStatus": "Finalizada",
      "campanhaAgendadaEm": null,
      "campanhaCreatedat": "2026-05-27T10:00:00Z",
      "campanhaUpdatedat": "2026-05-27T11:30:00Z"
    },
    {
      "campanhaId": 2,
      "campanhaNome": "Lembrete de Pagamento - Junho",
      "campanhaTemplateNome": "lembrete_pagamento",
      "campanhaTemplateIdioma": "pt_BR",
      "campanhaCategoria": "UTILITY",
      "campanhaStatus": "Rascunho",
      "campanhaAgendadaEm": "2026-06-01T08:00:00Z",
      "campanhaCreatedat": "2026-05-27T14:00:00Z",
      "campanhaUpdatedat": "2026-05-27T14:00:00Z"
    }
  ]
}
```

**Response 400 (erro interno):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao buscar campanhas.",
  "dados": null
}
```

---

## GET `/api/campanha/ResumoMetricas`

Retorna um resumo agregado de todas as campanhas com métricas de interação — útil para o dashboard/kanban.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Métricas encontradas.",
  "dados": [
    {
      "campanhaId": 1,
      "campanhaNome": "Black Friday 2026",
      "campanhaTemplateNome": "promocao_black_friday",
      "campanhaCategoria": "MARKETING",
      "campanhaStatus": "Finalizada",
      "campanhaCreatedat": "2026-05-27T10:00:00Z",
      "totalDisparado": 1500,
      "totalComInteracao": 312,
      "percentualInteracao": 20.8
    },
    {
      "campanhaId": 2,
      "campanhaNome": "Lembrete de Pagamento - Junho",
      "campanhaTemplateNome": "lembrete_pagamento",
      "campanhaCategoria": "UTILITY",
      "campanhaStatus": "Rascunho",
      "campanhaCreatedat": "2026-05-27T14:00:00Z",
      "totalDisparado": 0,
      "totalComInteracao": 0,
      "percentualInteracao": 0.0
    }
  ]
}
```

| Campo | Descrição |
|-------|-----------|
| `totalDisparado` | Total de registros em `campaign_dispatches` para esta campanha |
| `totalComInteracao` | Disparos que geraram uma conversa com pelo menos uma mensagem do cliente ou `unread_count > 0` |
| `percentualInteracao` | `(totalComInteracao / totalDisparado) * 100`, arredondado em 2 casas. `0` quando `totalDisparado = 0` |

**Response 400 (erro interno):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao buscar métricas de campanhas.",
  "dados": null
}
```

---

## GET `/api/campanha/{campanhaId}/conversas`

Retorna os disparos de uma campanha com paginação. Ideal para listar no kanban quais contatos responderam.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `campanhaId` | `int` | ID da campanha |

**Query params:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `pagina` | `int` | `1` | Página atual (começa em 1) |
| `porPagina` | `int` | `20` | Itens por página |

**Request:**
```http
GET /api/campanha/1/conversas?pagina=1&porPagina=20
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Disparos encontrados.",
  "dados": {
    "itens": [
      {
        "disparoId": 101,
        "campanhaId": 1,
        "contatoId": 55,
        "conversaId": 210,
        "disparoNumero": "5511999999999",
        "disparoStatus": "enviado",
        "disparoWamid": "wamid.HBgLNTUxMTk5OTk5OTk5ABCDEF==",
        "disparoErro": null,
        "disparoEnviadoEm": "2026-05-27T10:05:00Z",
        "disparoEntregueEm": "2026-05-27T10:05:12Z",
        "disparoLidoEm": "2026-05-27T10:08:44Z",
        "teveInteracao": true
      },
      {
        "disparoId": 102,
        "campanhaId": 1,
        "contatoId": null,
        "conversaId": null,
        "disparoNumero": "5521988888888",
        "disparoStatus": "falha",
        "disparoWamid": null,
        "disparoErro": "(#131030) Recipient phone number not in allowed list",
        "disparoEnviadoEm": null,
        "disparoEntregueEm": null,
        "disparoLidoEm": null,
        "teveInteracao": false
      }
    ],
    "total": 1500,
    "pagina": 1,
    "porPagina": 20,
    "totalPaginas": 75
  }
}
```

| Campo | Descrição |
|-------|-----------|
| `disparoStatus` | `"enviado"` (Meta aceitou), `"falha"` (erro no envio), `"entregue"` ou `"lido"` (atualizados via webhook) |
| `disparoWamid` | ID de mensagem da Meta (`wamid.*`). Nulo quando status é `"falha"` |
| `teveInteracao` | `true` quando existe uma conversa vinculada (`conversaId != null`) |
| `totalPaginas` | Calculado automaticamente: `ceil(total / porPagina)` |

**Response 400 — campanha não encontrada:**
```json
{
  "sucesso": false,
  "mensagem": "Campanha não encontrada.",
  "dados": null
}
```

**Response 400 — acesso negado (outra empresa):**
```json
{
  "sucesso": false,
  "mensagem": "Acesso não autorizado.",
  "dados": null
}
```

---

## POST `/api/campanha/Criar`

Cria uma nova campanha no status `Rascunho`. O template já deve existir e estar aprovado na Meta antes do disparo.

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | `string` | ✅ | Nome da campanha (ex: `"Black Friday 2026"`) |
| `templateNome` | `string` | ✅ | Nome exato do template aprovado na Meta (ex: `"promocao_black_friday"`) |
| `templateIdioma` | `string` | ✅ | Idioma do template. Padrão: `"pt_BR"` |
| `categoria` | `string` | ✅ | `"MARKETING"`, `"UTILITY"` ou `"AUTHENTICATION"` |
| `agendadaEm` | `datetime?` | ❌ | Data/hora de agendamento (informativo — o disparo é feito manualmente via `POST /{id}/disparar`) |

**Request:**
```json
POST /api/campanha/Criar

{
  "nome": "Black Friday 2026",
  "templateNome": "promocao_black_friday",
  "templateIdioma": "pt_BR",
  "categoria": "MARKETING",
  "agendadaEm": "2026-11-28T08:00:00Z"
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Campanha criada com sucesso.",
  "dados": {
    "campanhaId": 3,
    "campanhaNome": "Black Friday 2026",
    "campanhaTemplateNome": "promocao_black_friday",
    "campanhaTemplateIdioma": "pt_BR",
    "campanhaCategoria": "MARKETING",
    "campanhaStatus": "Rascunho",
    "campanhaAgendadaEm": "2026-11-28T08:00:00Z",
    "campanhaCreatedat": "2026-05-27T15:00:00Z",
    "campanhaUpdatedat": "2026-05-27T15:00:00Z"
  }
}
```

**Response 400 (erro interno):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao criar campanha.",
  "dados": null
}
```

---

## PUT `/api/campanha/Atualizar`

Atualiza os dados de uma campanha existente. Qualquer status pode ser atualizado manualmente aqui (inclusive reverter para `Rascunho` se necessário).

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `campanhaId` | `int` | ✅ | ID da campanha a atualizar |
| `nome` | `string` | ✅ | Novo nome da campanha |
| `templateNome` | `string` | ✅ | Nome do template (pode ser alterado enquanto ainda em Rascunho) |
| `templateIdioma` | `string` | ✅ | Idioma do template |
| `categoria` | `string` | ✅ | Categoria da campanha |
| `status` | `string` | ✅ | Status manual: `"Rascunho"`, `"Enviando"` ou `"Finalizada"` |
| `agendadaEm` | `datetime?` | ❌ | Data de agendamento (informativo) |

**Request:**
```json
PUT /api/campanha/Atualizar

{
  "campanhaId": 3,
  "nome": "Black Friday 2026 - Revisada",
  "templateNome": "promocao_black_friday_v2",
  "templateIdioma": "pt_BR",
  "categoria": "MARKETING",
  "status": "Rascunho",
  "agendadaEm": "2026-11-29T08:00:00Z"
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Campanha atualizada com sucesso.",
  "dados": null
}
```

**Response 400 — não encontrada:**
```json
{
  "sucesso": false,
  "mensagem": "Campanha não encontrada.",
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

## DELETE `/api/campanha/Remover/{id}`

Remove (soft delete) uma campanha. O registro permanece no banco com `deleted = true` e não aparece mais nas listagens.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID da campanha |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Campanha removida com sucesso.",
  "dados": null
}
```

**Response 400 — não encontrada:**
```json
{
  "sucesso": false,
  "mensagem": "Campanha não encontrada.",
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

## POST `/api/campanha/{id}/disparar`

Dispara o template da campanha para a lista de destinatários informada. A campanha deve estar no status `Rascunho`.

O disparo é feito destinatário a destinatário — uma falha individual **não interrompe o lote**. Ao finalizar, o status da campanha é atualizado automaticamente: `Rascunho` → `Enviando` → `Finalizada`.

Para cada envio bem-sucedido, o sistema:
- Registra um `CampanhaDisparo` com o `wamid` retornado pela Meta
- Cria ou vincula uma conversa ao `campanhaId` (para rastreamento no kanban)

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `int` | ID da campanha a disparar |

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `destinatarios` | `array` | ✅ | Lista de destinatários. Mínimo: 1 item. |
| `destinatarios[*].numero` | `string` | ⚠️ | Telefone no formato E.164 (ex: `"5511999999999"`). Obrigatório se `bsuid` não informado. |
| `destinatarios[*].bsuid` | `string` | ⚠️ | Business Suite User ID. Obrigatório se `numero` não informado. |
| `destinatarios[*].variaveis` | `string[]` | ❌ | Valores do BODY para **este destinatário**. `variaveis[0]` → `{{1}}`, `variaveis[1]` → `{{2}}`, etc. Quando informado, sobrepõe qualquer componente BODY em `componentes`. |
| `componentes` | `array` | ❌ | Componentes **compartilhados por todos os destinatários** (HEADER, BUTTON). Componente BODY aqui é ignorado para destinatários que informaram `variaveis`. |

> ⚠️ O nome e o idioma do template **vêm da campanha** — não precisam ser informados no request.  
> ⚠️ Cada destinatário deve ter ao menos `numero` **ou** `bsuid`. Itens sem nenhum dos dois são ignorados e contados como falha.

---

### Exemplo 1 — Disparo de template sem variáveis

```json
POST /api/campanha/3/disparar

{
  "destinatarios": [
    { "numero": "5511999999999" },
    { "numero": "5521988888888" },
    { "numero": "5531977777777" }
  ]
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Disparo concluído. 3 enviados, 0 falhas.",
  "dados": {
    "totalDestinatarios": 3,
    "totalEnviados": 3,
    "totalFalhas": 0
  }
}
```

---

### Exemplo 2 — Disparo com BODY personalizado por destinatário

Template: `"Olá, {{1}}! Seu agendamento para {{2}} às {{3}} está confirmado."`

Cada destinatário recebe uma mensagem com o seu próprio nome, data e horário.

```json
POST /api/campanha/3/disparar

{
  "destinatarios": [
    { "numero": "5511999999999", "variaveis": ["Maria",  "15/06/2026", "14:00"] },
    { "numero": "5521988888888", "variaveis": ["João",   "16/06/2026", "10:00"] },
    { "numero": "5531977777777", "variaveis": ["Carlos", "17/06/2026", "09:00"] }
  ]
}
```

- `variaveis[0]` → `{{1}}` (nome do cliente)
- `variaveis[1]` → `{{2}}` (data)
- `variaveis[2]` → `{{3}}` (horário)

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Disparo concluído. 3 enviados, 0 falhas.",
  "dados": {
    "totalDestinatarios": 3,
    "totalEnviados": 3,
    "totalFalhas": 0
  }
}
```

---

### Exemplo 3 — Disparo com BODY personalizado + BUTTON compartilhado

Template:
```
BODY:   "Olá, {{1}}! Use o cupom {{2}} e ganhe 30% de desconto."
BUTTON: URL dinâmica → "https://loja.exemplo.com.br/cupom/{{1}}"
```

O botão é igual para todos (`cupomVIP30`). O BODY é personalizado por destinatário.

```json
POST /api/campanha/3/disparar

{
  "destinatarios": [
    { "numero": "5511999999999", "variaveis": ["Maria", "MARIA30"] },
    { "numero": "5521988888888", "variaveis": ["João",  "JOAO30"]  }
  ],
  "componentes": [
    {
      "tipo": "BUTTON",
      "indicesBotao": 0,
      "parametros": [
        { "tipo": "text", "texto": "cupomVIP30" }
      ]
    }
  ]
}
```

> `componentes` carrega apenas HEADER e BUTTON — componentes iguais para todos.  
> O BODY em `componentes` é **ignorado** para destinatários que informaram `variaveis`.  
> `indicesBotao` indica qual botão recebe o parâmetro (começa em `0`). Use quando o template tem mais de um botão.

---

### Exemplo 4 — Destinatários com telefone e BSUID misturados, com variáveis

```json
POST /api/campanha/3/disparar

{
  "destinatarios": [
    { "numero": "5511999999999",           "variaveis": ["Maria"] },
    { "numero": "5521988888888",           "variaveis": ["João"]  },
    { "bsuid": "AbCdEfGhIjKlMnOpQrStUv",  "variaveis": ["Ana"]   },
    { "bsuid": "ZyXwVuTsRqPoNmLkJiHgFe",  "variaveis": ["Pedro"] },
    {}
  ]
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Disparo concluído. 4 enviados, 1 falhas.",
  "dados": {
    "totalDestinatarios": 4,
    "totalEnviados": 4,
    "totalFalhas": 1
  }
}
```

> O quinto item (`{}`) não tinha `numero` nem `bsuid` — ignorado e contado como falha.

---

**Response 400 — campanha não encontrada:**
```json
{
  "sucesso": false,
  "mensagem": "Campanha não encontrada.",
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

**Response 400 — status inválido para disparo:**
```json
{
  "sucesso": false,
  "mensagem": "Só é possível disparar campanhas no status 'Rascunho'. Status atual: Finalizada.",
  "dados": null
}
```

**Response 400 — sem conexão WhatsApp Meta ativa:**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma conexão WhatsApp Meta ativa encontrada para esta empresa.",
  "dados": null
}
```

**Response 400 — nenhum destinatário:**
```json
{
  "sucesso": false,
  "mensagem": "Nenhum destinatário informado.",
  "dados": null
}
```

---

## Ciclo de vida de uma campanha

```
Criar (POST /Criar)
       │
       ▼
  [ Rascunho ]  ──── Editar (PUT /Atualizar) ──▶ [ Rascunho ]
       │
       │  POST /{id}/disparar
       ▼
  [ Enviando ]   ← status automático durante o loop de envio
       │
       │  ao finalizar todos os destinatários
       ▼
  [ Finalizada ]
       │
       │  soft delete
       ▼
   (removida via DELETE /Remover/{id})
```

| Status | Pode editar | Pode disparar | Pode remover |
|--------|:-----------:|:-------------:|:------------:|
| `Rascunho` | ✅ | ✅ | ✅ |
| `Enviando` | ✅ (via PUT) | ❌ | ✅ |
| `Finalizada` | ✅ (via PUT) | ❌ | ✅ |

> Para re-disparar uma campanha `Finalizada`, use `PUT /Atualizar` para reverter o status para `Rascunho` antes de chamar `POST /{id}/disparar`.

---

## Controle de rate limit no disparo

A Meta limita o envio em **80 mensagens por segundo por número de telefone**.

**Delay entre envios**

O sistema aguarda `13 ms` entre cada mensagem, equivalente a ~76 msg/s — com margem segura abaixo do limite da Meta.

**Retry com backoff exponencial**

Se a Meta retornar código `130429` (rate limit hit) ou `131056` (message volume exceeded), o sistema tenta novamente automaticamente:

| Tentativa | Aguarda antes de tentar |
|-----------|------------------------|
| 1ª | — |
| 2ª retry | 1 segundo |
| 3ª retry | 2 segundos |
| Esgotado | registra como `"falha"` |

> O delay e o número máximo de tentativas (`3`) são fixados no servidor — não é possível configurá-los pelo request.

> **Tiers de conta Meta:** O limite de 80 msg/s é por sessão (throughput). O limite **diário** varia por tier: Tier 1 = 1.000/dia, Tier 2 = 10.000/dia, Tier 3 = 100.000/dia, Tier 4 = ilimitado. Verifique o tier no [Meta Business Manager](https://business.facebook.com).

---

## Estrutura dos componentes (parâmetros variáveis)

### Variáveis do BODY — por destinatário (`variaveis`)

Use `variaveis` no destinatário para personalizar o BODY individualmente. A ordem dos valores corresponde à ordem dos placeholders no template.

```json
"destinatarios[*].variaveis": ["Maria", "15/06/2026", "14:00"]
// {{1}} = "Maria"  |  {{2}} = "15/06/2026"  |  {{3}} = "14:00"
```

### Componentes compartilhados (`componentes`)

Use `componentes` para HEADER e BUTTON — iguais para todos os destinatários. Envie apenas os componentes que possuem variáveis no template.

```json
"componentes": [
  {
    "tipo": "HEADER",
    "parametros": [
      { "tipo": "text", "texto": "valor da variável {{1}} do header" }
    ]
  },
  {
    "tipo": "BUTTON",
    "indicesBotao": 0,
    "parametros": [
      { "tipo": "text", "texto": "sufixo da URL dinâmica do botão 0" }
    ]
  }
]
```

> Se um destinatário tiver `variaveis`, qualquer componente BODY em `componentes` é ignorado para ele. Se não tiver `variaveis`, o BODY de `componentes` é usado (compatibilidade com envios sem personalização).

**Tipos de componente (`tipo`):**

| Valor | Descrição |
|-------|-----------|
| `HEADER` | Cabeçalho do template (aceita variáveis apenas quando formato for `TEXT`) |
| `BODY` | Corpo principal — onde ficam as variáveis `{{1}}`, `{{2}}`... |
| `BUTTON` | Botão com URL dinâmica. Use `indicesBotao` para indicar qual botão (começa em `0`) |

**Tipos de parâmetro (`parametros[*].tipo`):**

| Valor | Uso |
|-------|-----|
| `text` | Texto simples. Preencha o campo `texto` |
| `image` | Imagem no header (a URL da mídia é enviada no disparo pela Meta — não implementado neste endpoint) |
| `video` | Vídeo no header (mesma observação acima) |
| `document` | Documento no header (mesma observação acima) |

---

## Referências

| Recurso | URL |
|---------|-----|
| Gerenciar templates | [meta-template.md](meta-template.md) |
| Envio de templates (Messages API) | https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates |
| Componentes de template | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#template-object |
| Códigos de erro da Meta | https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes |
| Tiers de conta WhatsApp Business | https://developers.facebook.com/docs/whatsapp/api/rate-limits |
