
## 1. Visão geral da tela

Uma empresa pode ter **múltiplos agentes de IA** (ver [`docs/agente-ia-multi-conexao/arquitetura-tecnica.md`](../agente-ia-multi-conexao/arquitetura-tecnica.md)). Por isso a tela tem **três áreas**:

0. **Lista de agentes** (`GET /BuscarAgentes`): nome, indicador "Padrão da empresa", switch rápido de bot ativo por linha. Ponto de entrada — o usuário escolhe um agente para abrir/editar ou cria um novo. Fora do escopo detalhado desta doc (layout específico da lista); as seções abaixo descrevem a tela de edição de **um agente já aberto**.
1. **Configuração do Agente** (formulário único, seção "Identidade", "Base de Conhecimento" e "Fluxo de Transbordo") — um registro por agente.
2. **Listas dinâmicas dependentes do agente aberto**: Regras (guardrails) e FAQ — CRUD próprio, com sua própria conexão à API, mas vinculadas ao `Id` do agente aberto (área 0).

Isso implica uma **ordem de fluxo obrigatória**: as listas de Regras e FAQ só podem ser criadas/editadas depois que o agente existe (precisa de `AgentConfigId`). Ver seção 5.

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
| `BotAtivo` | Switch/Toggle | Liga/desliga o atendimento automático deste agente. Afeta toda conexão que resolve para ele (padrão da empresa, ou atribuição específica) — não é mais "a empresa toda", é por agente. Quando desligado, as conversas dessas conexões não recebem resposta automática (o fluxo humano assume). |

Esse switch **não** faz parte do formulário principal — ele dispara sua própria requisição (`PATCH /AlternarBot/{agentConfigId}`) assim que o usuário o altera, com feedback visual imediato (loading no switch, toast de sucesso/erro).

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

Base URL: `/api/RegrasIA`. Todos os endpoints exigem `Authorization: Bearer <token>`; `empresaId` **nunca** é enviado pelo front.

> **Referência completa** (payloads, respostas, validações, códigos de erro): [`docs/requisicoes-http/agente-ia.md`](../requisicoes-http/agente-ia.md). Esta seção só mapeia cada ação de UI para o endpoint correspondente — não duplica exemplos de request/response para não desatualizar em dois lugares quando o backend mudar.

| Ação na tela | Endpoint | Observação |
|---|---|---|
| Montar tela / listar agentes | `GET /BuscarAgentes` | Retorna todos os agentes da empresa (`isDefault`, `botAtivo`, `conexoesVinculadas` por item) |
| Abrir um agente para editar | `GET /BuscarAgentePorId/{id}` | Popula Identidade, Base de Conhecimento, Transbordo, Regras e FAQ daquele agente |
| Botão "Salvar" (agente novo) | `POST /CriarConfigAgente` | Aceita `regras`/`faqs` iniciais opcionais; resposta já traz o agente criado com `id` |
| Botão "Salvar" (agente existente) | `PUT /AtualizarConfigAgente` | Não altera `botAtivo` nem `isDefault` |
| Botão "Definir como padrão" | `PATCH /DefinirAgentePadrao/{id}` | Desmarca o padrão anterior automaticamente |
| Switch "Bot Ativo" | `PATCH /AlternarBot/{agentConfigId}` | Disparar no `onChange`, sem esperar "Salvar"; reverter o switch se a resposta vier com `sucesso: false` |
| CRUD de Regras (dentro do agente aberto) | `GET/POST/PUT/DELETE .../*Regra*` | `CriarRegra` exige `agentConfigId` = id do agente aberto no body |
| CRUD de FAQ (dentro do agente aberto) | `GET/POST/PUT/DELETE .../*Faq*` | `CriarFaq` exige `agentConfigId` = id do agente aberto no body |
| Excluir agente (tela administrativa, fora desta tela — ver seção 7) | `DELETE /ExcluirConfigAgente/{id}` | Bloqueado se for o único agente ou o padrão da empresa |

---

## 5. Fluxo de estado da tela (lista de agentes → edição)

