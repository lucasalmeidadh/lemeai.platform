# Tela de Configuração do Agente IA — Especificação Front-end

> Esta doc descreve como o front-end deve construir a tela de "Configuração da IA": disposição visual, o propósito de cada campo e as requisições HTTP a fazer. Ela consolida o rascunho de produto em [nova-configuracao.md](nova-configuracao.md) com a estrutura de dados real definida em [arquitetura-tecnica.md](arquitetura-tecnica.md). **O backend descrito em `arquitetura-tecnica.md` ainda não foi implementado** — os endpoints/campos abaixo são os que existirão após essa implementação. Não é este documento que define o backend; ele apenas consome o contrato já especificado.

---

## 1. Visão geral da tela

A tela tem **duas áreas**:

1. **Configuração do Agente** (formulário único, seção "Identidade", "Base de Conhecimento" e "Fluxo de Transbordo") — um registro por empresa.
2. **Listas dinâmicas dependentes da configuração**: Regras (guardrails) e FAQ — CRUD próprio, com sua própria conexão à API, mas vinculadas ao `Id` da configuração criada no passo 1.

Isso implica uma **ordem de fluxo obrigatória**: as listas de Regras e FAQ só podem ser criadas/editadas depois que a Configuração do Agente existe (precisa de `AgentConfigId`). Ver seção 5.

### 1.1 Layout recomendado — abas (tabs)

```
┌─────────────────────────────────────────────────────────────┐
│  Configuração do Agente de IA                    [● Ativo]  │ ← switch BotAtivo, sempre visível
├─────────────────────────────────────────────────────────────┤
│  [ Identidade ]  [ Base de Conhecimento ]  [ FAQ ]  [ Regras ]│ ← abas
├─────────────────────────────────────────────────────────────┤
│                                                                │
│   (conteúdo da aba ativa)                                     │
│                                                                │
├─────────────────────────────────────────────────────────────┤
│                                          [Cancelar] [Salvar]   │
└─────────────────────────────────────────────────────────────┘
```

- O switch **"Bot Ativo/Inativo"** fica fixo no cabeçalho, fora das abas — é a ação mais frequente (ligar/desligar o atendimento por IA) e não deve exigir navegação.
- **Identidade** e **Base de Conhecimento** e **Fluxo de Transbordo** (campo único) fazem parte do mesmo formulário/registro (`AgentConfig`) — o botão **Salvar** do rodapé salva os três juntos em uma única requisição.
- **FAQ** e **Regras** são abas com CRUD próprio (lista + botão "+Adicionar", edição inline ou modal) — cada item salva individualmente, sem depender do botão "Salvar" do rodapé.

### 1.2 Distribuição de campos por aba

| Aba | Campos |
|---|---|
| Identidade | Nome do Assistente (`AgentName`), Tom de Voz (`TomVoz`), Objetivo Principal (`ObjetivoPrincipal`) |
| Base de Conhecimento | Sobre a Empresa (`AboutCompany`), Instruções Adicionais (`AdditionalInstructions`), Catálogo/Serviços (somente leitura, informativo) |
| FAQ | Lista dinâmica de Pergunta/Resposta (`Faqs`) |
| Regras | Lista dinâmica de restrições (`Rules`) + campo único de Condições de Transbordo (`TransferConditions`) |

> Colocamos "Condições de Transbordo" na aba **Regras** porque semanticamente é uma regra de comportamento (quando parar de responder e chamar humano), não conhecimento de negócio — mais intuitivo para o usuário final do que uma quinta aba dedicada só para isso.

---

## 2. Campos — o que cada um significa e como exibir

### 2.1 Aba Identidade

