# Chat (Atendimento Multicanal WhatsApp/IA)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **ChatPage** é o coração da operação de atendimento da plataforma. Nela, vendedores e atendentes gerenciam as conversas que entram via WhatsApp (muitas vezes originadas de IA que foi "encerrada" ou solicitou intervenção humana). O objetivo de negócios é centralizar a comunicação de forma similar ao WhatsApp Web, permitindo disparar mensagens textuais, áudios e arquivos. Além de falar, o atendente pode transferir a conversa para outro vendedor (distribuição de leads) e visualizar todos os metadados do CRM diretamente no painel lateral.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/ChatPage.tsx`
- **Rotas:** `/chat`
- **Gestão de Estado e Tempo Real (WebSockets):**
  - **WebSocket / SignalR:** Utiliza `hubService` (`HubConnectionService.ts`) consumindo o contexto global (`isHubConnected`). Ao selecionar um chat, ele se junta ao grupo do servidor (`JoinConversationGroup`) e sai ao mudar (`LeaveConversationGroup`). Escuta novos eventos `ReceiveNewMessage` para popular as mensagens em tempo real na tela do usuário, sem refresh.
  - **Otimismo de UI (Optimistic Updates):** Ao enviar uma mensagem ou mídia, o front-end cria uma mensagem `optimisticMessage` (com status `sending`) e a injeta visualmente na tela antes da API retornar o 200 OK. Se a requisição falhar, ele troca o status para `failed`.
- **Validação de Conexão WhatsApp:** Usa `MetaService.checkStatus()` no carregamento para bloquear ou habilitar a caixa de texto de envio de mensagens (`disabled={isWhatsappDisabled}`). Se a instância caiu, força um banner superior de aviso.
- **Responsividade:** Controla via state `isMobile` a exibição em condicional (Ou a lista de contatos, Ou a janela de chat). O Desktop exibe ambos com Grid layout lado a lado.
- **Transferência de Responsável:** `handleTransferConversation` chama a API `PATCH /api/Chat/Conversas/:id/TranferirConversa`. Em caso de sucesso, o chat some da aba deste vendedor imediatamente (`filter`).

## 3. Componentes e Estrutura
Página extremamente robusta e dividida em vários subcomponentes especialistas injetados nela:
- **`ContactList`**: A barra lateral de conversas ativas.
- **`ConversationHeader`**: O topo da conversa ativa, abriga o botão de Transferir Vendedor e dados do Lead.
- **`ConversationWindow`**: Responsável pelo scroll e pela plotagem dos balões de mensagens divididos por datas.
- **`MessageInput`**: A caixa de texto, botão de enviar anexos, enviar áudios e controle de bloqueio.
- **`DetailsPanel`**: (Opcional, ativado via `isDetailsPanelOpen`) - A aba lateral direita contendo os dados brutos de negócio (Valor, Estágio, Temperatura).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas exaustivamente:**
  - `GET /api/Auth/me` (Busca UUID do logado).
  - `GET /api/Chat/ConversasPorVendedor` (Puxa as últimas mensagens de todos os chats daquele vendedor e faz *merge* em memória com os cards do `OpportunityService`).
  - `GET /api/Chat/Conversas/:id/Mensagens` (Puxa o histórico histórico de 1 chat).
  - `POST /api/Chat/Conversas/:id/EnviarMensagem` e `ChatService.enviarMidia`
- O Chat reflete e também altera os status das oportunidades que são vistas na [PipelinePage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/PipelinePage.tsx).
