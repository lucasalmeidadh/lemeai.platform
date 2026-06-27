# Canais de Conexão (ConnectionsPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **ConnectionsPage** é onde a empresa vincula seus números de WhatsApp (e no futuro, Instagram) à plataforma do CRM. Negocialmente, sem uma conexão ativa, o CRM perde sua principal capacidade "omnichannel" de captura e atendimento.
Ela embute uma parceria oficial com a Meta (Facebook), permitindo que o cliente se autentique (SSO) de maneira oficial para utilizar a Cloud API (WABA) do WhatsApp Business.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/ConnectionsPage.tsx`
- **Rotas:** `/conexoes`
- **Gestão de Abas:** `activeTab` intercala a visão entre as conexões existentes (`connections`) e o processo de Nova Conexão (`whatsapp`). A aba de Instagram está comentada aguardando aprovação da Meta.
- **Integração OAuth (Facebook SDK):**
  - Carrega dinamicamente a tag `<script src="https://connect.facebook.net/pt_BR/sdk.js">`.
  - Executa a função `FB.login` solicitando escopo e o modo *WhatsApp Business App Onboarding (Embedded Signup)*.
  - Escuta `window.addEventListener('message')` aguardando os eventos `WA_EMBEDDED_SIGNUP` da janela Pop-up para capturar os tokens `phone_number_id` e `waba_id`.
- **Modo Multi-contas (Apenas Admin):** 
  - Se habilitado (`multiWhatsappHabilitado`), a empresa pode vincular dezenas de números simultâneos. Se desabilitado, a tela trava a adição se `hasWhatsapp` já for true, protegendo os planos básicos contra abuso.

## 3. Componentes e Estrutura
- **Guia de Pré-requisitos:** Um pequeno FAQ Sanfona (`prereq-section`) educando o usuário a criar Portfólio, ter um número e cadastrar cartão de crédito no Meta Business Manager antes de clicar no botão.
- **Renderização de Bloqueio (`renderBlockedState`):** Componente visual de *Paywall/Lock* amigável que explica porquê o botão está desabilitado quando o limite é atingido.
- **Listagem (`renderConnectionCard`):** Cards listando o nome, status (Ativo/Inativo/Expirado), número (Identificador) e o dono da conexão, com um seletor visual de ícone (WhatsApp ou Instagram). O botão de deletar conexão, por segurança da arquitetura do banco, está temporariamente comentado.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `ConexaoPlataformaService.buscarConexoesAtivas()`
  - `MetaService` (`configurarCoexistencia`, `toggleMultiWhatsapp`, `getWhatsappStatus`, `getMetaConfig`).
- Afeta globalmente o sistema. Se a conexão cair, a mensageria na `ChatPage` e as aprovações de template na `CampaignTemplatesPage` vão falhar severamente.
