# Gerenciar Empresa (GerenciarEmpresaPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **GerenciarEmpresaPage** é o painel de configurações gerais do próprio lojista (Tenant). É onde a empresa define a sua identidade visual (Logo), seus dias de funcionamento e configura a sua Landing Page de Captura de Leads (QR Code para loja física).
Negocialmente, os "Dias de Funcionamento" impactam diretamente as métricas de SLA do Dashboard, pois o cálculo de Tempo Médio de Resposta só contabiliza dias úteis ativados aqui.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/GerenciarEmpresaPage.tsx`
- **Rotas:** `/configuracao/geral`
- **Uploader de Imagem (Logo):**
  - Usa a tag `<input type="file" />` oculta e `useRef` para acionar a janela de seleção do SO.
  - Implementa um fluxo robusto de corte (Crop) usando um Componente Modal de Crop (`LogoCropModal`).
  - O frontend lê as dimensões naturais usando `Image` (JS nativo) para validar restrições (min 64x64px, max 2000x2000px, aspect ratio entre 1:1 e 4:1) *antes* de tentar subir pro backend.
- **Dias de Funcionamento:** Salva uma matriz booleana (Seg-Dom) que reflete quando a loja opera.

## 3. Componentes e Estrutura
- **`LandingPageConfigTab`:** Um componente filho encapsulado (`src/components/LandingPageConfigTab.tsx`) que controla a customização visual (cores, foto de fundo) da página pública onde os clientes podem deixar nome e telefone (em troca de um cupom ou agendamento).
- **Cards de Resumo (Summary):** Exibem, visualmente, quantos dias a empresa trabalha versus quantos dias ela folga (baseado nos checkboxes).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `GerenciarEmpresaService` (`getDadosGerais`, `atualizarDadosGerais`, `updateLogo`, `getDiasUteis`, `updateDiasUteis`).
- **Consequências Globais:** A URL da `pathLogo` é propagada pelo sistema todo (geralmente lida no Navbar ou SideBar) para garantir o white-label.
- O componente `LandingPageConfigTab` é o motor da `PublicLandingPage` (que é renderizada para o cliente final sem autenticação).
