# Gestão de Vendas (ChatDashboard)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **ChatDashboardPage** (nomeada internamente como `ChatDashboard.tsx`, mas exibida como "Gestão de Vendas") é o painel de acompanhamento tático e estratégico das equipes e vendedores individuais. 
Aqui, os gestores (e vendedores, numa visão restrita) acompanham a evolução de faturamento em relação à **Meta Mensal**. O diferencial de negócios desta página é o cálculo de *Pace* (Ritmo) baseado nos **Dias Úteis** do mês, gerando uma projeção preditiva (Forecast) de quanto o vendedor ou a equipe faturará no fim do mês se mantiver o ritmo atual.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/ChatDashboard.tsx`
- **Rotas:** `/monitoramento` (Historicamente era monitoramento de chat, evoluiu para monitoramento de vendas).
- **Gestão de Permissões:** 
  - Lê `userPermissions` usando a configuração de ACL (`getUserPermissions`).
  - Se for Admin (`gestao_vendas`), exibe as abas "Analytics", "Individual" e "Equipes".
  - Se for Vendedor (`gestao_vendas_vendedor`), exibe apenas "Meu Desempenho" e "Equipes".
- **Cálculo de Projeção (Forecast) e Dias Úteis:**
  - Carrega os dias úteis (Seg a Sex configuráveis) de `GerenciarEmpresaService.getDiasUteis()`.
  - Calcula a proporção do faturamento atual pelo número de dias úteis já passados (`elapsedDays`), extraindo a média diária (`dailySalesRealized`), e a multiplica pelo total de dias úteis no mês (`monthlyDays`), chegando ao `projectedClosure`.
- **Abas / Tabs:**
  - **Analytics:** Injeta o sub-componente genérico `AnalyticsPage.tsx` (Tabelões e cruzamentos de meta gerais).
  - **Individual:** Lista um Kanban/Ranking de vendedores, calculando progress bars e projeções por atendente.
  - **Equipes:** Lista um painel consolidado por equipe.
  - **Meu Desempenho:** Injeta `MyPerformanceTab.tsx` filtrando apenas o usuário logado.

## 3. Componentes e Estrutura
- **Modais de Detalhamento:**
  - `TeamMonitoringModal`: Exibe a tabela de membros de uma equipe selecionada ao clicar no card.
  - `SellerMonitoringModal`: Abre um detalhamento (drill-down) das oportunidades fechadas por um vendedor específico ao clicar no ranking.
- **Componentes Utilitários:** 
  - Utiliza `MonthPicker` (para navegação temporal "Mês-Ano") e os gráficos da aba Analytics.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `GerenciarEmpresaService.getDiasUteis` (Para matemática de metas).
  - `RelatorioService.getPerformanceIndividual(mes)`
  - `RelatorioService.getPerformanceEquipes(mes)`
  - `RelatorioService.getProjecaoFechamento(mes, usuarioId)`
  - `OpportunityService.getAllOpportunities()` (Para popular os modais analíticos).
- Como esta página agrega os resultados de vendas (faturamento), ela é uma camada de visualização direta das ações que os usuários tomam no Chat (`ChatPage`) e no funil (`PipelinePage`) quando arrastam um card para "Ganho".