```
1. Montar tela → GET /BuscarAgentes
2.
   ├─ dados == [] (empresa nova, sem nenhum agente)
   │    → renderizar a lista vazia com CTA "Criar primeiro agente"
   │    → botão "Criar" abre o formulário vazio (Identidade + Base de Conhecimento + Transbordo)
   │    → abas FAQ e Regras desabilitadas, com aviso "Salve o agente primeiro"
   │    → botão "Salvar" chama POST /CriarConfigAgente (o próprio agente criado já vem como padrão
   │      da empresa, automaticamente — ver docs/requisicoes-http/agente-ia.md)
   │    → resposta já traz o agente completo com `id`; abrir o formulário nesse estado (edição),
   │      habilitando as demais abas — sem precisar de um GET extra
   │
   └─ dados != [] (um ou mais agentes existentes)
        → renderizar a lista de agentes (nome, "Padrão" quando isDefault, switch de bot ativo)
        → usuário clica em um agente → GET /BuscarAgentePorId/{id} (ou usa o item já carregado)
        → preencher os três formulários com os dados do agente aberto
        → habilitar abas FAQ e Regras, usando o `id` do agente aberto como agentConfigId
        → botão "Salvar" chama PUT /AtualizarConfigAgente
        → botão "+ Novo agente" volta ao ramo de criação acima
```

- Mantenha o `id` do agente aberto em estado local — é necessário no payload do `PUT /AtualizarConfigAgente`, no `PATCH /AlternarBot/{agentConfigId}`, no `PATCH /DefinirAgentePadrao/{id}` e como `agentConfigId` em toda criação de Regra/FAQ.
- `DELETE /ExcluirConfigAgente/{id}` existe na API (bloqueado se for o único agente ou o padrão), mas é uma ação destrutiva fora do escopo desta tela — não deve ter botão associado aqui; se necessário, deve ser uma ação em uma tela administrativa separada, com confirmação explícita.

---

## 6. Tratamento de erros e loading

- **Loading inicial**: skeleton na lista de agentes enquanto `GET /BuscarAgentes` não retorna; skeleton nos três blocos do formulário + nas duas listas enquanto `GET /BuscarAgentePorId/{id}` não retorna.
- **Salvar formulário principal**: desabilitar o botão "Salvar" durante a requisição; exibir toast de sucesso/erro com a `mensagem` do backend.
- **Itens de lista (FAQ/Regra)**: loading local no item sendo salvo/excluído (spinner no botão), não bloquear a tela inteira.
- **Switch Bot Ativo**: loading inline no próprio switch; reverter estado visual em caso de erro.
- Em qualquer resposta com `sucesso: false`, exibir a `mensagem` do backend ao usuário — não usar mensagens genéricas de erro quando o backend já forneceu uma mensagem específica.

---

## 7. Fora do escopo desta tela

- **Layout detalhado da lista de agentes** (área 0, seção 1) e do **seletor de agente por conexão** (tela de Conexões, endpoint `PATCH /api/ConexaoPlataforma/{conexaoId}/atribuir-agente-ia`) — esta doc cobre a tela de edição de um agente já aberto; a lista/seletor merecem especificação própria.
- **Catálogo de Produtos** — exibido apenas como texto informativo; o cadastro em si acontece na tela de Produtos do CRM, não aqui.
- **Exclusão da configuração inteira** (`DELETE /ExcluirConfigAgente/{id}`) — não expor nesta tela (ver seção 5).
- **Pré-visualização do prompt final** montado pelo `PromptBuilderService` — não existe endpoint para isso hoje; se o time de produto quiser uma prévia do que será enviado à IA, é uma funcionalidade nova de backend, fora do escopo aqui.
- **Reordenação em massa de Regras/FAQ** (drag-and-drop com salvamento único) — os endpoints atuais só atualizam um item por vez (`PUT /AtualizarRegra/{id}` / `PUT /AtualizarFaq/{id}`); se o time quiser reordenar N itens, o front deve disparar N requisições sequenciais (uma por item cuja `ordem` mudou) até que exista um endpoint de reordenação em lote.