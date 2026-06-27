# Onboarding Steps (Primeiros Passos)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A página **OnboardingStepsPage** (Primeiros Passos) funciona como um guia de boas-vindas para clientes recém-cadastrados ou que estão configurando o sistema pela primeira vez. Ela apresenta os 3 passos fundamentais (Cadastro de Produtos, Regras do Chat e Conexão WhatsApp) para colocar a inteligência artificial do CRM para rodar com excelência. 

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/OnboardingStepsPage.tsx`
- **Rotas:** `/primeiros-passos`
- É uma página estática de apresentação. Não gerencia estado complexo ou consome APIs diretamente. 
- A ação dos botões utiliza `window.open(link, '_blank')` para abrir as páginas de configuração correspondentes (`/products`, `/chat-rules`, `/connections`) em novas abas.

## 3. Componentes e Estrutura
- **CSS:** Estilos definidos em `OnboardingStepsPage.css`.
- **Ícones:** Uso de ícones ilustrativos do `react-icons/fa` (`FaRocket`, `FaBox`, `FaComments`, `FaWhatsapp`).
- O layout é simples: um cabeçalho explicativo (`onboarding-header`) e um container de cards (`steps-container`) mapeados a partir de um array fixo de objetos `steps`.

## 4. Interdependências (Relacionamentos)
- Serve como atalho visual para:
  - [ProductsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ProductsPage.tsx)
  - [SystemPromptsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/SystemPromptsPage.tsx) (Regras do Chat)
  - [ConnectionsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ConnectionsPage.tsx)
