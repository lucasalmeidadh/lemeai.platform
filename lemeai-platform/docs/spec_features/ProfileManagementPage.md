# Gestão de Perfis e Permissões (ProfileManagementPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **ProfileManagementPage** é o centro de controle de segurança (RBAC - Role-Based Access Control) da plataforma. 
Para Lojistas (usuários normais), ela permite apenas ver e atribuir as permissões (features) aos perfis existentes em sua empresa. 
Para Administradores do Sistema (`GbCodeAdminPolicy`), ela habilita a poderosa aba **"Catálogo Global"**, que é onde se cadastram novas "Claims/Policies" do backend para que todo o sistema passe a conhecer uma nova permissão (ex: ao criar um módulo novo de Relatórios).

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/ProfileManagementPage.tsx`
- **Rotas:** `/configuracao/perfis`
- **Controle de Acesso em Tela:** A constante `showCatalogueTab` é renderizada *apenas* se o token do usuário contiver a permissão de `gbcode_admin_sistema` E o nome da sua empresa for "GB Code".
- **Gestão de Perfis (Aba Padrão):** 
  - Lista os perfis (ex: Vendedor, Admin).
  - Mostra todos os itens do "Catálogo Global".
  - O usuário ativa/desativa toggles e salva. O backend salva esses IDs na tabela de relacionamento Perfil X Permissão.
- **Catálogo Global (Aba Admin):**
  - Permite um CRUD completo de Permissões Mestre (Tabela `Permissao`).
  - O `Nome da Tela` é o nome amigável (ex: Relatórios de Venda).
  - O `Código Técnico` DEVE bater com o nome da Policy C# no backend (ex: `relatorios_venda`).

## 3. Componentes e Estrutura
- **`getPermissionIcon`:** Uma função helper que faz um pseudo-match no nome da permissão para renderizar um ícone inteligente (ex: contém "relatorio", retorna o ícone de Gráfico).
- **Abas Condicionais (`profile-tabs-nav`):** Só renderiza se for Admin Global.
- **Modal de Catálogo:** Criação e edição dos dados raiz da permissão global.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `/api/TipoUsuario/BuscarTodos` (Lista de Perfis).
  - `/api/PermissaoAcesso/TiposPermissoes` (Catálogo para usar nos Toggles).
  - `/api/PermissaoAcesso/PermissoesPorTipoUsuario/{id}` (Lista de IDs selecionados).
  - `/api/Permissao/BuscarTodos`, `Criar`, `Atualizar` (CRUD do Catálogo Global - Restrito).
- Sem o Catálogo Global atualizado, uma nova tela criada no frontend que exige claim não poderá ser acessada por ninguém.
