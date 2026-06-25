# Dashboard (Painel Principal)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
O **Dashboard** é a central analítica da operação comercial diária do usuário. O gestor ou vendedor entra nesta página para entender o volume de oportunidades em andamento, visualizar em quais etapas do funil de vendas os leads estão estagnados, e monitorar a atividade de pico de conversas ao longo das 24 horas. É fundamental para acompanhamento estratégico e rápido diagnóstico de gargalos na conversão de vendas.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/Dashboard.tsx`
- **Rotas:** `/dashboard`
- **Gestão de Estado e Filtragem:**
  - Controla filtros temporais via `DateRangeFilter` (datas de início e fim).
  - Controla filtros de status visual (dropdown "Todos", "Em Qualificação", etc.) via `CustomSelect`.
  - Processa uma mescla complexa no Frontend usando `useMemo` para cruzar dados brutos de Oportunidades de Venda (`allOpportunities`) com informações de Chat (`chatDataMap` - cruza o tipo de lead/temperatura de cada conversa com sua respectiva oportunidade).
- **Cálculo de Funil (`setFunnelData`):** 
  - Baseado no ID de Status do Lead, ele acumula contadores (`counts`) e formata os objetos no padrão aceito pelo componente gráfico de Funil. Associa cores de opacidade suaves.
- **Cálculo Diário e Horário (`chartData`, `hourlyData`):**
  - Iteração matemática de datas usando o objeto `Date` nativo para preencher dias faltantes com "0", garantindo que os gráficos (conversas nos últimos 30 dias e por hora do dia) fiquem com eixos consistentes.

## 3. Componentes e Estrutura
- **Componentes Externos Utilizados:**
  - [DashboardSkeleton.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/DashboardSkeleton.tsx) (Estado de loading para os gráficos).
  - [DateRangeFilter.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/DateRangeFilter.tsx) (Seleção do filtro de datas).
  - [CustomSelect.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/CustomSelect.tsx) (Dropdown de status).
  - **Gráficos Específicos:** [ConversationChart.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/ConversationChart.tsx), [FunnelChart.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/FunnelChart.tsx), [HourlyActivityChart.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/HourlyActivityChart.tsx) (que internamente devem renderizar os charts com bibliotecas como Recharts ou similar).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas simultaneamente via `Promise.all`:**
  - `OpportunityService.getAllOpportunities()`: Traz todo o CRM de negócios ativos/perdidos/ganhos.
  - `GET /api/Chat/ConversasPorVendedor`: Busca a listagem de conversas para realizar o mapeamento cruzado entre a oportunidade no CRM e os metadados de chat ativo daquele vendedor.
