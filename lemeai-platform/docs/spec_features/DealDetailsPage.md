# Detalhes da Oportunidade (Deal Details)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **DealDetailsPage** é o "Prontuário" de um Lead (Oportunidade). Quando o vendedor clica num card no Funil de Vendas (Pipeline) ou em outras áreas, ele é direcionado para esta tela para analisar a ficha completa daquele negócio. O objetivo de negócios desta tela é centralizar todas as interações com o cliente: o histórico de chat do WhatsApp, as anotações do vendedor, anexos submetidos, produtos oferecidos na negociação, agendamentos de reuniões/tarefas e campos extras customizados pela empresa.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/DealDetailsPage.tsx`
- **Rotas:** `/deal/:id`
- **Gestão de Estado e Múltiplas Abas (Tabs):** A tela é dividida em um cabeçalho estático (Header) com métricas de negócio e uma área inferior com `activeTab` gerenciando 6 abas principais:
  1. `customFields` (Campos Personalizados - aba inicial padrão).
  2. `notes` (Anotações do Vendedor).
  3. `chat` (Espelho do chat do WhatsApp).
  4. `attachments` (Gerenciador de arquivos).
  5. `agenda` (Tarefas e reuniões vinculadas à oportunidade).
  6. `products` (Produtos embutidos na oportunidade para cálculo de valor).
- **Controles de Risco/Regras de Negócio:**
  - Possui a mesma trava térmica do Kanban: não é possível mover o Status para Ganho (`3`) sem definir o Lead como Quente (`tipoLeadId = 1`).
  - Edição in-line do Valor do negócio.
- **Componentes Embutidos:** 
  - Reaproveita pesadamente o `ConversationWindow` (para renderizar os balões do chat passados) e `MessageInput` (embora num formato menor).

## 3. Componentes e Estrutura
Arquivo denso (>2000 linhas), atuando como Controller de múltiplos serviços simultâneos:
- **Header:** Exibe Nome, Data de Criação, Valor, Status, Responsável, Origem, e Ícone de Assumir lead.
- **Formulários Isolados:**
  - `handleSaveCustomFields`: Salva o formulário dinâmico gerado.
  - `handleSaveDetails`: Insere logs/notas de texto na timeline.
  - `handleFileUpload`: Envio multipart para a API de Anexos.
  - `handleSaveTask`: Salva tarefas com `DatePicker`.

## 4. Interdependências (Relacionamentos)
- É talvez a página com mais importações de `Services` do projeto:
  - `OpportunityService` (Busca os dados base do negócio).
  - `ProductService` / `ConversaProdutoService` (Relacionamento de catálogo N:N).
  - `ChatService` / `apiFetch` direta (Mensageria e Mudança de Status/Temperatura).
  - `AttachmentService` (Upload/Download).
  - `AgendaService` / `TarefaService` (Compromissos).
  - `CampoPersonalizadoValorService` (Inputs dinâmicos de formulário).
- Ação do usuário aqui repercute diretamente no Kanban (PipelinePage) e em Chat (ChatPage).
