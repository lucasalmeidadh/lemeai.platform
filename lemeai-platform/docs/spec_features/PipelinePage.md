# Pipeline (Funil de Vendas)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **PipelinePage** é o Kanban de gerenciamento visual do ciclo de vida das vendas. Seu objetivo é permitir que a equipe comercial tenha uma visão panorâmica (helicóptero) de onde estão travadas as oportunidades geradas (Leads). As colunas representam os estágios do funil (Atendimento IA, Em Qualificação, Proposta Enviada, Em Negociação, Ganho, Perdida). Os vendedores podem arrastar os cards (arrastar e soltar) pelas etapas até o fechamento.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/PipelinePage.tsx`
- **Rotas:** `/pipeline`
- **Drag and Drop (Kanban):**
  - Utiliza a biblioteca `@hello-pangea/dnd` para habilitar a interface Drag-and-Drop de alta performance.
  - O estado do board baseia-se na constante estática `INITIAL_COLUMNS`, mapeando cada coluna para um `statusId` no banco de dados.
- **Auto-scroll (Edge Scrolling):** O Kanban implementa um engenhoso `requestAnimationFrame` (`handleDragMove`) que rola a tela lateralmente de forma automática se o mouse do usuário chegar a 120px da borda enquanto ele arrasta um lead (essencial para monitores pequenos em Kanban muito longos).
- **Lógica Otimista (Optimistic UI):**
  - Ao soltar o card, o React atualiza o Array `columns` instantaneamente na tela antes de aguardar o servidor. Se a requisição `PATCH` falhar, ele desfaz a ação e retorna o card (função de `revert`).
- **Forçar Classificação de Temperatura:**
  - Regra de Negócio: Se o atendente tentar mover um card recém-chegado (Sem Temperatura) para os estágios "Em Negociação" ou "Proposta", o fluxo é interrompido, o card fica suspenso e abre-se o `TemperatureSelectionModal` forçando o vendedor a classificar o lead como Quente, Morno ou Frio antes de confirmar o avanço.
- **Forçar Produto em "Ganhos":**
  - Se movido para "Ganho" e o Lead não tem produto associado, a API retorna erro semântico de negócio e o front aciona o `WinDealProductModal` para obrigar a inserção de valor financeiro antes do "Win".
- **Resumo de IA (AI Summary):**
  - Vendedores podem clicar em um ícone (Varinha mágica) no card para gerar um resumo executivo daquela conversa (lida de todo histórico do Chat) usando `ChatService.getConversationSummary`.

## 3. Componentes e Estrutura
- Arquivo extenso (1100+ linhas) operando como um *Smart Component* orquestrador.
- **Filtros Avançados:** Filtra por Vendedor, Temperatura, Data de Criação, Origem (Orgânico/Marketing) e Campanha (usa `CampaignService`).
- **Modais Acoplados:**
  - `DealDetailsModal` (Aberto ao clicar no card).
  - `SummaryModal` (Exibe o texto gerado pela IA).
  - `CreateOpportunityModal` (Criação manual (Outbound) de leads sem esperar que venham do WhatsApp).
- Em telas mobile, o Kanban horizontal não faz sentido, então o sistema renderiza o componente `MobilePipelineAccordion.tsx` como uma visão de lista recolhível em seu lugar.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `OpportunityService.getAllOpportunities()` (Carga inicial base).
  - O Front faz um "merge" das Oportunidades com a rota `/api/Chat/ConversasPorVendedor` para saber metadados como `tipoLeadId` atualizado e campanhas ativas.
  - `PATCH /api/Chat/Conversas/{dealId}/AtualizarStatus` (Quando arrasta de uma coluna para outra).
  - `PATCH /api/Chat/Conversas/{dealId}/TranferirConversa` (Ação de 'Assumir' lead abandonado).
- Os cards aqui representam a exata mesma entidade de comunicação operada na [ChatPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatPage.tsx). Modificar aqui altera o chat, e vice-versa. As métricas refletem no [ChatDashboard.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatDashboard.tsx).
