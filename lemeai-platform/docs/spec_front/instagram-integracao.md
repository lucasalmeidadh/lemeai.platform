# Integração Instagram / Meta — Plano de Implementação

> Documento técnico descrevendo **o que pode ser recebido via webhooks da Meta**, **o que precisar ser configurado** e **o que precisa ser implementado no sistema** para suportar múltiplas origens: WhatsApp, Instagram DMs, Comentários, Lead Ads e mais.

---

## Parte 0 — O que o Webhook da Meta pode entregar (visão geral)

A Meta entrega eventos em **dois níveis de objeto**. Cada nível tem campos (fields) que você escolhe subscrever:

| Objeto (`object`) | Campo (`field`) | O que é | Relevância CRM |
|-------------------|-----------------|---------|----------------|
| `instagram` | `messages` | DMs recebidos + respostas de story | ⭐⭐⭐ Alta |
| `instagram` | `messaging_referral` | Clique em link ig.me que abre conversa | ⭐⭐ Média |
| `instagram` | `comments` | Comentários em posts + menções | ⭐⭐ Média |
| `page` | `leadgen` | Formulário de lead preenchido (Instagram Ads + Facebook Ads) | ⭐⭐⭐ Alta |
| `page` | `messages` | DMs diretos na Página do Facebook | ⭐⭐ Média |

> **Importante:** o `leadgen` vem no objeto `page` (Página do Facebook), **não** no objeto `instagram`. Você precisa de subscrição separada.

---

## Parte 1 — Detalhamento de Cada Tipo de Evento

### 1.1 Instagram DMs (`object: instagram`, `field: messages`)

O caso principal — quando um cliente manda uma mensagem direta para o perfil Instagram da empresa.

**Story Replies também chegam aqui** — quando alguém responde a um story, o payload tem o mesmo formato de mensagem, mas inclui uma referência ao story. O sistema pode tratar igual a um DM normal.

**Payload:**
```json
{
  "object": "instagram",
  "entry": [{
    "id": "IGID_DA_EMPRESA",
    "time": 1700000000,
    "messaging": [{
      "sender": { "id": "IGSID_DO_CLIENTE" },
      "recipient": { "id": "IGID_DA_EMPRESA" },
      "timestamp": 1700000000,
      "message": {
        "mid": "mid.$abc123",
        "text": "Olá, quero saber mais sobre o produto X"
      }
    }]
  }]
}
```

**Identificadores:**
- `entry[].id` → **IGID** da empresa (como o `PhoneIdMeta` no WhatsApp — identifica qual empresa)
- `messaging[].sender.id` → **IGSID** do cliente (ID opaco — equivalente ao número de telefone, mas sem revelar o número real)

**API para responder:**
```
POST https://graph.instagram.com/v24.0/{IGID}/messages
Authorization: Bearer {TOKEN}
{ "recipient": { "id": "IGSID_DO_CLIENTE" }, "message": { "text": "Resposta" } }
```

**Restrição importante:** só pode responder dentro de **24 horas** após o cliente enviar a última mensagem.

---

### 1.2 Referral Link (`object: instagram`, `field: messaging_referral`)

Quando o cliente clica em um link `ig.me/m/{BUSINESS}?ref=PARAM` que abre uma conversa. Muito usado em links de bio ou campanhas.

**Diferencial:** esse evento reabre a janela de 24h, então a empresa pode iniciar a conversa.

**Payload:**
```json
{
  "object": "instagram",
  "entry": [{
    "id": "IGID_DA_EMPRESA",
    "messaging": [{
      "sender": { "id": "IGSID_DO_CLIENTE" },
      "recipient": { "id": "IGID_DA_EMPRESA" },
      "timestamp": 1700000000,
      "messaging_referral": {
        "ref": "campanha_julho_produto_x",
        "referer_type": "SHORTLINK"
      }
    }]
  }]
}
```

**Uso no CRM:** criar conversa com a origem/campanha registrada — útil para rastrear qual campanha gerou o lead.

