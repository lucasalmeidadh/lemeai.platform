# Gestão de Metas (GoalsPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **GoalsPage** é a interface de definição de alvos (targets) mensais para os colaboradores e para as equipes. Seu objetivo de negócios é pautar a equipe comercial com um norte financeiro, de ligações ou de volume de negócios. Quando uma meta é definida aqui, toda a inteligência e cálculo matemático das projeções (`ChatDashboard.tsx`) passam a fazer sentido, pintando barras de progresso verde, amarelo ou vermelho.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/GoalsPage.tsx`
- **Rotas:** `/metas`
- **Gestão de Metas (Hierarquia Automática):**
  - **Sincronização Ascendente:** Ao cadastrar/editar a meta individual de um Vendedor, o sistema pergunta se o usuário deseja *somar* essa meta com a meta total da Equipe ao qual ele pertence.
  - **Sincronização Descendente (Distribuição):** Ao cadastrar uma meta para a Equipe como um todo, o sistema pergunta o tipo de distribuição: Igualmente dividida entre os membros (Ex: R$10.000 / 2 = R$5k pra cada) ou Integralmente atribuída a todos (Cada um terá a meta de R$10.000).
- **Tipos de Meta:** Faturamento (`value`), Quantidade de Vendas (`quantity`), e Ligações Feitas (`calls`).
- **Mês a Mês:** O filtro principal da tela é o seletor temporal de Mês/Ano (Month Picker genérico do navegador `<input type="month">`).
- **Clonagem de Metas:** Recurso "Copiar mês anterior" aciona o endpoint de replicação do backend, evitando recadastro manual na virada do mês.

## 3. Componentes e Estrutura
- **Tabela Hierárquica:** A tabela principal agrupa os dados por Equipe. Linhas-pai (Equipe) têm um botão `Chevron` expansível. Clicando, exibe-se as linhas-filhas (Membros daquela equipe) formatadas com recuo (Indentação). Vendedores não atrelados a equipes caem em "Colaboradores Sem Equipe".
- **`GoalFormModal`**: Sub-componente (modal) onde ocorre a parametrização de quem recebe a meta, tipo de meta e distribuição.
- **`ConfirmationModal`**: Utilizado para confirmar deleção e para o pop-up de "Sincronização/Soma de meta" ao atualizar indivíduos.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `MetaGoalService` (`buscarTodas`, `criar`, `atualizar`, `excluir`, `replicar`).
  - `EquipeService.buscarTodas()` (Para montar a árvore hierárquica e descobrir quem é de qual time).
  - `/api/Usuario/BuscarTodos` (Para buscar o UUID interno e o nome dos vendedores).
- As metas cadastradas aqui são os denominadores (divisores) das fórmulas percentuais calculadas e renderizadas na `ChatDashboardPage`.