| Campo | Tipo de input | Obrigatório | Descrição para o usuário | Observações de UI |
|---|---|---|---|---|
| **Nome do Assistente** (`AgentName`) | Texto curto (1 linha) | Sim | Nome que o agente usa para se apresentar na conversa com o cliente (ex: "João", "Ana"). | `maxLength=255`. Ajuda contextual: "Use um nome próprio real. Apelidos, elogios ou nomes de time serão ignorados pela IA." — reflete a regra fixa do prompt (`PromptBuilderService`) que só permite nome próprio de pessoa. |
| **Tom de Voz** (`TomVoz`) | Dropdown/Select | Sim | Como a IA deve se comunicar. | Ver enum na tabela 2.1.1 abaixo. Enviar o `int` do enum, exibir o rótulo em português. Cada opção tem um ícone **ⓘ** ao lado — ao passar o mouse (tooltip) ou tocar (mobile), mostrar a frase exata que o backend injeta no prompt (coluna "O que a IA realmente recebe"), para o usuário entender o efeito prático da escolha antes de salvar. |
| **Objetivo Principal** (`ObjetivoPrincipal`) | Dropdown/Select | Sim | O que a IA deve priorizar durante a conversa. | Ver enum na tabela 2.1.2 abaixo. Mesmo padrão de tooltip do campo acima. |

**2.1.1 — `TomVozEnum`**

O texto da coluna "O que a IA realmente recebe" é gerado por `PromptBuilderService.DescreverTomVoz` e injetado no prompt como `"Tom de voz: {texto}."` — é literalmente isso que a IA lê, então a tooltip deve reproduzir esse texto (não uma paráfrase), para o usuário nunca ser surpreendido pelo comportamento do agente.

| Valor enviado (int) | Rótulo exibido no dropdown | O que a IA realmente recebe (texto do tooltip) |
|---|---|---|
| `1` | Profissional | "profissional e formal" |
| `2` | Descontraído | "descontraído e casual" |
| `3` | Focado em Conversão | "focado em conversão, direto e persuasivo" |
| `4` | Empático | "empático e acolhedor" |

**2.1.2 — `ObjetivoPrincipalEnum`**

O texto da coluna "O que a IA realmente recebe" vem de `PromptBuilderService.DescreverObjetivoPrincipal`, injetado como `"Objetivo principal: {texto}."`.

| Valor enviado (int) | Rótulo exibido no dropdown | O que a IA realmente recebe (texto do tooltip) |
|---|---|---|
| `1` | Qualificar leads | "qualificar leads antes de encaminhar para um vendedor" |
| `2` | Suporte técnico | "prestar suporte técnico aos clientes" |
| `3` | Vender produtos | "vender produtos/serviços diretamente na conversa" |
| `4` | Tirar dúvidas | "tirar dúvidas gerais sobre a empresa" |

> Os dois enums são fixos no código do backend — **não são carregados via API**. O front-end deve manter essas duas listas hardcoded (rótulo + texto de tooltip), do mesmo jeito que outros enums do projeto (ex: `PlataformaEnum`) já são tratados hoje. Se o backend alterar a redação em `DescreverTomVoz`/`DescreverObjetivoPrincipal` no futuro (a doc de arquitetura já prevê isso como ajuste pontual — ver "Decisões de produto" em [arquitetura-tecnica.md](arquitetura-tecnica.md)), as tooltips do front ficam desatualizadas até alguém sincronizar manualmente; não há endpoint que exponha essas strings dinamicamente.

### 2.2 Aba Base de Conhecimento