---

### 1.3 Comentários em Posts (`object: instagram`, `field: comments`)

Quando alguém comenta em um post do perfil Instagram da empresa, ou menciona o perfil em um comentário de outra conta.

**Payload:**
```json
{
  "object": "instagram",
  "entry": [{
    "id": "IGID_DA_EMPRESA",
    "changes": [{
      "field": "comments",
      "value": {
        "comment_id": "17858893269000001",
        "media_id": "17896869649000001",
        "text": "Qual o preço disso?",
        "from": {
          "id": "IGSID_DO_CLIENTE",
          "name": "João Silva"
        }
      }
    }]
  }]
}
```

**Uso no CRM:** criar uma lead/conversa a partir de um comentário. Você pode até responder automaticamente via API:
```
POST https://graph.facebook.com/v24.0/{COMMENT_ID}/replies
{ "message": "Oi João! Manda uma DM que te passo o preço 😊" }
```

**Permissão necessária:** `instagram_manage_comments`

---

### 1.4 Lead Ads — Formulário preenchido (`object: page`, `field: leadgen`)

**Este é o mais importante para CRM.** Quando um cliente preenche um formulário de Lead Generation (anúncios do Instagram ou Facebook), a Meta notifica com um `leadgen_id`. Você então consulta a API para obter os dados completos.

**⚠️ Este evento vem no objeto `page` (Página do Facebook), não `instagram`.**

**Payload do webhook (notificação inicial):**
```json
{
  "object": "page",
  "entry": [{
    "id": "PAGE_ID",
    "time": 1700000000,
    "changes": [{
      "field": "leadgen",
      "value": {
        "leadgen_id": "123456789",
        "form_id": "987654321",
        "ad_id": "555666777",
        "created_time": 1700000000
      }
    }]
  }]
}
```

**Consulta para obter os dados do lead:**
```
GET https://graph.facebook.com/{LEADGEN_ID}/?fields=field_data,created_time,id
    &access_token={PAGE_ACCESS_TOKEN}
```

**Resposta com os dados do formulário:**
```json
{
  "id": "123456789",
  "created_time": "2024-01-15T10:30:00+0000",
  "field_data": [
    { "name": "full_name", "values": ["João Silva"] },
    { "name": "phone_number", "values": ["+5511999999999"] },
    { "name": "email", "values": ["joao@email.com"] },
    { "name": "Qual produto te interessa?", "values": ["Produto X"] }
  ]
}
```

**Permissões necessárias:** `leads_retrieval`, `ads_management` (ou `pages_manage_ads`)

**Uso no CRM:** criar automaticamente um `Contato` + `Conversa` com os dados do formulário, e notificar o vendedor.

---

### 1.5 Facebook Page DMs (`object: page`, `field: messages`)

Mensagens enviadas diretamente para a **Página do Facebook** (não o Instagram). Payload **idêntico** ao Instagram DM — a diferença é o nível de subscrição.

```json
{
  "object": "page",
  "entry": [{
    "id": "PAGE_ID",
    "messaging": [{
      "sender": { "id": "PSID_DO_CLIENTE" },
      "recipient": { "id": "PAGE_ID" },
      "message": { "text": "Mensagem pelo Facebook" }
    }]
  }]
}
```

O identificador do cliente aqui é **PSID** (Page Scoped ID) — diferente do IGSID do Instagram, mas mesma ideia.

---

## Parte 2 — Configuração na Meta (fora do código)

### 2.1 Permissões necessárias no Meta App

| Permissão | Para que serve |
|-----------|----------------|
| `instagram_basic` | Acesso básico à conta Instagram |
| `instagram_manage_messages` | Receber e responder DMs + story replies |
| `instagram_manage_comments` | Receber e responder comentários |
| `pages_messaging` | DMs pela Página do Facebook (obrigatório para usuários fora do modo dev) |
| `pages_manage_metadata` | Gerenciar configurações da página |
| `leads_retrieval` | Consultar dados de leads (formulários) |
| `ads_management` | Necessário para `leads_retrieval` em produção |

