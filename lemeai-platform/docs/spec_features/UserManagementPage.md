# Gestão de Usuários (UserManagementPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **UserManagementPage** permite ao Administrador do CRM convidar ou gerenciar os operadores (Vendedores, Suporte, etc.) de sua organização. 
Controla quem pode acessar a plataforma, definindo e-mail, senha e, fundamentalmente, atrelando um Perfil de Acesso (Profile) que determinará os privilégios na plataforma.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/UserManagementPage.tsx`
- **Rotas:** `/usuarios`
- **Autenticação de Rota Segura:** O código intercepta o erro `401 Unauthorized` de duas chamadas de API nativas. Caso ocorra (sessão expirou), ele limpa o localStorage e redireciona o usuário (navega) para o `/login` preventivamente.
- **Estrutura de Exclusão "Soft Delete":** Em vez de excluir o usuário fisicamente (`DELETE`), a ação de deletar seta o flag `UserDeleted = true`, fazendo com que ele apareça na lista de "Inativos" e perca acesso ao CRM, mantendo o histórico de vendas vinculado ao seu ID.

## 3. Componentes e Estrutura
- **Filtros e Controles:**
  - Busca livre por Nome e Email (`searchTerm`).
  - Dropdown por Perfil (ex: Admin, Vendedor).
  - Toggles (Botões) Ativos vs Inativos (`statusFilter`).
- **Data Table:** Lista paginada no Front, exibindo colunas de Nome, E-mail, Perfil, Status e Ações.
- **`UserFormModal`:** Modal filho responsável por coletar dados para criar (POST) ou atualizar (PUT) as informações (senha só é obrigatória na criação).
- **`ConfirmationModal`:** Proteção em cascata (double opt-in) ao clicar no botão de desativar (ícone de `FaBan`).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `/api/Usuario/BuscarTodos`
  - `/api/TipoUsuario/BuscarTodos` (Para alimentar o dropdown do Perfil).
  - `/api/Usuario/CriarUsuario` / `Atualizar` / `Deletar`.
- Uma falha na criação de usuário impede a equipe de crescer.
- Depende diretamente de `ProfileManagementPage` existir para que existam perfis selecionáveis.
