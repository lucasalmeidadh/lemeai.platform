# Meus Contatos (Agenda de Clientes)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **ContactsPage** é a lista telefônica/agenda de clientes da empresa. Ela difere da aba de Leads, pois um contato pode existir sem ter uma "oportunidade/negociação" aberta. O propósito comercial é manter o banco de dados enriquecido (CRM) permitindo criar contatos frios para posterior prospecção ativa (Outbound) ou edição de dados de um contato gerado passivamente.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/ContactsPage.tsx`
- **Rotas:** `/contatos`
- **Tabela de Dados (Data Grid):**
  - Implementa busca (Search) instantânea local (`filteredContacts`) que filtra pelo nome, e-mail e telefone do contato em memória após a carga inicial.
  - Paginação front-end injetando o componente `Pagination` com 10 itens por página.
- **CRUD (Create, Read, Update, Delete):**
  - Todas as funções de escrita são delegadas ao `ContactModal.tsx`, que centraliza o formulário e é aberto tanto no click de "Adicionar" quanto no ícone de "Editar".
  - Remoção via alert nativo `window.confirm`.

## 3. Componentes e Estrutura
- **`ContactModal`**: Recebe a DTO limpa ou preenchida para saber se fará PUT (update) ou POST (create).
- **`Pagination`**: Componente de paginação padrão, compartilhado na plataforma.
- Renderização condicional com *skeleton loaders* simulando a tabela enquanto a API responde. 

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - Somente o `ContactService` completo (`getAll`, `create`, `update`, `delete`).
- Estes contatos formam a base para o preenchimento automático das oportunidades. Quando um novo Lead entra via WhatsApp Webhook, o Backend cria silenciosamente um Contato e o insere na Pipeline. Na `ContactsPage`, os administradores podem ver esse contato e complementar com E-mail, Cidade, Estado e Segmento.