> Permissões marcadas como avançadas exigem **App Review** da Meta antes de funcionar em produção para usuários reais fora do time de desenvolvimento.

### 2.2 Vinculação da conta Instagram

A conta Instagram da empresa **precisa ser Business ou Creator** (não pessoal) e estar vinculada a uma Página do Facebook. Sem isso, nenhum webhook funciona.

1. No Instagram → Configurações → Conta → Mudar para conta profissional
2. Vincular à Página do Facebook: Instagram → Configurações → Conta → Página vinculada
3. No Meta Business Suite, conectar o app à página e à conta Instagram

### 2.3 URLs de Webhook a configurar

**Para Instagram DMs, Referrals e Comentários:**
- Registrar no Meta App Dashboard → Products → Instagram → Webhook
- URL: `https://seudominio.com/webhook/instagram`
- Verify Token: configurar no `appsettings.json` como `InstagramWebhook:VerifyToken`
- Campos a subscrever: `messages`, `messaging_referral`, `comments`

**Para Lead Ads:**
- Registrar no Meta App Dashboard → Products → Messenger → Settings (ou Webhooks da página)
- URL: `https://seudominio.com/webhook/leadads`
- Verify Token: `LeadAdsWebhook:VerifyToken`
- Campo a subscrever: `leadgen`
- **Adicionalmente**, chamar via API: `POST /{PAGE_ID}/subscribed_apps?subscribed_fields=leadgen`

> Dois webhooks separados porque os payloads têm estruturas completamente diferentes.

### 2.4 Identificadores que cada empresa precisa configurar

| Campo no sistema | O que é | Equivalente WhatsApp |
|-----------------|---------|---------------------|
| `InstagramPageId` (IGID) | ID da conta Instagram Business | `PhoneIdMeta` |
| `TokenAPIInstagram` | Page Access Token de longa duração | `TokenAPIMeta` |
| `FacebookPageId` | ID da Página do Facebook (para Lead Ads) | — |
| `TokenAPIFacebook` | Token da página (pode ser o mesmo) | `TokenAPIMeta` |

---

## Parte 3 — O que Muda no Sistema

### 3.1 Banco de Dados — Tabela `branch`

```sql
ALTER TABLE branch
  ADD COLUMN instagram_page_id      VARCHAR(50),
  ADD COLUMN token_api_instagram    TEXT,
  ADD COLUMN is_instagram_api       BOOLEAN DEFAULT FALSE,
  ADD COLUMN facebook_page_id       VARCHAR(50),
  ADD COLUMN token_api_facebook     TEXT,
  ADD COLUMN is_lead_ads_active     BOOLEAN DEFAULT FALSE;
```

### 3.2 Novos controllers (um por tipo de evento)

| Controller | Rota | Processa |
|-----------|------|---------|
| `InstagramWebhookController` | `webhook/instagram` | DMs + Story Replies + Referrals + Comentários |
| `LeadAdsWebhookController` | `webhook/leadads` | Formulários de lead |

> Pode ser um controller só com métodos separados, mas rotas diferentes ajudam a rastrear erros e configurar webhooks distintos na Meta.

### 3.3 Novos serviços necessários

**Para Instagram DMs:**
- `InstagramWebhookDto` — DTO do payload
- `IInstagramWebhookQueue` + `InstagramWebhookQueue` — fila (mesmo padrão que WhatsApp)
- `InstagramWebhookProcessor` — BackgroundService consumindo a fila
- `IInstagramWebhookService` + `InstagramWebhookService` — processa o payload
- `IEnviarMensagemInstagramService` + `EnviarMensagemInstagramService` — envia mensagem via graph.instagram.com