| Campo | Tipo de input | Obrigatório | Descrição para o usuário | Observações de UI |
|---|---|---|---|---|
| **Sobre a Empresa** (`AboutCompany`) | Textarea (multi-linha, ~5 linhas visíveis) | Sim | "O que sua empresa faz e qual a história dela?" — texto injetado no prompt como contexto institucional. | `maxLength=2000` (validado também no backend — exibir contador de caracteres "1234/2000"). Usar `placeholder` (não sugestões clicáveis) com um exemplo completo, ex: *"Somos uma loja de roupas femininas fundada em 2015, com foco em moda casual e preços acessíveis. Atendemos toda a região de Campinas com entrega em até 3 dias úteis."* — o objetivo é mostrar o nível de detalhe esperado, não induzir um texto genérico. |
| **Instruções Adicionais** (`AdditionalInstructions`) | Textarea (multi-linha, ~3 linhas visíveis) | Não | Espaço livre para orientações que não cabem nos campos estruturados (ex: "sempre pergunte o CEP antes de informar frete"). | `maxLength=2000`, mesmo contador. Rótulo com texto de ajuda: "Opcional — use apenas se as outras seções não cobrirem sua necessidade." Exibir 2–3 chips de sugestão clicáveis abaixo do campo (inserem o texto no cursor ao clicar, não substituem o conteúdo já digitado): *"Sempre perguntar o CEP antes de informar o frete"*, *"Confirmar o tamanho/cor disponível antes de fechar o pedido"*, *"Enviar o link de pagamento apenas após confirmação do cliente"*. |
| **Catálogo/Serviços** | Bloco somente leitura (não é um `<input>`) | — | Texto informativo: "Os produtos cadastrados no seu catálogo são enviados automaticamente para a IA — não é necessário digitar aqui." | Não gera request. Pode linkar para a tela de Produtos do CRM, se existir. Não faz parte do payload de `AgentConfig`. |

### 2.3 Aba FAQ

Lista dinâmica de pares Pergunta/Resposta, renderizada como cards ou linhas de tabela, cada um com Editar/Excluir.

| Campo (por item) | Tipo de input | Obrigatório | Descrição |
|---|---|---|---|
| **Pergunta** (`Pergunta`) | Texto curto/textarea 1 linha | Sim | A pergunta que o cliente costuma fazer. |
| **Resposta** (`Resposta`) | Textarea | Sim | A resposta que a IA deve dar quando reconhecer essa pergunta. |
| **Ordem** (`Ordem`) | Não editável diretamente — controlado por drag-and-drop ou botões ↑/↓ | Sim (numérico) | Define a ordem de exibição no prompt. Recalcule os índices ao reordenar e envie `Ordem` atualizada em cada `Atualizar`. |

UI recomendada: botão **"+ Adicionar Pergunta"** abre um modal/formulário inline com Pergunta + Resposta; salvar dispara `POST /CriarFaq` imediatamente (sem esperar o botão "Salvar" do rodapé). Cada item da lista tem ícones de editar (abre o mesmo modal preenchido, salva com `PUT /AtualizarFaq/{id}`) e excluir (confirmação → `DELETE /ExcluirFaq/{id}`).

### 2.4 Aba Regras

| Campo | Tipo de input | Obrigatório | Descrição para o usuário |
|---|---|---|---|
| **Condições de Transbordo** (`TransferConditions`) | Textarea (~3 linhas) | Sim | "Quando a IA deve chamar um atendente humano?" Texto livre — vai direto para o prompt como `"CONDIÇÕES PARA TRANSFERIR PARA UM HUMANO: {texto}"`, e a IA interpreta esse texto para decidir quando acionar `TransferirParaHumano()`. | `maxLength=2000`, contador de caracteres. Este campo faz parte do mesmo payload de `AgentConfig` (não é uma lista). Ver chips de sugestão abaixo. |
| **Regras** (`Rules`, lista) | Lista dinâmica de textos curtos | — (lista pode ficar vazia) | "O que o agente NUNCA deve fazer" — uma regra por item, texto livre. | Ver chips de sugestão abaixo. |

**Sugestões para "Condições de Transbordo"**

Como é um campo de texto livre e o usuário raramente sabe como frasear uma condição de forma que a IA interprete bem, exibir **chips clicáveis** logo abaixo do textarea. Ao clicar, o chip insere a frase no texto (concatenando com `"; "` se já houver conteúdo, não substituindo). São exemplos para *induzir o padrão de escrita* — o usuário deve poder editar livremente depois de inserir, e nada impede escrever algo totalmente diferente.

