# Agenda (Calendário e Integração Google)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **AgendaPage** é o calendário nativo do CRM. Seu propósito comercial é organizar os compromissos (reuniões, follow-ups, visitas) dos vendedores. 
O grande diferencial de negócio desta tela é a **Sincronização Bidirecional Opcional com o Google Calendar**. O vendedor pode vincular sua conta do Google Workspace/Gmail, e os eventos criados no CRM aparecerão no Google Calendar (e vice-versa, na ação de Sincronizar).

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/AgendaPage.tsx`
- **Rotas:** `/agenda`
- **Componentização do Calendário:** 
  - Não utiliza bibliotecas de calendário prontas pesadas. Foi construída "do zero" utilizando funções puras de manipulação de datas do `date-fns` (como `startOfMonth`, `endOfWeek`, `isSameDay`).
  - Renderiza uma grid clássica de 7x5 (ou 7x6) dividida em células (`calendar-day`).
- **Autenticação Google (OAuth):**
  - Utiliza abertura de Popup (`window.open`) para a URL de Auth do Google fornecida pelo backend.
  - O Front-end escuta o retorno via Web PostMessage (`window.addEventListener('message')`). A página de callback (`GoogleCalendarCallbackPage.tsx`) que carrega dentro do popup dispara `window.opener.postMessage(...)` informando se o token foi gerado com sucesso.
- **Sincronização Sob Demanda:** O botão "Sincronizar" varre o mês ativo, pedindo para o backend buscar as novidades no Google e conciliar.

## 3. Componentes e Estrutura
- **Main Calendar:** A área da esquerda mostrando a grid do mês.
- **Sidebar:** Área da direita. Mostra detalhadamente os compromissos do dia clicado e um card de "Próximos Eventos".
- **`AppointmentModal`**: O modal responsável por preencher os dados de um novo agendamento. Se a conta Google estiver conectada, ele exibe um *checkbox* perguntando se este evento deve ser mandado pro Google.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `AgendaService` (`getAll`, `create`, `update`, `remove`, `sincronizar`).
  - `ContactService.getAll` (Para o vendedor poder linkar a reunião a um Contato preexistente).
  - `GoogleCalendarService` (Checagem de status e geração de URL de Auth).
- Comunica-se intensamente com o callback de autorização Google, dependendo do bloqueador de Pop-ups do navegador do usuário estar desativado para o domínio da plataforma.