**Para Lead Ads:**
- `LeadAdsWebhookDto` — DTO do payload de notificação
- `ILeadAdsWebhookQueue` + `LeadAdsWebhookQueue` — fila
- `LeadAdsWebhookProcessor` — BackgroundService
- `ILeadAdsWebhookService` + `LeadAdsWebhookService` — consulta o lead na API da Meta e cria Contato + Conversa
- `IMetaLeadApiService` — faz o GET `/{leadgen_id}?fields=field_data` para buscar os dados

**Para Comentários** (pode ser parte do `InstagramWebhookService`):
- O payload de comentário vem no mesmo webhook do Instagram (`/webhook/instagram`), mas com `changes[].field = "comments"` em vez de `messaging`
- O `InstagramWebhookService` identifica o tipo pelo payload e roteia internamente

### 3.4 Extensões no fluxo existente

**`SistemaMensageriaEnum`:**
```csharp
Instagram = 3,
FacebookPage = 4   // opcional, se quiser separar DMs do Facebook Page
```

**`PerguntaDTO`:** adicionar `IsInstagramAPI`

**`EnviarMensagemDto`:** adicionar `IsInstagram`

**`ConversaTemporariaDto`:** adicionar `IsInstagram`

**`WebhookFlowService.ProcessarFluxoAsync`:** adicionar o branch Instagram:
```csharp
else if (sistema == SistemaMensageriaEnum.Instagram)
    empresa = _empresaService.BuscarEmpresaPorInstagramPageId(identificadorProvedor);
```

**`ConversaService.EnviarMensagemWhatsapp`:** adicionar o branch Instagram (ou renomear o método para `EnviarMensagem`):
```csharp
else if (mensagem.IsInstagram)
    await _instagramService.EnviarMensagemAsync(model);
```

**`Empresa` e `Branch`:** adicionar os 6 campos novos

---

## Parte 4 — Fluxo de Lead Ad (formulário preenchido)

```
Cliente preenche formulário no anúncio (Instagram ou Facebook)
        ↓
Meta dispara POST para /webhook/leadads
  { "object": "page", "changes": [{ "field": "leadgen", "value": { "leadgen_id": "..." } }] }
        ↓
LeadAdsWebhookController.Receive() → enfileira
        ↓
LeadAdsWebhookQueue → LeadAdsWebhookProcessor
        ↓
LeadAdsWebhookService.ProcessarAsync()
  1. Consulta GET /{leadgen_id}?fields=field_data
  2. Extrai nome, telefone, email, respostas custom
  3. Busca Empresa pelo PAGE_ID
  4. Cria Contato (se não existir)
  5. Cria Conversa com status = lead
  6. Notifica vendedor via ChatHandler/SignalR
```

---

## Parte 5 — Fluxo de DM Instagram (mensagem direta)

```
Cliente manda DM no Instagram
        ↓
Meta dispara POST para /webhook/instagram
  { "object": "instagram", "entry": [{ "id": "IGID", "messaging": [...] }] }
        ↓
InstagramWebhookController.Receive() → enfileira
        ↓
InstagramWebhookQueue → InstagramWebhookProcessor
        ↓
InstagramWebhookService.ProcessarAsync()
  1. Extrai IGID (identifica empresa), IGSID (identifica cliente)
  2. Monta PerguntaDTO com IsInstagramAPI = true
  3. Chama WebhookFlowService.ProcessarFluxoAsync(pergunta, Instagram, igid)
        ↓
WebhookFlowService → ChatHandler ou ObterRespostaIAHandler
        ↓ (quando IA responde)
ConversaService.EnviarMensagem(dto com IsInstagram = true)
        ↓
EnviarMensagemInstagramService
  POST graph.instagram.com/v24.0/{IGID}/messages
```

---

## Parte 6 — Fluxo de Comentário em Post

```
Alguém comenta "Qual o preço?" em um post da empresa
        ↓
Meta dispara POST para /webhook/instagram
  { "object": "instagram", "changes": [{ "field": "comments", "value": {...} }] }
        ↓
InstagramWebhookController.Receive() — mesmo endpoint do DM
        ↓
InstagramWebhookService identifica pelo campo "comments"
  Opções de tratamento:
    A) Criar uma Conversa no CRM com origem "comentário" + notificar vendedor
    B) Responder automaticamente com uma mensagem padrão ("Manda uma DM!")
    C) Ambos
```