Sugestões recomendadas (cobrem os motivos de transbordo mais comuns em CRM de vendas/atendimento):

- "Cliente pediu explicitamente para falar com um atendente humano"
- "Cliente demonstrou interesse claro em fechar a compra"
- "Cliente fez uma pergunta fora da base de conhecimento cadastrada"
- "Cliente reclamou ou demonstrou insatisfação"
- "Após o cliente escolher um produto/serviço específico"
- "Cliente pediu desconto ou condição especial de pagamento"

> Não trate essa lista como fixa/definitiva — é um ponto de partida; o time de produto pode ajustar a redação dos chips com base no que funcionar melhor na prática, sem impacto em schema ou payload (são só textos de UI, nunca enviados como enum).

**Sugestões para "Regras"**

Mesmo racional: ao clicar em **"+ Adicionar Regra"**, exibir 2–3 chips de exemplo dentro do modal/campo de criação, que preenchem o campo de texto ao serem clicados (usuário edita livremente depois):

- "Nunca ofereça descontos maiores que 10%"
- "Nunca prometa prazos de entrega sem confirmar com o time"
- "Nunca compartilhe dados de outros clientes"

UI da lista de Regras: mesmo padrão de FAQ — **"+ Adicionar Regra"**, campo de texto único por item, botões editar/excluir. Cada ação individual dispara sua própria requisição (`POST /CriarRegra`, `PUT /AtualizarRegra/{id}`, `DELETE /ExcluirRegra/{id}`) — não fazem parte do payload do botão "Salvar" do rodapé.

> **Diferença importante:** `TransferConditions` é salvo junto com `AgentConfig` (botão "Salvar" do rodapé); `Rules` é uma lista com CRUD próprio, independente. Não confundir os dois fluxos de salvamento dentro da mesma aba.

### 2.5 Switch "Bot Ativo"

| Campo | Tipo de input | Descrição |
|---|---|---|
| `BotAtivo` | Switch/Toggle | Liga/desliga o atendimento automático por IA para a empresa. Quando desligado, as conversas não recebem resposta automática (o fluxo humano assume). |

Esse switch **não** faz parte do formulário principal — ele dispara sua própria requisição (`PATCH /AlternarBot`) assim que o usuário o altera, com feedback visual imediato (loading no switch, toast de sucesso/erro).

---

## 3. Disposição em tela — resumo visual

```
Aba "Identidade"
┌──────────────────────────────────────────┐
│ Nome do Assistente                        │
│ [________________________]                │
│                                            │
│ Tom de Voz            Objetivo Principal  │
│ [Profissional ▾]      [Qualificar leads▾] │
└──────────────────────────────────────────┘

Aba "Base de Conhecimento"
┌──────────────────────────────────────────┐
│ Sobre a Empresa                           │
│ ┌────────────────────────────────────┐   │
│ │                                      │   │
│ └────────────────────────────────────┘   │
│                                 1234/2000  │
│                                            │
│ Instruções Adicionais (opcional)          │
│ ┌────────────────────────────────────┐   │
│ └────────────────────────────────────┘   │
│                                    0/2000  │
│                                            │
│ ℹ Catálogo de produtos é enviado          │
│   automaticamente do seu CRM.             │
└──────────────────────────────────────────┘

Aba "FAQ"                     [+ Adicionar Pergunta]
┌──────────────────────────────────────────┐
│ P: Qual o prazo de entrega?      [✎] [🗑] │
│ R: Em média 5 dias úteis...               │
├──────────────────────────────────────────┤
│ P: Vocês fazem PIX?               [✎] [🗑] │
│ R: Sim, aceitamos PIX...                  │
└──────────────────────────────────────────┘

Aba "Regras"                       [+ Adicionar Regra]
┌──────────────────────────────────────────┐
│ Condições de Transbordo                   │
│ ┌────────────────────────────────────┐   │
│ └────────────────────────────────────┘   │
│                                    0/2000  │
│                                            │
│ Regras (o que a IA nunca deve fazer)      │
│ • Nunca ofereça desconto > 10%   [✎][🗑]  │
│ • Nunca prometa prazo de entrega [✎][🗑]  │
└──────────────────────────────────────────┘
```

