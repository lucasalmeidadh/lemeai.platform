# OportunidadeVenda — Documentação de Endpoints

Base URL: `/api/oportunidadevenda`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).
`usuarioId`, `usuarioRole` e `empresaId` são extraídos automaticamente do token JWT.

**Enums:**

| `PlataformaEnum` | Valor |
|-------------------|-------|
| WhatsappMeta | `1` |
| WhatsappEvolution | `2` |
| Instagram | `3` |
| FacebookMessenger | `4` |
| LeadAds | `5` |
| Manual | `6` |

| `StatusConversaEnum` | Valor |
|----------------------|-------|
| AtendimentoIA | `1` |
| NaoIniciado | `2` |
| VendaFechada | `3` |
| PropostaEnviada | `4` |
| EmNegociacao | `5` |
| VendaPerdida | `6` |
| AtendimentoIAFinalizado | `8` |

---

## Leitura

### GET `/api/oportunidadevenda/BuscarTodas`

Retorna todas as oportunidades de venda (conversas) do vendedor autenticado — ou de toda a empresa, se o usuário for admin (`role == 1`). Inclui tanto oportunidades nascidas de conversas (WhatsApp/Instagram/Lead Ads) quanto oportunidades manuais (`PlatformType == Manual`).

Filtros aplicados internamente:
- `BranchId` (multi-tenancy)
- `AssignedUserid` (se não for admin) ou todas as conversas da empresa (se admin)
- `ConversationCreatedat >= hoje - 30 dias`
- `(CampaignId == null || existe mensagem enviada pelo cliente)`

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Oportunidades de venda encontradas com sucesso.",
  "dados": [
    {
      "idConversa": 42,
      "idContato": 17,
      "nomeContato": "Maria Souza",
      "numeroWhatsapp": "5511999990000",
      "dataConversaCriada": "2026-06-10T14:32:00",
      "idStauts": 2,
      "descricaoStatus": "Não Iniciado",
      "nomeUsuarioResponsavel": "João Vendedor",
      "valor": 1500.0,
      "campanha": false,
      "idCampanha": null,
      "nomeCampanha": "",
      "tipoLeadId": 1,
      "dataFechamentoVenda": null,
      "idOrigemOportunidade": 1,
      "descricaoOrigemOportunidade": "Whatsapp"
      "detalhesConversa": [
        {
          "idDetalhe": 5,
          "idConversa": 42,
          "descricaoDetalhe": "Cliente indicado por outro cliente, vai retornar amanhã.",
          "dataDetalheCriado": "2026-06-10T14:33:00",
          "idUsuarioCriador": 3,
          "nomeUsuarioCriador": "João Vendedor"
        }
      ]
    }
  ]
}
```

**Response 400 (nenhuma encontrada):**
```json
{
  "sucesso": false,
  "mensagem": "Nenhuma oportunidade de venda encontrada.",
  "dados": null
}
```

---

## Criação

### POST `/api/oportunidadevenda/Criar`

Cria uma oportunidade de venda **manual**, sem vínculo com mensageria (WhatsApp/Instagram/Lead Ads). Útil para registrar contatos feitos por telefone, indicação, evento presencial, etc.

A oportunidade criada é, internamente, uma `Conversa` com `PlatformType = Manual (6)`, `StatusId = NaoIniciado (2)` e `ExternalSenderId` sintético no formato `6_{Guid}`. O `ConversationId` retornado pode ser usado normalmente nos endpoints já existentes de documentos, produtos, detalhes, tarefas e ligações.

**Regras:**
- `ContatoNovo = true` → o objeto `contato` é obrigatório, com `nome` preenchido. Se já existir um contato com o `telefone` informado na empresa, ele é reaproveitado (não duplica).
- `ContatoNovo = false` → `contatoId` é obrigatório e deve pertencer à empresa do usuário autenticado.
- `usuarioResponsavelId` é opcional — se não informado, o vendedor responsável é o próprio usuário autenticado.
- Não há campo de status inicial: toda oportunidade manual é criada com `StatusId = NaoIniciado (2)`.
- Se `observacao` for informada, cria automaticamente um `DetalheConversa` vinculado à oportunidade.
- `camposPersonalizados` é opcional — permite preencher os valores dos [Campos Personalizados](../campos-personalizados/especificacao.md) da empresa no mesmo payload da criação, evitando uma segunda chamada a `PUT /api/campopersonalizadovalor/PreencherValores/{conversaId}`. Cada item segue o mesmo formato usado em `PreencherValores`: `{ "campoPersonalizadoId": int, "valor": string }`.
  - A validação (obrigatoriedade, formato, opção válida) ocorre **antes** de criar o `Contato`/`Conversa` — se algum valor for inválido, a requisição retorna erro e **nada é criado** (nem contato, nem conversa).
  - Se a validação passar, o preenchimento dos valores ocorre **depois** da conversa já estar criada. Numa falha de preenchimento nesse ponto (cenário raro de corrida, ex: campo removido entre a validação e o preenchimento), a oportunidade **não é desfeita** — o erro é apenas logado, e o vendedor pode preencher os campos depois pelo endpoint `PreencherValores` já existente.
  - Se omitido ou vazio, o comportamento é idêntico ao atual: nenhum campo personalizado é preenchido na criação.

#### Request Body — `ContatoNovo = true` (criando um novo contato)

```json
{
  "contatoNovo": true,
  "contatoId": null,
  "contato": {
    "nome": "Carlos Pereira",
    "telefone": "5511988887777",
    "email": "carlos.pereira@email.com"
  },
  "usuarioResponsavelId": null,
  "tipoLeadId": 1,
  "valor": 2500.0,
  "observacao": "Cliente conhecido pessoalmente em evento, demonstrou interesse no plano premium.",
  "camposPersonalizados": [
    { "campoPersonalizadoId": 3, "valor": "Indicação" },
    { "campoPersonalizadoId": 7, "valor": "2026-06-18" }
  ]
}
```

#### Request Body — `ContatoNovo = false` (vinculando a um contato existente)

```json
{
  "contatoNovo": false,
  "contatoId": 17,
  "contato": null,
  "usuarioResponsavelId": 8,
  "tipoLeadId": 2,
  "valor": 800.0,
  "observacao": null,
  "camposPersonalizados": null
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Oportunidade de venda criada com sucesso.",
  "dados": 57
}
```

> `dados` é o `ConversationId` da oportunidade recém-criada.

**Response 400 — contato novo sem nome:**
```json
{
  "sucesso": false,
  "mensagem": "Para criar um novo contato, informe o objeto Contato com ao menos o Nome.",
  "dados": null
}
```

**Response 400 — sem ContatoId e sem ContatoNovo:**
```json
{
  "sucesso": false,
  "mensagem": "Informe o ContatoId de um contato existente (ou ContatoNovo = true com os dados do novo contato).",
  "dados": null
}
```

**Response 400 — contato não encontrado/não pertence à empresa:**
```json
{
  "sucesso": false,
  "mensagem": "Contato não encontrado.",
  "dados": null
}
```

**Response 400 — campo personalizado inválido (validado antes de criar contato/conversa):**
```json
{
  "sucesso": false,
  "mensagem": "O campo \"Origem do Lead\" é obrigatório.",
  "dados": null
}
```

**Response 400 — erro inesperado:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao criar oportunidade de venda.",
  "dados": null
}
```

