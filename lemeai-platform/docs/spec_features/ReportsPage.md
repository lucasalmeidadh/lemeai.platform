# Relatório Operacional de Vendas (ReportsPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **ReportsPage** foca na consolidação dos negócios que foram marcados como "Ganho" (Won). É o fechamento de caixa do Vendedor e do Gestor. O objetivo comercial é permitir o acompanhamento métrico bruto (Faturamento, Total de Vendas, Ticket Médio) e exportar esses dados de faturamento para análise em planilhas externas (Excel) ou enviar para o financeiro.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/ReportsPage.tsx`
- **Rotas:** `/relatorios`
- **Lógica de Filtro Front-end (Data Processing):** 
  - Ao invés de usar paginação sever-side, busca tudo e processa na memória (`useMemo`). Filtra as Oportunidades verificando se `idStauts === 3` (Status fixo de Ganho no sistema).
- **Filtros de Data Customizados (Presets):**
  - Implementa botões rápidos de "Hoje", "Ontem", "Últimos 7 dias", "Últimos 30 dias", e "Mês Atual".
  - Se o usuário clica num preset, as datas do componente genérico `react-datepicker` são atualizadas. Se o usuário usa o DatePicker direto, a tag de preset muda para "Personalizado".
- **Exportação CSV:**
  - Gera um `.csv` diretamente pelo navegador criando um Blob Blob com separador por ponto-e-vírgula (`;`).
  - *Detalhe Técnico Crucial:* O arquivo injeta forçosamente um BOM UTF-8 (`\uFEFF`) no início da string. Isso é obrigatório para que o Microsoft Excel PT-BR consiga ler os acentos (ã, ç) nativamente sem bagunçar o encoding ao abrir por clique duplo.

## 3. Componentes e Estrutura
- **KPI Cards:** Três blocos superiores coloridos exibindo (1) Faturamento Total, (2) Quantidade de Vendas e (3) Ticket Médio (Revenue / Sales).
- **Data Table:** Lista de Vendas Ganhas, contendo Cliente, Telefone, Email, Origem (Orgânico ou Marketing), Vendedor e Valor (formatado em verde).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - Carrega em cascata via `Promise.all` as APIs: `OpportunityService`, `ProductService`, `ContactService`, `Chat/ConversasPorVendedor`.
- Como a API de Oportunidades é deficiente em retornar a origem (Campanha) de forma consolidada, o Front-end faz um "merge" das respostas: Ele mapeia o `idConversa` retornado no chat e injeta na oportunidade para saber se aquela venda veio de uma Campanha Ativa do WhatsApp.