---

## 4. Requisições HTTP

Base URL: `/api/RegrasIA`

Todos os endpoints exigem `Authorization: Bearer <token>`. `empresaId` **nunca** é enviado pelo front — é extraído do token no backend.

Toda resposta segue o envelope padrão do projeto:

```json
{
  "sucesso": true,
  "mensagem": "texto descritivo",
  "dados": { }
}
```

Trate `sucesso: false` como erro de negócio (exibir `mensagem` em um toast) mesmo quando o HTTP status for `200`; e trate HTTP `400` como confirmação adicional de erro (o backend retorna `BadRequest(response)` nesses casos — o corpo já vem com `sucesso: false`).

### 4.1 Carregar a tela — `GET /BuscarConfigAgente`

Chamar ao montar a tela. Popula os três formulários (Identidade, Base de Conhecimento, Regras/Transbordo) e as duas listas (FAQ, Regras) em uma única chamada.

```
GET /api/RegrasIA/BuscarConfigAgente
Authorization: Bearer <token>
```

**Response 200 (config existente):**
```json
{
  "sucesso": true,
  "mensagem": "Regras de IA encontradas com sucesso.",
  "dados": {
    "id": 12,
    "nomeAgente": "João",
    "tomVoz": 1,
    "objetivoPrincipal": 3,
    "sobreEmpresa": "Somos uma loja de roupas...",
    "instrucoesAdicionais": null,
    "condicoesTransbordo": "Se o cliente pedir humano ou perguntar sobre reembolso.",
    "botAtivo": true,
    "regras": [
      { "id": 5, "descricaoRegra": "Nunca ofereça desconto maior que 10%", "ordem": 1 }
    ],
    "faqs": [
      { "id": 8, "pergunta": "Qual o prazo de entrega?", "resposta": "Em média 5 dias úteis.", "ordem": 1 }
    ]
  }
}
```

**Response 200 (empresa ainda sem configuração):**
```json
{
  "sucesso": true,
  "mensagem": "Nenhuma regra de IA encontrada.",
  "dados": null
}
```

> Quando `dados` vier `null`, a tela deve exibir o formulário **vazio** em modo de criação (o botão "Salvar" chama `POST /CriarConfigAgente` em vez de `PUT /AtualizarConfigAgente` — ver seção 5). Nesse estado, as abas FAQ e Regras devem ficar desabilitadas com uma mensagem ("Salve a configuração do agente primeiro") — ver seção 5.

### 4.2 Criar configuração — `POST /CriarConfigAgente`

Usado apenas na primeira vez que a empresa configura o agente (quando `BuscarConfigAgente` retornou `dados: null`).

```
POST /api/RegrasIA/CriarConfigAgente
Authorization: Bearer <token>
Content-Type: application/json

{
  "nomeAgente": "João",
  "tomVoz": 1,
  "objetivoPrincipal": 3,
  "sobreEmpresa": "Somos uma loja de roupas...",
  "instrucoesAdicionais": null,
  "condicoesTransbordo": "Se o cliente pedir humano ou perguntar sobre reembolso.",
  "regras": [
    { "descricaoRegra": "Nunca ofereça desconto maior que 10%", "ordem": 1 }
  ],
  "faqs": [
    { "pergunta": "Qual o prazo de entrega?", "resposta": "Em média 5 dias úteis.", "ordem": 1 }
  ]
}
```

`regras` e `faqs` neste payload são **opcionais** e só existem como conveniência para permitir cadastrar a config junto com o primeiro lote de regras/FAQ em uma única chamada, no formulário inicial ("primeira configuração"). Após a criação, novos itens de FAQ/Regra usam sempre os endpoints próprios (seção 4.4/4.5).

