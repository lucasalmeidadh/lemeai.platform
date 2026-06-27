# Google Calendar Callback Page

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **Google Calendar Callback Page** não é uma página navegável no sentido estrito, mas sim uma página de transição (geralmente aberta via Popup `window.open`) responsável por receber o redirecionamento OAuth 2.0 do Google. Seu objetivo é processar a autorização concedida pelo usuário para sincronizar sua agenda pessoal/corporativa do Google com a Agenda interna do CRM. Após processar, a janela informa o sistema principal do sucesso ou falha e se auto-encerra.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/GoogleCalendarCallbackPage.tsx`
- **Rotas:** `/integracoes/google/callback`
- **Fluxo OAuth 2.0:** 
  1. A página extrai os parâmetros da URL (`?code=...` ou `?error=...`).
  2. Se houver erro, notifica a janela pai (`window.opener`) e fecha.
  3. Se houver código de autorização (`code`), envia-o para o backend através de `GoogleCalendarService.authCallback(code, redirectUri)`.
  4. O backend troca o código temporário por tokens de acesso/refresh e os vincula ao perfil do usuário atual.
- **Cross-Window Communication:** 
  - Utiliza a API nativa do navegador `window.opener.postMessage` para enviar o evento constante `lemeai:google-calendar-auth` com o status de sucesso.
  - Isso permite que a página de Agenda (`AgendaPage`), que abriu o popup original, receba o sinal e atualize a interface automaticamente (recarregando os eventos sincronizados) sem precisar de um refresh manual pelo usuário.
- **Auto-Encerramento:** Possui um `setTimeout` de 1,8 segundos que executa `window.close()` em um bloco `finally`, garantindo que a popup se feche independentemente do resultado visual da operação.

## 3. Componentes e Estrutura
- Componente visual minúsculo, renderizando apenas ícones (Spinner de carregamento, CheckCircle para sucesso, TimesCircle para erro) da biblioteca `react-icons/fa`.
- Não renderiza headers, footers ou menus laterais, sendo totalmente clean.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `GoogleCalendarService.authCallback(code, redirectUri)`
- **Outras Páginas:** 
  - Chamada diretamente por botões de conexão dentro da [AgendaPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AgendaPage.tsx). A Agenda escuta o evento `message` gerado por esta página.
