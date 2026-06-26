# Regras de Negócios e Navegação Global

Este documento centraliza regras de negócios globais que afetam a navegação, os menus e as permissões de visibilidade da plataforma LemeAI, que não se restringem a apenas uma tela específica.

---

## 1. Estrutura do Menu Lateral (Sidebar)

A organização dos itens no menu lateral (`Sidebar`) deve seguir os seguintes agrupamentos lógicos:

### 1.1. Gestão de usuários
Contém as opções voltadas ao controle de acesso e de pessoal:
- Usuários
- Perfis
- Equipes

### 1.2. Administração
Contém as configurações sistêmicas de negócio do cliente:
- Metas
- Campos personalizados

### 1.3. Chatbot
Contém as configurações relacionadas à inteligência artificial e aos atendimentos:
- Regras do Chat
- Produtos

### 1.4. Empresa
Agrupa as configurações relacionadas à conta e conectividade:
- Gerenciar Empresa
- Empresas
- Conexões (movido para cá a partir do menu Chatbot)
- Gerenciar Planos (Meu Plano)

---

## 2. Regras de Exibição Condicional por Empresa

Algumas funcionalidades ou acessos na plataforma dependem de qual empresa (`empresaId`) o usuário pertence. Estas verificações se aplicam de maneira independente às permissões de rotas comuns.

### 2.1. Ocultação do menu "Meu Plano" (`/plano` e `/gerenciar-planos`)
**Regra:** A visualização e o acesso à página de gerenciamento de planos devem ser **bloqueados e ocultados** em todos os menus para usuários cujas empresas possuam o ID **4** ou **8**.

**Implementação Técnica:**
1. A verificação deve extrair o `empresaId` diretamente das informações do usuário salvas no `localStorage`.
2. Se `empresaId === 4` ou `empresaId === 8`, as seguintes opções NÃO devem ser renderizadas:
   - O link "Gerenciar Planos" sob o agrupamento "Empresa" na **Sidebar** (`Sidebar.tsx`).
   - O botão de atalho "Meu Plano" na **Top Bar** (`Topbar.tsx`).
   - O link "Meu Plano" no **Menu Mobile / Drawer** (`MainLayout.tsx`).

> **Nota para desenvolvedores / IAs**: Sempre que refatorar componentes de layout ou criar novos atalhos de navegação, certifique-se de aplicar essa verificação para as rotas de plano.