**Response 200:**
```json
{ "sucesso": true, "mensagem": "Configuração de agente criada com sucesso.", "dados": null }
```

> Este endpoint **não retorna o `id`** da configuração criada. Após um `Criar` bem-sucedido, o front deve chamar `GET /BuscarConfigAgente` novamente para obter o `id` e os dados completos antes de habilitar as abas de FAQ/Regras.

**Validações que geram erro (HTTP 400, `sucesso: false`):**
- `nomeAgente` ou `sobreEmpresa` vazios → `"Nome do agente e descrição sobre a empresa são obrigatórios."`
- `sobreEmpresa`, `instrucoesAdicionais` ou `condicoesTransbordo` acima de 2000 caracteres → `"Sobre a empresa, instruções adicionais e condições de transbordo têm limite de 2000 caracteres."`

O front deve replicar essas duas validações **no cliente** (campo obrigatório + `maxLength`) para dar feedback imediato, mas sempre tratar a resposta do backend como fonte de verdade (exibir a `mensagem` retornada se a validação de alguma forma passar batido no cliente).

### 4.3 Atualizar configuração — `PUT /AtualizarConfigAgente`

Usado pelo botão "Salvar" do rodapé quando a configuração já existe.

```
PUT /api/RegrasIA/AtualizarConfigAgente
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 12,
  "nomeAgente": "João",
  "tomVoz": 1,
  "objetivoPrincipal": 3,
  "sobreEmpresa": "Somos uma loja de roupas...",
  "instrucoesAdicionais": null,
  "condicoesTransbordo": "Se o cliente pedir humano ou perguntar sobre reembolso."
}
```

> Note que este DTO **não** inclui `regras`/`faqs` — diferente do `Criar`. Alterações em Regras/FAQ nunca passam por este endpoint.

**Response 200:**
```json
{ "sucesso": true, "mensagem": "Configuração de agente atualizada com sucesso.", "dados": null }
```

### 4.4 CRUD de Regras

| Ação | Requisição | Payload |
|---|---|---|
| Buscar uma regra | `GET /api/RegrasIA/BuscarRegraPorId/{id}` | — |
| Criar | `POST /api/RegrasIA/CriarRegra` | `{ "descricaoRegra": "texto", "ordem": 1 }` |
| Atualizar | `PUT /api/RegrasIA/AtualizarRegra/{id}` | `{ "id": 5, "descricaoRegra": "texto", "ordem": 1 }` |
| Excluir | `DELETE /api/RegrasIA/ExcluirRegra/{id}` | — |

Todas retornam o envelope padrão sem `dados` relevante (exceto `BuscarRegraPorId`, que retorna a regra). Após qualquer criação/edição/exclusão, o front deve atualizar a lista local (otimista) ou re-chamar `GET /BuscarConfigAgente` para reidratar a lista inteira — mais simples e evita divergência de `ordem`.

### 4.5 CRUD de FAQ

| Ação | Requisição | Payload |
|---|---|---|
| Buscar uma FAQ | `GET /api/RegrasIA/BuscarFaqPorId/{id}` | — |
| Criar | `POST /api/RegrasIA/CriarFaq` | `{ "pergunta": "texto", "resposta": "texto", "ordem": 1 }` |
| Atualizar | `PUT /api/RegrasIA/AtualizarFaq/{id}` | `{ "id": 8, "pergunta": "texto", "resposta": "texto", "ordem": 1 }` |
| Excluir | `DELETE /api/RegrasIA/ExcluirFaq/{id}` | — |

> **Atenção de contrato:** `CriarRegra`/`CriarFaq` não recebem `agentConfigId` no body — o backend resolve a configuração ativa da empresa a partir do token (`BuscarPorEmpresaId(empresaId)`). Isso significa que **é impossível criar uma Regra ou FAQ antes de a configuração existir** — o backend retorna erro (`"Configuração de IA não encontrada para a empresa."`) se tentado. Reforça a necessidade de desabilitar as abas de FAQ/Regras até a configuração ser criada (seção 5).

