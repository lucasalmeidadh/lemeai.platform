# Bot de IA — Endpoints de Toggle e Consulta

Base URL: `/api/RegrasIA`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
`empresaId` é extraído automaticamente do token JWT — não enviar no body.

---

## Habilitar / Desabilitar o Bot

### PATCH `/api/RegrasIA/AlternarBot`

Liga ou desliga o bot de IA para a empresa do usuário autenticado.  
Quando desabilitado, mensagens recebidas via webhook são desviadas para atendimento humano imediatamente. Conversas que estavam em `AtendimentoIA` migram automaticamente para `NaoIniciado`.

**Request:**
```http
PATCH /api/RegrasIA/AlternarBot
Authorization: Bearer <token>
Content-Type: application/json

{
  "botAtivo": false
}
```

**Response 200 — desabilitado com sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Bot de IA desabilitado com sucesso.",
  "dados": null
}
```

**Response 200 — habilitado com sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Bot de IA ativado com sucesso.",
  "dados": null
}
```

**Response 400 — empresa sem configuração de IA:**
```json
{
  "sucesso": false,
  "mensagem": "Configuração de agente de IA não encontrada para esta empresa.",
  "dados": null
}
```

**Response 400 — erro interno:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao alterar o estado do bot de IA, tente novamente.",
  "dados": null
}
```

---

## Consultar configuração atual (inclui status do bot)

### GET `/api/RegrasIA/BuscarConfigAgente`

Retorna a configuração ativa do agente de IA da empresa, incluindo o campo `botAtivo` que indica se o bot está ligado.

**Request:** sem body.

```http
GET /api/RegrasIA/BuscarConfigAgente
Authorization: Bearer <token>
```

**Response 200 — configuração encontrada:**
```json
{
  "sucesso": true,
  "mensagem": "Regras de IA encontradas com sucesso.",
  "dados": {
    "id": 3,
    "descricaoCabecalho": "Você é um assistente de vendas da empresa X...",
    "descricaoRodape": "Sempre finalize sugerindo agendar uma reunião.",
    "botAtivo": true,
    "regras": [
      {
        "id": 12,
        "descricaoRegra": "Nunca mencionar concorrentes.",
        "ordem": 1
      },
      {
        "id": 13,
        "descricaoRegra": "Responder sempre em português.",
        "ordem": 2
      }
    ]
  }
}
```

**Response 200 — empresa sem configuração:**
```json
{
  "sucesso": true,
  "mensagem": "Nenhuma regra de IA encontrada.",
  "dados": null
}
```

---

## Fluxo recomendado no front-end

```
1. GET /api/RegrasIA/BuscarConfigAgente
   → ler dados.botAtivo para renderizar o toggle na tela

2. Usuário altera o toggle:
   PATCH /api/RegrasIA/AlternarBot  { "botAtivo": <novo valor> }
   → em caso de sucesso, atualizar o estado local sem novo GET
```