---

## Parte 7 — Resumo de Arquivos Novos e Modificados

### Arquivos Novos (criar)

| Arquivo | Camada | Para que serve |
|---------|--------|----------------|
| `DTO/Instagram/InstagramWebhookDto.cs` | Application | Payload DM/Comentário Instagram |
| `DTO/Instagram/LeadAdsWebhookDto.cs` | Application | Payload notificação Lead Ad |
| `DTO/Instagram/LeadFormDataDto.cs` | Application | Dados do formulário retornados pela API |
| `Interfaces/Services/IInstagramWebhookQueue.cs` | Application | Interface fila DMs |
| `Interfaces/Services/IInstagramWebhookService.cs` | Application | Interface serviço DMs |
| `Interfaces/Services/ILeadAdsWebhookQueue.cs` | Application | Interface fila Lead Ads |
| `Interfaces/Services/ILeadAdsWebhookService.cs` | Application | Interface serviço Lead Ads |
| `Services/InstagramWebhookQueue.cs` | Application | Fila DMs |
| `Services/InstagramWebhookProcessor.cs` | Application | Background worker DMs |
| `Services/InstagramWebhookService.cs` | Application | Processa DMs + comentários |
| `Services/LeadAdsWebhookQueue.cs` | Application | Fila Lead Ads |
| `Services/LeadAdsWebhookProcessor.cs` | Application | Background worker Lead Ads |
| `Services/LeadAdsWebhookService.cs` | Application | Processa lead + cria contato/conversa |
| `Domain/Services/IEnviarMensagemInstagramService.cs` | Domain | Interface envio DM Instagram |
| `Domain/Services/IMetaLeadApiService.cs` | Domain | Interface consulta dados do lead |
| `Domain/Model/EnviarMensagemInstagramModel.cs` | Domain | Model envio |
| `Infraestrutura/Services/Instagram/EnviarMensagemInstagramService.cs` | Infra | Envia DM via Graph API |
| `Infraestrutura/Services/Instagram/MetaLeadApiService.cs` | Infra | Consulta leadgen_id na API |
| `WebAPI/Controllers/InstagramWebhookController.cs` | WebAPI | Recebe eventos Instagram |
| `WebAPI/Controllers/LeadAdsWebhookController.cs` | WebAPI | Recebe Lead Ad notifications |

### Arquivos Modificados (editar)

| Arquivo | O que muda |
|---------|------------|
| `SistemaMensageriaEnum.cs` | `Instagram = 3` |
| `Empresa.cs` | 6 campos novos (Instagram + Facebook Page) |
| `Branch.cs` | Mesmos 6 campos |
| `AppDbContext.cs` | Mapeamento das 6 colunas novas |
| `IEmpresaRepositorio.cs` | `BuscarEmpresaPorInstagramPageId`, `BuscarEmpresaPorFacebookPageId` |
| `EmpresaRepositorio.cs` | Implementações |
| `IEmpresaService.cs` | Mesmos métodos |
| `EmpresaService.cs` | Cache para os novos identificadores |
| `BranchProfile.cs` | Mapear campos novos nos DTOs de request/response |
| `CriarEmpresaRequest.cs` | Campos Instagram + Lead Ads |
| `AtualizarEmpresaRequest.cs` | Idem |
| `EmpresaResponse.cs` | Idem |
| `PerguntaDTO.cs` | `IsInstagramAPI` |
| `ConversaTemporariaDto.cs` | `IsInstagram` |
| `EnviarMensagemDto.cs` | `IsInstagram` |
| `WebhookFlowService.cs` | Branch Instagram |
| `ConversaService.cs` | Envio via Instagram |
| `ObterRespostaIAHandler.cs` | Propagar `IsInstagram` |
| `Program.cs` | Registrar todos os serviços novos |
| `appsettings.json` | `InstagramWebhook:VerifyToken`, `LeadAdsWebhook:VerifyToken` |

