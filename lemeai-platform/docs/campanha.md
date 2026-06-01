# Campanha — Endpoints HTTP

Base URL: `/api/Campanha`

Todos os endpoints requerem autenticação via `Authorization: Bearer <token>`.

---

## Índice

1. [Criar campanha](#1-criar-campanha)
2. [Buscar todas as campanhas](#2-buscar-todas-as-campanhas)
3. [Resumo de métricas](#3-resumo-de-métricas)
4. [Atualizar campanha](#4-atualizar-campanha)
5. [Remover campanha](#5-remover-campanha)
6. [Buscar destinatários do rascunho](#6-buscar-destinatários-do-rascunho)
7. [Adicionar destinatários ao rascunho](#7-adicionar-destinatários-ao-rascunho)
8. [Remover destinatário do rascunho](#8-remover-destinatário-do-rascunho)
9. [Disparar campanha](#9-disparar-campanha)
10. [Conversas geradas pela campanha](#10-conversas-geradas-pela-campanha)

---

## 1. Criar campanha

Cria uma nova campanha no status **Rascunho**. Nenhuma mensagem é enviada neste momento.

```
POST /api/Campanha/Criar
```

### Body

```json
{
  "nome": "Promoção Black Friday",
  "templateNome": "black_friday_2025",
  "templateIdioma": "pt_BR",
  "categoria": "MARKETING",
  "agendadaEm": null
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | sim | Nome interno da campanha |
| `templateNome` | string | sim | Nome exato do template aprovado no WhatsApp Business |
| `templateIdioma` | string | sim | Código do idioma do template (padrão: `pt_BR`) |
| `categoria` | string | sim | Categoria Meta: `MARKETING`, `UTILITY` ou `AUTHENTICATION` |
| `agendadaEm` | datetime? | não | Data/hora de agendamento (informativo, não dispara automaticamente) |

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Campanha criada com sucesso.",
  "dados": {
    "campanhaId": 12,
    "campanhaNome": "Promoção Black Friday",
    "campanhaTemplateNome": "black_friday_2025",
    "campanhaTemplateIdioma": "pt_BR",
    "campanhaCategoria": "MARKETING",
    "campanhaStatus": "Rascunho",
    "campanhaAgendadaEm": null,
    "campanhaCreatedat": "2025-11-01T10:00:00Z"
  }
}
```

---

## 2. Buscar todas as campanhas

Retorna todas as campanhas da empresa. Use para listar na tela principal de campanhas.

```
GET /api/Campanha/BuscarTodos
```

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Campanhas encontradas.",
  "dados": [
    {
      "campanhaId": 12,
      "campanhaNome": "Promoção Black Friday",
      "campanhaTemplateNome": "black_friday_2025",
      "campanhaTemplateIdioma": "pt_BR",
      "campanhaCategoria": "MARKETING",
      "campanhaStatus": "Rascunho",
      "campanhaAgendadaEm": null,
      "campanhaCreatedat": "2025-11-01T10:00:00Z"
    },
    {
      "campanhaId": 11,
      "campanhaNome": "Boas-vindas Outubro",
      "campanhaTemplateNome": "boas_vindas_v2",
      "campanhaTemplateIdioma": "pt_BR",
      "campanhaCategoria": "UTILITY",
      "campanhaStatus": "Finalizada",
      "campanhaAgendadaEm": null,
      "campanhaCreatedat": "2025-10-01T08:30:00Z"
    }
  ]
}
```

**Status possíveis:** `Rascunho` → `Enviando` → `Finalizada`

---

## 3. Resumo de métricas

Retorna as campanhas com contadores de disparos e interações. Use para o painel/dashboard de campanhas.

```
GET /api/Campanha/ResumoMetricas
```

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Métricas encontradas.",
  "dados": [
    {
      "campanhaId": 11,
      "campanhaNome": "Boas-vindas Outubro",
      "campanhaTemplateNome": "boas_vindas_v2",
      "campanhaCategoria": "UTILITY",
      "campanhaStatus": "Finalizada",
      "campanhaCreatedat": "2025-10-01T08:30:00Z",
      "totalDisparado": 150,
      "totalComInteracao": 42,
      "percentualInteracao": 28.0
    }
  ]
}
```

| Campo | Descrição |
|-------|-----------|
| `totalDisparado` | Total de mensagens enviadas na campanha |
| `totalComInteracao` | Quantos destinatários responderam (abriram conversa) |
| `percentualInteracao` | `(totalComInteracao / totalDisparado) * 100` |

---

## 4. Atualizar campanha

Edita os dados da campanha. Só funciona enquanto a campanha estiver em **Rascunho**.

```
PUT /api/Campanha/Atualizar
```

### Body

```json
{
  "campanhaId": 12,
  "nome": "Promoção Black Friday 2025",
  "templateNome": "black_friday_2025",
  "templateIdioma": "pt_BR",
  "categoria": "MARKETING",
  "status": "Rascunho",
  "agendadaEm": null
}
```

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Campanha atualizada com sucesso.",
  "dados": null
}
```

---

## 5. Remover campanha

Faz soft delete da campanha. Ela deixa de aparecer nas listagens.

```
DELETE /api/Campanha/Remover/{id}
```

### Exemplo

```
DELETE /api/Campanha/Remover/12
```

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Campanha removida com sucesso.",
  "dados": null
}
```

---

## 6. Buscar destinatários do rascunho

Lista os destinatários salvos como rascunho para a campanha. Use para exibir e gerenciar quem vai receber a mensagem antes de disparar.

```
GET /api/Campanha/{campanhaId}/destinatarios
```

### Exemplo

```
GET /api/Campanha/12/destinatarios
```

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Destinatários encontrados.",
  "dados": [
    {
      "destinatarioId": 101,
      "numero": "5511999990001",
      "bsuid": null,
      "variaveis": ["João", "R$ 50,00"]
    },
    {
      "destinatarioId": 102,
      "numero": "5511999990002",
      "bsuid": null,
      "variaveis": ["Maria", "R$ 80,00"]
    },
    {
      "destinatarioId": 103,
      "numero": null,
      "bsuid": "55119999900031234",
      "variaveis": null
    }
  ]
}
```

| Campo | Descrição |
|-------|-----------|
| `destinatarioId` | ID do destinatário no rascunho (use para remover individualmente) |
| `numero` | Número de telefone no formato internacional (sem `+`) |
| `bsuid` | Identificador BSUID para contatos já existentes no sistema |
| `variaveis` | Valores para preencher as variáveis `{{1}}`, `{{2}}` do template |

---

## 7. Adicionar destinatários ao rascunho

Adiciona uma lista de destinatários ao rascunho da campanha. Pode ser chamado várias vezes para adicionar em lotes. Só funciona enquanto a campanha estiver em **Rascunho**.

```
POST /api/Campanha/{campanhaId}/destinatarios
```

### Exemplo

```
POST /api/Campanha/12/destinatarios
```

### Body

```json
{
  "destinatarios": [
    {
      "numero": "5511999990001",
      "variaveis": ["João", "R$ 50,00"]
    },
    {
      "numero": "5511999990002",
      "variaveis": ["Maria", "R$ 80,00"]
    },
    {
      "bsuid": "55119999900031234"
    }
  ]
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `numero` | string? | Telefone no formato internacional, sem `+` (ex: `5511999990001`) |
| `bsuid` | string? | BSUID do contato — use quando o contato já existe no sistema |
| `variaveis` | string[]? | Valores das variáveis do template: `variaveis[0]` → `{{1}}`, `variaveis[1]` → `{{2}}`, etc. |

> Cada destinatário deve ter pelo menos `numero` **ou** `bsuid`.

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "3 destinatário(s) adicionado(s).",
  "dados": {
    "total": 3
  }
}
```

### Resposta de erro — campanha não está em Rascunho `400`

```json
{
  "sucesso": false,
  "mensagem": "Só é possível editar destinatários de campanhas no status 'Rascunho'. Status atual: Finalizada.",
  "dados": null
}
```

---

## 8. Remover destinatário do rascunho

Remove um destinatário específico do rascunho pelo seu ID. Só funciona enquanto a campanha estiver em **Rascunho**.

```
DELETE /api/Campanha/{campanhaId}/destinatarios/{destinatarioId}
```

### Exemplo

```
DELETE /api/Campanha/12/destinatarios/101
```

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Destinatário removido com sucesso.",
  "dados": null
}
```

---

## 9. Disparar campanha

Envia o template WhatsApp para todos os destinatários. A campanha muda de `Rascunho` → `Enviando` → `Finalizada`.

```
POST /api/Campanha/{id}/disparar
```

Há **duas formas** de usar este endpoint:

---

### Forma 1 — Usar o rascunho salvo (recomendado)

Se você já adicionou os destinatários via [endpoint 7](#7-adicionar-destinatários-ao-rascunho), basta disparar sem body.

```
POST /api/Campanha/12/disparar
```

Body vazio ou:

```json
{
  "componentes": [
    {
      "tipo": "HEADER",
      "parametros": [
        {
          "tipo": "image",
          "imagem": { "id": "1234567890" }
        }
      ]
    }
  ]
}
```

---

### Forma 2 — Enviar destinatários direto no disparo

Passa a lista de destinatários junto com o disparo, sem precisar salvar rascunho antes.

```
POST /api/Campanha/12/disparar
```

```json
{
  "destinatarios": [
    {
      "numero": "5511999990001",
      "variaveis": ["João", "R$ 50,00"]
    },
    {
      "numero": "5511999990002",
      "variaveis": ["Maria", "R$ 80,00"]
    }
  ],
  "componentes": [
    {
      "tipo": "HEADER",
      "parametros": [
        {
          "tipo": "image",
          "imagem": { "link": "https://exemplo.com/banner.jpg" }
        }
      ]
    },
    {
      "tipo": "BUTTON",
      "indicesBotao": 0,
      "parametros": [
        {
          "tipo": "text",
          "texto": "Ver oferta"
        }
      ]
    }
  ]
}
```

### Campos do body

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `destinatarios` | array? | Lista de destinatários. Se omitido, usa o rascunho salvo |
| `componentes` | array? | Componentes compartilhados por todos (HEADER, BUTTON). BODY pode ser personalizado por destinatário via `variaveis` |

#### Componente

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tipo` | string | `HEADER`, `BODY` ou `BUTTON` |
| `subTipo` | string? | Sub-tipo do botão. Obrigatório para tipo `BUTTON`: `COPY_CODE`, `URL` ou `QUICK_REPLY` |
| `indicesBotao` | int? | Índice do botão dentro da lista de botões do template (0-based) |
| `parametros` | array? | Lista de parâmetros do componente |

#### Parâmetro

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tipo` | string | `text`, `image`, `video`, `document` ou `coupon_code` |
| `texto` | string? | Valor para parâmetro de texto |
| `codigoCupom` | string? | Código real de oferta (usado quando `tipo` = `coupon_code`) |
| `imagem` | objeto? | `{ "id": "..." }` ou `{ "link": "https://..." }` |
| `video` | objeto? | `{ "id": "..." }` ou `{ "link": "https://..." }` |
| `documento` | objeto? | `{ "id": "..." }` ou `{ "link": "https://..." }` |

### Forma 3 — Template com botão de código de oferta (COPY_CODE)

Quando o template tem um botão `COPY_CODE`, passe o código real no componente `BUTTON` com `subTipo: "COPY_CODE"`.

```json
POST /api/Campanha/15/disparar
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "componentes": [
    {
      "tipo": "BODY",
      "parametros": [
        { "tipo": "text", "texto": "João" },
        { "tipo": "text", "texto": "20%" }
      ]
    },
    {
      "tipo": "BUTTON",
      "subTipo": "COPY_CODE",
      "indicesBotao": 0,
      "parametros": [
        {
          "tipo": "coupon_code",
          "codigoCupom": "BLACK30"
        }
      ]
    }
  ]
}
```

> - `subTipo` identifica o tipo de botão para a Meta (`COPY_CODE`, `URL`, `QUICK_REPLY`)
> - `indicesBotao` é o índice do botão na lista definida no template (começa em `0`)
> - `codigoCupom` é o código que o usuário verá e poderá copiar ao clicar no botão

---

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Disparo concluído. 2 enviados, 0 falhas.",
  "dados": {
    "totalDestinatarios": 2,
    "totalEnviados": 2,
    "totalFalhas": 0
  }
}
```

### Resposta de erro — sem destinatários `400`

```json
{
  "sucesso": false,
  "mensagem": "Nenhum destinatário informado e nenhum rascunho salvo para esta campanha.",
  "dados": null
}
```

### Resposta de erro — status inválido `400`

```json
{
  "sucesso": false,
  "mensagem": "Só é possível disparar campanhas no status 'Rascunho'. Status atual: Finalizada.",
  "dados": null
}
```

---

## 10. Conversas geradas pela campanha

Lista as conversas criadas pelos disparos da campanha, com paginação. Use para acompanhar quem recebeu e quem interagiu.

```
GET /api/Campanha/{campanhaId}/conversas?pagina=1&porPagina=20
```

### Exemplo

```
GET /api/Campanha/12/conversas?pagina=1&porPagina=20
```

### Parâmetros de query

| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| `pagina` | `1` | Número da página |
| `porPagina` | `20` | Itens por página |

### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Disparos encontrados.",
  "dados": {
    "itens": [
      {
        "disparoId": 5001,
        "contatoId": 88,
        "conversaId": 210,
        "disparoNumero": "5511999990001",
        "disparoStatus": "lido",
        "teveInteracao": true,
        "disparoEnviadoEm": "2025-11-01T10:05:00Z",
        "disparoEntregueEm": "2025-11-01T10:05:03Z",
        "disparoLidoEm": "2025-11-01T10:08:45Z"
      },
      {
        "disparoId": 5002,
        "contatoId": 89,
        "conversaId": null,
        "disparoNumero": "5511999990002",
        "disparoStatus": "entregue",
        "teveInteracao": false,
        "disparoEnviadoEm": "2025-11-01T10:05:00Z",
        "disparoEntregueEm": "2025-11-01T10:05:04Z",
        "disparoLidoEm": null
      }
    ],
    "total": 2,
    "pagina": 1,
    "porPagina": 20
  }
}
```

| Campo | Descrição |
|-------|-----------|
| `disparoStatus` | `enviado`, `entregue`, `lido` ou `falha` |
| `teveInteracao` | `true` se o destinatário respondeu e gerou conversa |
| `conversaId` | ID da conversa criada; `null` se não houve resposta |

---

## Fluxo completo recomendado

```
1. POST /Criar                         → cria a campanha (status: Rascunho)
2. POST /{id}/destinatarios            → adiciona destinatários ao rascunho
3. DELETE /{id}/destinatarios/{destId} → remove destinatários se necessário
4. GET /{id}/destinatarios             → confere a lista final
5. POST /{id}/disparar                 → dispara (lê o rascunho salvo)
6. GET /{id}/conversas                 → acompanha resultados
7. GET /ResumoMetricas                 → vê taxa de interação
```
