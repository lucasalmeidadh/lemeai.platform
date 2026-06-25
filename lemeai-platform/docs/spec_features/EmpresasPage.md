# Administração de Empresas (EmpresasPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **EmpresasPage** é a tela *Master Admin* do SaaS (Software as a Service). É exclusiva para os donos e operadores da própria plataforma (GB Code), permitindo o gerenciamento dos seus clientes (Lojistas/Inquilinos).
Negocialmente, é aqui que um novo cliente é registrado no sistema multitenant (Criação de Tenant), onde a data de validade da assinatura é controlada, e onde os primeiros usuários de uma nova empresa (geralmente os donos dela) são criados manualmente antes do onboarding real.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/EmpresasPage.tsx`
- **Rotas:** `/configuracao/empresas` (Acesso restrito via Claim Master no backend).
- **CRUD de Tenant:** Operações fundamentais de criação, edição, listagem e desativação lógica (soft delete) de empresas (`Filiais` no banco de dados).
- **Gestão Subordinada (Usuários da Empresa):** A partir desta tela, o Master Admin pode clicar no ícone de "Usuários" de uma empresa específica e abrir um Modal para injetar usuários lá dentro, burlando o fluxo padrão onde o próprio lojista convida seus funcionários. Isso é usado para Suporte Técnico.

## 3. Componentes e Estrutura
- **Tabela Central:** Mostra as empresas cadastradas, com colunas críticas de faturamento: `Nome`, `CNPJ`, `Expiração da Assinatura` e `Status`.
- **`EmpresaFormModal`:** Modal para criar/editar os dados cadastrais da Empresa (Nome, CNPJ, Data de Vencimento, Plano, Endereço).
- **`EmpresaUsuariosModal`:** Sub-modal acionado pelo botão de "Usuários", que consome a API para listar os usuários atrelados àquela empresa específica e permite gerenciá-los sem precisar logar como eles.
- **`ConfirmationModal`:** Proteção para evitar a desativação acidental de um Tenant inteiro, pois isso bloquearia o acesso de dezenas de usuários dependentes daquela empresa.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `EmpresaService` (`buscarTodas`, `criar`, `atualizar`, `desativar`).
- A criação de uma Empresa aqui é o Passo 0 do ciclo de vida de qualquer cliente na plataforma. Sem a empresa criada, não existe `FilialId` para associar as Contas do WhatsApp, Usuários ou Leads.