---

## Parte 8 — Ordem de Implementação Recomendada

```
Bloco 1 — Banco e modelos base
  1.  ALTER TABLE branch (6 colunas)
  2.  Empresa.cs + Branch.cs → 6 campos
  3.  AppDbContext.cs → mapeamento das colunas
  4.  BranchProfile.cs + DTOs de request/response

Bloco 2 — Repositório e service de empresa
  5.  IEmpresaRepositorio → 2 métodos novos
  6.  EmpresaRepositorio → implementações
  7.  IEmpresaService → 2 métodos novos
  8.  EmpresaService → cache

Bloco 3 — Instagram DMs
  9.  SistemaMensageriaEnum → Instagram = 3
  10. PerguntaDTO, ConversaTemporariaDto, EnviarMensagemDto → campos IsInstagram
  11. InstagramWebhookDto.cs
  12. IEnviarMensagemInstagramService + EnviarMensagemInstagramModel
  13. EnviarMensagemInstagramService (infra)
  14. IInstagramWebhookQueue + InstagramWebhookQueue
  15. InstagramWebhookProcessor
  16. IInstagramWebhookService + InstagramWebhookService
  17. WebhookFlowService → branch Instagram
  18. ConversaService → envio Instagram
  19. ObterRespostaIAHandler → propagar IsInstagram
  20. InstagramWebhookController
  21. Program.cs → registros DI

Bloco 4 — Lead Ads (pode ser feito separado, não depende do Bloco 3)
  22. LeadAdsWebhookDto + LeadFormDataDto
  23. IMetaLeadApiService + MetaLeadApiService
  24. ILeadAdsWebhookQueue + LeadAdsWebhookQueue
  25. LeadAdsWebhookProcessor
  26. ILeadAdsWebhookService + LeadAdsWebhookService
  27. LeadAdsWebhookController
  28. Program.cs → registros Lead Ads
```

> **Migration:** gerada manualmente após o Bloco 1.

---

## Fontes Consultadas

| Documento | URL |
|-----------|-----|
| Instagram Messaging API — visão geral | https://developers.facebook.com/docs/instagram-messaging/ |
| Webhooks do Instagram Platform | https://developers.facebook.com/docs/instagram-platform/webhooks/ |
| Webhooks para Instagram Messaging | https://developers.facebook.com/docs/messenger-platform/instagram/features/webhook/ |
| Messaging API com Instagram Login | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/ |
| Access Token — Instagram Platform | https://developers.facebook.com/docs/instagram-platform/reference/access_token/ |
| App Review — Instagram Platform | https://developers.facebook.com/docs/instagram-platform/app-review/ |
| Meta Webhooks — visão geral | https://developers.facebook.com/docs/graph-api/webhooks/ |
| Webhooks para Messenger Platform | https://developers.facebook.com/documentation/business-messaging/messenger-platform/webhooks |
| ig.me Links — Instagram Platform | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/ig-me/ |
| Guia de integração Instagram API | https://www.unipile.com/instagram-api-integration-the-complete-developers-guide-for-software-editors/ |
| Validação de assinatura SHA256 | https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification |
| Guia Lead Ads — Facebook | https://leadsync.me/blog/facebook-lead-ads-integration-ultimate-guide/ |
| Meta Lead Gen API | https://leadsync.me/blog/meta-lead-gen-api-guide/ |
| Setup Webhooks para Instagram Messaging | https://innocentanyaele.medium.com/setup-meta-webhooks-for-instagram-messaging-and-respond-to-message-4575bc95c7a2 |
| Automação de comentários para DM (Instagram Graph API v25) | https://medium.com/@uday.devworks/how-to-build-instagram-comment-to-dm-automation-using-instagram-graph-api-v25-0-4d898dd1c243 |
