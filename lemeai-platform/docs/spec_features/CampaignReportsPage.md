# Relatório de Desempenho de Campanhas (CampaignReportsPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **CampaignReportsPage** (Módulo de Growth/Marketing) permite aos líderes avaliar o Retorno sobre o Investimento (ROI) de mensagens em massa disparadas pelo WhatsApp. A tela calcula a taxa de conversão do Funil: "Quantas mensagens foram enviadas? -> Quantos leads responderam? -> Quantas vendas foram ganhas? -> Qual foi a Receita gerada?".

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/CampaignReportsPage.tsx`
- **Rotas:** `/relatorio-campanhas`
- **Cruzamento de Dados em Memória (Data Correlation):**
  - O backend provê a métrica primária (`CampaignService.getMetrics`) de disparos e interações.
  - Para calcular a Receita e Taxa de Conversão, o React faz um loop em todas as `Oportunidades` (Status = 3/Ganho).
  - Ele utiliza o `idConversa` e `idCampanha` atrelado a oportunidade para fazer o vínculo entre a venda registrada e o disparo da mensagem original.
- **Filtros e Presets de Data:** Segue o mesmo padrão exato da `ReportsPage`, usando o `react-datepicker` com presets ("Últimos 30 dias", "Mês Atual", etc.).
- **Exportação CSV:** Utiliza a mesma técnica de exportação direta do navegador com Blob de texto e prefixo `\uFEFF` (BOM UTF-8) para suporte ao MS Excel PT-BR (delimitado por `;`).

## 3. Componentes e Estrutura
- **KPI Cards:** Três blocos superiores coloridos exibindo (1) Total Disparado, (2) Leads Gerados, e (3) Receita Convertida.
- **Data Table:** Lista as campanhas processadas com colunas para "Campanha", "Template", "Criada Em", "Disparos", "Leads", "Vendas", "Conversão (%)", "Faturamento".

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `CampaignService.getMetrics()`
  - `OpportunityService.getAllOpportunities()`
  - `/api/Chat/ConversasPorVendedor` (Para ajudar no cruzamento do ID da campanha caso a oportunidade base não tenha registrado).
- Diretamente relacionada à aba de disparo em `CampaignPage.tsx` e aos templates da meta oficial (`CampaignTemplatesPage.tsx`).
