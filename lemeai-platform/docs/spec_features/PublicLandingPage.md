# Public Landing Page (Página de Captura / Link na Bio)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **Public Landing Page** é uma interface pública (`/p/:token`) acessível por clientes finais (leads). Seu objetivo principal é capturar dados de contato (Nome, Telefone, Como Conheceu, Cidade) e inseri-los automaticamente no funil de vendas (CRM) da empresa. 
Ela é altamente customizável pelo tenant (logotipo, cores primárias, fundo e lista de segmentos "Como conheceu"). Além da captura, possui um forte apelo de marketing: pode gerar e exibir um **Cupom de Desconto** dinâmico na tela de sucesso para incentivar a conversão.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/PublicLandingPage.tsx`
- **Rotas:** `/p/:token` (Onde `:token` é o identificador único e ofuscado do tenant/empresa).
- **Gerenciamento de Estilo Dinâmico (Theming):** 
  - Lê `primaryColor`, `backgroundColor` e `textColor` da configuração da página e injeta variáveis CSS inline (`style={themeStyles}`) no contêiner principal para "vestir" a página com a identidade da empresa.
  - Libera o `overflow: auto` no `body` e `html` para permitir rolagem, revertendo no *unmount* (já que o CRM principal usa `overflow: hidden`).
- **Formulário e Validações:**
  - Máscara de Telefone customizada em tempo real (`handlePhoneChange`).
  - Autocomplete de Endereço via API pública do **ViaCEP** (`https://viacep.com.br/ws/`). Apesar da lógica completa de endereço existir, a UI atual expõe apenas o input de "Cidade".
  - Select Dinâmico: A lista "Como conheceu" (`configuredSegments`) vem da API. Se for "Outros", abre um campo de texto adicional.
- **Processamento de Cadastro:**
  - Chamada a `PublicLandingPageService.registerContact(token, data)`.
  - Se a configuração `promoActive` estiver ligada no backend, a API retorna `promoCode` e `promoText`, que são renderizados em um "Ticket" visual na tela de sucesso.

## 3. Componentes e Estrutura
- Utiliza **[CustomSelect.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/CustomSelect.tsx)** para a seleção customizada de segmentos.
- Módulo isolado de CSS em `PublicLandingPage.css` projetado especificamente para ser mobile-first (já que 90% dos acessos a essa página vêm de Instagram/QR Codes).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `PublicLandingPageService.getPageDetails(token)`: Busca o layout, cores, logo e campos ativos.
  - `PublicLandingPageService.registerContact(token, form)`: Registra o contato e devolve o cupom.
  - `getMidiaUrl` de `GerenciarEmpresaService`: Utilitário para resolver a URL real do logotipo da empresa armazenado em nuvem.
- **Outras Páginas/Módulos:** 
  - As configurações que afetam esta página são definidas pelo lojista internamente no painel administrativo ([GerenciarEmpresaPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/GerenciarEmpresaPage.tsx) - Aba de Configuração da Landing Page).
  - Os leads gerados aqui aparecem automaticamente na listagem de [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) e na [PipelinePage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/PipelinePage.tsx) (caso gere uma oportunidade imediata via backend).
