# Gestão de Equipes (TeamsPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **TeamsPage** é o módulo administrativo responsável por agrupar os usuários do sistema em esquadrões (Teams). A nível de negócios, criar uma equipe e definir um Líder permite a extração de relatórios agrupados e, futuramente, controle de visibilidade (ex: Líder vê as vendas de todos os subordinados).

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/TeamsPage.tsx`
- **Rotas:** `/equipes`
- **CRUD (Create, Read, Update, Delete):**
  - Tabela principal exibe Nome da Equipe, o usuário Líder (resolvido a partir de seu ID), e os avatares (iniciais) dos membros.
  - Implementa busca (Search) instantânea local pelo nome da equipe ou pelo nome do líder.
- **Formato dos Dados:** 
  - Uma Equipe possui um `nome` (String), um `liderId` (Integer) e um array de `membroIds` (Array de Integers).

## 3. Componentes e Estrutura
- **`TeamFormModal`**: Sub-componente que abriga os `CustomSelect` para a definição do Líder (Seletor Único) e dos Membros (Seletor Múltiplo - Multiselect).
- **`ConfirmationModal`**: Utilizado para confirmar a exclusão da equipe.
- Na exibição, se uma equipe tiver muitos membros, exibe as iniciais dos 3 primeiros em esferas (`member-avatar`) e condensa o resto numa bola `+X`.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `EquipeService` (`buscarTodas`, `criar`, `atualizar`, `excluir`).
  - `/api/Usuario/BuscarTodos` (Para buscar os nomes associados aos IDs numéricos e alimentar as listas de opções).
- **Relação Forte:** A definição de quem pertence a qual equipe impacta diretamente a exibição e o funcionamento da página de Metas (`GoalsPage`) e a geração de Dashboards (`ChatDashboard`).