### 4.6 Ligar/desligar o bot — `PATCH /AlternarBot`

```
PATCH /api/RegrasIA/AlternarBot
Authorization: Bearer <token>
Content-Type: application/json

{ "botAtivo": false }
```

**Response 200:**
```json
{ "sucesso": true, "mensagem": "Bot de IA desabilitado com sucesso.", "dados": null }
```

Disparar essa requisição diretamente no `onChange` do switch, sem esperar o botão "Salvar". Reverter visualmente o switch se a resposta vier com `sucesso: false` ou a requisição falhar.

---

## 5. Fluxo de estado da tela (primeira configuração vs. edição)

```
1. Montar tela → GET /BuscarConfigAgente
2.
   ├─ dados == null (empresa nova, sem config)
   │    → renderizar formulário vazio (Identidade + Base de Conhecimento + Transbordo)
   │    → abas FAQ e Regras desabilitadas, com aviso "Salve a configuração do agente primeiro"
   │    → botão "Salvar" chama POST /CriarConfigAgente
   │    → após sucesso, re-chamar GET /BuscarConfigAgente para obter o `id` e habilitar as demais abas
   │
   └─ dados != null (config existente)
        → preencher os três formulários com os dados retornados
        → habilitar abas FAQ e Regras (usam o `id` retornado como contexto implícito — não precisa
          ser reenviado pelo front, o backend já resolve por empresaId)
        → botão "Salvar" chama PUT /AtualizarConfigAgente
```

- Mantenha o `id` da configuração em estado local desde a primeira carga — ele é necessário no payload do `PUT /AtualizarConfigAgente`, mas **não** é necessário nos endpoints de FAQ/Regras (resolvidos por `empresaId` no backend).
- Não existe endpoint para excluir a configuração inteira a partir desta tela (`DELETE /ExcluirConfigAgente/{id}` existe na API, mas é uma ação destrutiva fora do escopo desta tela — não deve ter botão associado aqui; se necessário, deve ser uma ação em uma tela administrativa separada, com confirmação explícita).

---

## 6. Tratamento de erros e loading

- **Loading inicial**: skeleton nos três blocos do formulário + nas duas listas enquanto `GET /BuscarConfigAgente` não retorna.
- **Salvar formulário principal**: desabilitar o botão "Salvar" durante a requisição; exibir toast de sucesso/erro com a `mensagem` do backend.
- **Itens de lista (FAQ/Regra)**: loading local no item sendo salvo/excluído (spinner no botão), não bloquear a tela inteira.
- **Switch Bot Ativo**: loading inline no próprio switch; reverter estado visual em caso de erro.
- Em qualquer resposta com `sucesso: false`, exibir a `mensagem` do backend ao usuário — não usar mensagens genéricas de erro quando o backend já forneceu uma mensagem específica.

---

## 7. Fora do escopo desta tela

- **Catálogo de Produtos** — exibido apenas como texto informativo; o cadastro em si acontece na tela de Produtos do CRM, não aqui.
- **Exclusão da configuração inteira** (`DELETE /ExcluirConfigAgente/{id}`) — não expor nesta tela (ver seção 5).
- **Pré-visualização do prompt final** montado pelo `PromptBuilderService` — não existe endpoint para isso hoje; se o time de produto quiser uma prévia do que será enviado à IA, é uma funcionalidade nova de backend, fora do escopo aqui.
- **Reordenação em massa de Regras/FAQ** (drag-and-drop com salvamento único) — os endpoints atuais só atualizam um item por vez (`PUT /AtualizarRegra/{id}` / `PUT /AtualizarFaq/{id}`); se o time quiser reordenar N itens, o front deve disparar N requisições sequenciais (uma por item cuja `ordem` mudou) até que exista um endpoint de reordenação em lote.