---

## Próximos passos após a criação

Após criar a oportunidade manual e obter o `ConversationId` (campo `dados` da resposta de `Criar`), o vendedor pode usar os endpoints já existentes para enriquecer a oportunidade:

| Recurso | Endpoint | Observação |
|---------|----------|-----------|
| Documentos/anexos | `ContatoController` (`ContatoAnexo`) | usa `ContatoId` + `ConversaId` (opcional) |
| Produtos negociados | `ConversaProdutoRepositorio` (via `ChatController`/produto) | usa `ConversaId` |
| Detalhes/observações | `DetalheConversaRepositorio` | usa `ConversationId` |
| Tarefas (ligação/e-mail/reunião) | `POST /api/tarefa/Criar` | usa `TarefaConversaId` |
| Ligações | `POST /api/ligacao/Criar` | usa `ConversaId` |
| Atualizar status | `PATCH /api/chat/Conversas/{id}/AtualizarStatus` | bloqueado para `StatusConversaEnum.AtendimentoIA` quando `ehManual = true` |
| Encaminhar para outro vendedor | `PATCH /api/chat/.../AtualizarConversaEncaminharVendedor` | igual ao fluxo normal |

---

## Observações para o Front-end

- Quando `idOportunidadeVenda = 6`, ocultar a aba de "Conversa/Chat" do card de oportunidade (não há mensagens), exibindo apenas Detalhes, Produtos, Documentos, Tarefas e Ligações.
- Oportunidades manuais **não aparecem** em `GET /api/chat/ConversasPorVendedor` (caixa de entrada de conversas) — apenas em `GET /api/oportunidadevenda/BuscarTodas`.
- `numeroWhatsapp` reflete `CustomerPhoneNumber` da conversa (telefone do contato resolvido na criação), não o `ExternalSenderId` sintético.
