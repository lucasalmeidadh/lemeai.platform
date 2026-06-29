# Mapeamento de APIs do Backend vs. Páginas do Frontend

Este documento apresenta o mapeamento completo e robusto de todas as APIs do backend da plataforma LemeAI, descrevendo sua finalidade e identificando exatamente em quais páginas do frontend elas são utilizadas.

---

## 1. Gestão de Contatos e Anexos (`ContactService` & `AttachmentService`)

### `GET /api/Contato/BuscarTodos`
*   **Finalidade**: Retorna a lista completa de contatos cadastrados no tenant.
*   **Onde é utilizado**: 
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Listagem geral e busca de contatos).
    *   [ReportsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ReportsPage.tsx) (Filtros e contagem de contatos cadastrados).

### `GET /api/Contato/BuscarPorId/{id}`
*   **Finalidade**: Retorna as informações detalhadas de um único contato.
*   **Onde é utilizado**:
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Visualização detalhada e edição).

### `POST /api/Contato/Criar`
*   **Finalidade**: Cadastra um novo contato.
*   **Onde é utilizado**:
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Formulário de criação de contato).

### `PATCH /api/Contato/Atualizar`
*   **Finalidade**: Atualiza os dados de cadastro de um contato (Nome, Telefone, E-mail).
*   **Onde é utilizado**:
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Salvar alterações de contatos).

### `DELETE /api/Contato/Remover/{id}`
*   **Finalidade**: Remove um contato do sistema.
*   **Onde é utilizado**:
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Exclusão de contato).

### `POST /api/Chat/Conversas/{idConversa}/AdicionarAnexoContato`
*   **Finalidade**: Faz upload de um arquivo e o vincula ao contato da conversa de forma automatizada.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Seção de arquivos, upload de anexos de um Deal).

### `POST /api/Contato/{contatoId}/Anexos/Adicionar`
*   **Finalidade**: Faz upload de um arquivo vinculando diretamente ao contato (sem necessidade de ID de conversa).
*   **Onde é utilizado**:
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Aba de anexos/documentos do contato).

### `GET /api/Chat/Conversas/{idConversa}/AnexosContato`
*   **Finalidade**: Lista todos os arquivos e mídias anexados ao contato dono daquela conversa.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Listagem de anexos na aba de arquivos do Deal).

### `GET /api/Contato/{contatoId}/Anexos`
*   **Finalidade**: Lista todos os anexos de um contato específico.
*   **Onde é utilizado**:
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Exibição de histórico de documentos do contato).

### `GET /api/Contato/Anexos/{idAnexo}/Arquivo` / `GET /api/Chat/Anexos/{idAnexo}/Arquivo`
*   **Finalidade**: Recupera o binário do arquivo para visualização/download direto no navegador.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Visualização e link para baixar mídias anexadas).
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Visualização de anexos do contato).

### `DELETE /api/Contato/Anexos/{idAnexo}/Remover` / `DELETE /api/Chat/Anexos/{idAnexo}/Remover`
*   **Finalidade**: Exclui um anexo permanentemente do servidor e desvincula do contato.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Botão de deletar arquivo do Deal).
    *   [ContactsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ContactsPage.tsx) (Exclusão de arquivos na aba do contato).

---

## 2. Negócios e Oportunidades (`OpportunityService` & `DetailsService`)

### `GET /api/OportunidadeVenda/BuscarTodas`
*   **Finalidade**: Retorna todas as conversas categorizadas como oportunidades de venda, incluindo dados de status, valores e último contato.
*   **Onde é utilizado**:
    *   [PipelinePage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/PipelinePage.tsx) (Carregamento dos cartões de Deals no funil kanban).
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Pesquisa e detalhamento do Deal ativo).
    *   [GoalsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/GoalsPage.tsx) (Comparação entre metas de vendas e faturamento realizado).
    *   [ReportsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ReportsPage.tsx) (Métricas consolidadas de vendas ganhas/perdidas).

### `GET /api/Detalhes/PorConversa/{idConversa}`
*   **Finalidade**: Obtém o histórico de anotações internas, follow-ups e notas adicionadas a uma oportunidade específica.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Aba de Anotações/Histórico do Deal).

### `POST /api/Detalhes/Adicionar`
*   **Finalidade**: Adiciona uma nova anotação ou altera o valor/status de uma oportunidade comercial.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Criação de novas notas no Deal ou alteração de seu status/valor).

### `PATCH /api/Chat/Conversa/{idConversa}/TipoLead`
*   **Finalidade**: Atualiza a qualificação ou tipo de lead de uma conversa.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Atualização do tipo de lead/qualificação no topo do cabeçalho de detalhes).

### `POST /api/Chat/Conversa/{idConversa}/EnviarMidia`
*   **Finalidade**: Envia arquivos de mídia (imagem, áudio, vídeo, documento) diretamente pelo chat para o cliente.
*   **Onde é utilizado**:
    *   [ChatPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatPage.tsx) (Upload de mídia ao enviar mensagem no chat ativo).

---

## 3. Gestão de Tarefas (`TarefaService` & `TipoTarefaService`)

### `GET /api/TipoTarefa/BuscarTodos`
*   **Finalidade**: Retorna os tipos/categorias de tarefas cadastrados (Reunião, Ligação, Proposta, etc.).
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Dropdown de seleção do tipo ao criar/editar tarefas).

### `POST /api/TipoTarefa/Criar` / `PUT /api/TipoTarefa/Atualizar` / `DELETE /api/TipoTarefa/Remover/{id}`
*   **Finalidade**: CRUD operacional para criação e alteração das categorias de tarefas da empresa.
*   **Onde é utilizado**:
    *   [SystemPromptsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/SystemPromptsPage.tsx) ou menus de parametrização interna de configurações.

### `GET /api/Tarefa/BuscarTodos`
*   **Finalidade**: Retorna todas as tarefas de acompanhamento da empresa.
*   **Onde é utilizado**:
    *   [Dashboard.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/Dashboard.tsx) (Lista de afazeres diários e calendário do painel inicial).

### `GET /api/Tarefa/BuscarPorConversa/{conversaId}`
*   **Finalidade**: Retorna as tarefas específicas que estão vinculadas a um determinado Deal/Conversa.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Listagem de tarefas pendentes e concluídas na aba de tarefas do Deal).

### `POST /api/Tarefa/Criar`
*   **Finalidade**: Cria uma nova tarefa pendente vinculada a um lead com uma data de retorno programada.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Formulário de criação de nova tarefa do Deal).

### `PUT /api/Tarefa/Atualizar`
*   **Finalidade**: Altera as propriedades de uma tarefa ou a marca como concluída (`estaConcluida = true`).
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Checkbox para concluir tarefa ou botão para editar dados).

### `DELETE /api/Tarefa/Remover/{id}`
*   **Finalidade**: Exclui uma tarefa.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Botão de deletar tarefa do Deal).

---

## 4. Agenda e Compromissos (`AgendaService`)

### `GET /api/Agenda/BuscarTodos`
*   **Finalidade**: Retorna todos os agendamentos registrados no calendário corporativo da empresa.
*   **Onde é utilizado**:
    *   [AgendaPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AgendaPage.tsx) (Renderização de eventos na visualização mensal/semanal/diária do calendário).

### `GET /api/Agenda/EventosDoDia`
*   **Finalidade**: Lista as reuniões e compromissos marcados para a data atual.
*   **Onde é utilizado**:
    *   [Dashboard.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/Dashboard.tsx) (Quadro de compromissos de hoje na tela inicial).

### `GET /api/Agenda/EventosProximoDia`
*   **Finalidade**: Retorna a lista de eventos de amanhã para planejamento prévio.
*   **Onde é utilizado**:
    *   [Dashboard.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/Dashboard.tsx) (Resumos de planejamento futuro).

### `POST /api/Agenda/Criar`
*   **Finalidade**: Cria um agendamento geral no calendário (não vinculado diretamente a um chat).
*   **Onde é utilizado**:
    *   [AgendaPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AgendaPage.tsx) (Botão de adicionar evento diretamente no calendário).

### `PUT /api/Agenda/Atualizar`
*   **Finalidade**: Edita o título, datas ou contato associado a um agendamento.
*   **Onde é utilizado**:
    *   [AgendaPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AgendaPage.tsx) (Modal de edição de evento).

### `DELETE /api/Agenda/Remover/{id}`
*   **Finalidade**: Remove o evento do calendário.
*   **Onde é utilizado**:
    *   [AgendaPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AgendaPage.tsx) (Opção de excluir evento do calendário).

### `GET /api/Chat/Conversas/{conversationId}/Agendamentos`
*   **Finalidade**: Busca reuniões agendadas que foram geradas dentro do contexto de uma conversa com o cliente.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Aba de Agendamentos/Reuniões de um Deal).

### `POST /api/Chat/Conversas/{conversationId}/AdicionarAgendamento`
*   **Finalidade**: Cria um evento de calendário já pré-associado ao contato da conversa ativa.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Botão de agendar reunião na aba de agendamentos do Deal).

---

## 5. Canais e Conexões WhatsApp/Messenger (`MetaService` & `EvolutionService` & `ConexaoPlataformaService`)

### `GET /api/ConfigurarWhatsapp/Status`
*   **Finalidade**: Retorna se o canal WhatsApp ativo usa a API da Meta (Oficial) ou Evolution (Não-oficial), além de validar se o modo multi-conexões está habilitado.
*   **Onde é utilizado**:
    *   [ConnectionsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ConnectionsPage.tsx) (Identificação do status de conectividade do WhatsApp).
    *   [WhatsAppConnectionPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/WhatsAppConnectionPage.tsx) (Alternância entre o painel de pareamento por QR Code ou chaves de desenvolvedor Meta).

### `POST /api/ConfigurarWhatsapp/Coexistencia`
*   **Finalidade**: Grava as credenciais do App da Meta e número ID do WhatsApp oficial.
*   **Onde é utilizado**:
    *   [WhatsAppConnectionPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/WhatsAppConnectionPage.tsx) (Configuração das credenciais oficiais).

### `PATCH /api/ConfigurarWhatsapp/MultiWhatsapp`
*   **Finalidade**: Ativa o suporte para conectar múltiplos canais de WhatsApp.
*   **Onde é utilizado**:
    *   [ConnectionsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ConnectionsPage.tsx) (Interruptor administrativo de multi-conectar).

### `GET /api/InstanciaEvolution/EmpresaUsaEvolution`
*   **Finalidade**: Valida se a conta usa a Evolution API.
*   **Onde é utilizado**:
    *   [WhatsAppConnectionPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/WhatsAppConnectionPage.tsx) (Carregamento da tela de pareamento).

### `POST /api/InstanciaEvolution/Criar`
*   **Finalidade**: Inicializa um container/serviço no backend para a Evolution API.
*   **Onde é utilizado**:
    *   [WhatsAppConnectionPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/WhatsAppConnectionPage.tsx) (Botão "Criar Instância" para exibir o QR Code).

### `GET /api/InstanciaEvolution/QRCode`
*   **Finalidade**: Obtém a representação Base64 do QR Code para leitura no aplicativo móvel do WhatsApp.
*   **Onde é utilizado**:
    *   [WhatsAppConnectionPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/WhatsAppConnectionPage.tsx) (Renderizador do QR Code na tela).

### `GET /api/InstanciaEvolution/StatusIntancia`
*   **Finalidade**: Checa se a instância com o celular físico foi pareada com sucesso (`open` / `connecting`).
*   **Onde é utilizado**:
    *   [WhatsAppConnectionPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/WhatsAppConnectionPage.tsx) (Loop de pooling do frontend para confirmar conexão bem-sucedida).

### `DELETE /api/InstanciaEvolution/Logout` / `DELETE /api/InstanciaEvolution/Remover`
*   **Finalidade**: Desconecta ou exclui completamente a instância pareada do WhatsApp da Evolution API.
*   **Onde é utilizado**:
    *   [WhatsAppConnectionPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/WhatsAppConnectionPage.tsx) (Botão de Desconectar WhatsApp).

### `GET /api/ConexaoPlataforma/BuscarConexoesAtivas`
*   **Finalidade**: Lista todos os canais conectados e ativos da empresa (WhatsApp, Instagram, etc.).
*   **Onde é utilizado**:
    *   [ConnectionsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ConnectionsPage.tsx) (Quadro de integrações conectadas).

### `DELETE /api/ConexaoPlataforma/RemoverComPermissao/{id}`
*   **Finalidade**: Desvincula e apaga um canal de comunicação da empresa.
*   **Onde é utilizado**:
    *   [ConnectionsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ConnectionsPage.tsx) (Botão "Desconectar" de qualquer plataforma).

---

## 6. Integração Instagram (`InstagramService`)

### `POST /api/instagram/conectar`
*   **Finalidade**: Recebe o token OAuth curto concedido pelo Facebook e ativa a integração do Instagram Direct.
*   **Onde é utilizado**:
    *   [ConnectionsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ConnectionsPage.tsx) (Callback após login social do Facebook para ativação).

### `GET /api/instagram/status`
*   **Finalidade**: Retorna as contas/páginas do Instagram atualmente vinculadas.
*   **Onde é utilizado**:
    *   [ConnectionsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ConnectionsPage.tsx) (Exibição de detalhes da conta conectada).

### `DELETE /api/instagram/desconectar/{paginaId}`
*   **Finalidade**: Desativa a automação/escuta de webhooks de mensagens direct para a página indicada.
*   **Onde é utilizado**:
    *   [ConnectionsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ConnectionsPage.tsx) (Botão de desconectar conta do Instagram).

---

## 7. Modelos e Campanhas de Mensagens (`MetaTemplateService` & `CampaignService`)

### `GET /api/meta/template/BuscarTodos`
*   **Finalidade**: Retorna a lista de templates cadastrados na Meta.
*   **Onde é utilizado**:
    *   [CampaignTemplatesPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignTemplatesPage.tsx) (Listagem de templates homologados).
    *   [CampaignPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignPage.tsx) (Seleção do template de disparo da campanha).

### `POST /api/meta/template/Criar` / `PUT /api/meta/template/Atualizar` / `DELETE /api/meta/template/Remover/{id}`
*   **Finalidade**: Cria, edita e remove templates locais/Meta.
*   **Onde é utilizado**:
    *   [CampaignTemplatesPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignTemplatesPage.tsx) (Editor visual de criação de templates HSM do WhatsApp).

### `POST /api/meta/template/Sincronizar`
*   **Finalidade**: Baixa templates homologados diretamente da Meta.
*   **Onde é utilizado**:
    *   [CampaignTemplatesPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignTemplatesPage.tsx) (Botão "Sincronizar com Meta").

### `GET /api/campanha/BuscarTodos`
*   **Finalidade**: Retorna as campanhas de disparos em lote cadastradas.
*   **Onde é utilizado**:
    *   [CampaignPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignPage.tsx) (Lista principal de campanhas de marketing/utilidade).
    *   [PipelinePage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/PipelinePage.tsx) (Filtros de oportunidades geradas por campanhas).

### `GET /api/campanha/ResumoMetricas`
*   **Finalidade**: Consolida métricas gerais (Disparos, Entregas, Cliques, Leituras).
*   **Onde é utilizado**:
    *   [CampaignPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignPage.tsx) (Resumo analítico no topo da página de campanhas).

### `POST /api/campanha/Criar` / `PUT /api/campanha/Atualizar` / `DELETE /api/campanha/Remover/{id}`
*   **Finalidade**: CRUD operacional de campanhas (cria rascunhos, agenda envios).
*   **Onde é utilizado**:
    *   [CampaignPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignPage.tsx) (Painel de configuração e criação de novas campanhas).

### `GET /api/campanha/{id}/destinatarios` / `POST /api/campanha/{id}/destinatarios` / `DELETE /api/campanha/{id}/destinatarios/{destId}`
*   **Finalidade**: Controle dos contatos telefônicos associados que receberão o disparo em lote.
*   **Onde é utilizado**:
    *   [CampaignPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignPage.tsx) (Modal de gerenciamento de contatos/destinatários da campanha).

### `POST /api/campanha/{id}/disparar`
*   **Finalidade**: Processa e inicia a fila de disparos de mensagens automáticas.
*   **Onde é utilizado**:
    *   [CampaignPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignPage.tsx) (Botão "Disparar Campanha").

### `GET /api/campanha/{id}/conversas`
*   **Finalidade**: Apresenta dados analíticos detalhados de entrega por lead na campanha.
*   **Onde é utilizado**:
    *   [CampaignReportsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/CampaignReportsPage.tsx) (Relatório analítico de envio de campanhas).

---

## 8. Metas de Vendas (`MetaGoalService`)

### `GET /api/meta/BuscarTodas`
*   **Finalidade**: Retorna as metas registradas por usuário ou equipe no mês selecionado.
*   **Onde é utilizado**:
    *   [GoalsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/GoalsPage.tsx) (Carregamento da tabela e progresso de metas).

### `POST /api/meta/Criar` / `PUT /api/meta/Atualizar/{id}` / `DELETE /api/meta/Excluir/{id}`
*   **Finalidade**: CRUD operacional de metas comerciais.
*   **Onde é utilizado**:
    *   [GoalsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/GoalsPage.tsx) (Criação, edição e remoção de metas diretamente nas tabelas).

### `POST /api/meta/Replicar`
*   **Finalidade**: Copia a estrutura de metas definida em um mês anterior para um novo mês.
*   **Onde é utilizado**:
    *   [GoalsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/GoalsPage.tsx) (Botão "Replicar metas do mês anterior").

---

## 9. Relatórios de Performance (`RelatorioService` & `ConfiguracaoService`)

### `GET /api/relatorio/FaturamentoMensal`
*   **Finalidade**: Retorna dados históricos de vendas bem-sucedidas por mês.
*   **Onde é utilizado**:
    *   [AnalyticsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AnalyticsPage.tsx) (Gráficos temporais de faturamento).

### `GET /api/relatorio/PerformanceIndividual`
*   **Finalidade**: Retorna estatísticas de performance individual (vendedor x faturamento x ligações x metas).
*   **Onde é utilizado**:
    *   [GoalsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/GoalsPage.tsx) (Aba de visualização de progresso individual).
    *   [AnalyticsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AnalyticsPage.tsx) (Ranking de vendedores).

### `GET /api/relatorio/PerformanceEquipes`
*   **Finalidade**: Consolida o desempenho das equipes frente a metas coletivas.
*   **Onde é utilizado**:
    *   [GoalsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/GoalsPage.tsx) (Aba de visualização de progresso das equipes).
    *   [AnalyticsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AnalyticsPage.tsx) (Estatísticas comparativas de time de vendas).

### `GET /api/relatorio/PerformanceEquipeMembros`
*   **Finalidade**: Abre a performance interna dos vendedores que pertencem a uma equipe selecionada.
*   **Onde é utilizado**:
    *   [AnalyticsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AnalyticsPage.tsx) (Detalhamento do progresso ao clicar sobre uma equipe).

### `GET /api/relatorio/ProjecaoFechamento`
*   **Finalidade**: Calcula previsibilidade de atingimento de metas com base na média atual de vendas.
*   **Onde é utilizado**:
    *   [AnalyticsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/AnalyticsPage.tsx) (Cards de previsão de fechamento de faturamento).

### `GET /api/configuracao/DiasUteis` / `PUT /api/configuracao/DiasUteis`
*   **Finalidade**: Configura quais dias da semana contam como úteis na empresa para ajustar as previsões.
*   **Onde é utilizado**:
    *   [WorkingDaysPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/WorkingDaysPage.tsx) (Configurações operacionais da empresa).

---

## 10. Automação e Inteligência Artificial (`RegrasIAService`)

### `GET /api/RegrasIA/BuscarTodos` / `POST /api/RegrasIA/CriarRegra` / `PUT /api/RegrasIA/AtualizarRegra/{id}` / `DELETE /api/RegrasIA/ExcluirRegra/{id}`
*   **Finalidade**: Gerencia a lista de regras de resposta automática do agente robô.
*   **Onde é utilizado**:
    *   [SystemPromptsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/SystemPromptsPage.tsx) (Listagem e CRUD de regras operacionais de IA).

### `GET /api/RegrasIA/BuscarConfigAgente` / `POST /api/RegrasIA/CriarConfigAgente` / `PUT /api/RegrasIA/AtualizarConfigAgente`
*   **Finalidade**: Configuração das instruções mestres de introdução, cabeçalho e encerramento das mensagens enviadas pela IA.
*   **Onde é utilizado**:
    *   [SystemPromptsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/SystemPromptsPage.tsx) (Painel principal de persona do agente de IA).

---

## 11. Catálogo de Produtos (`ProductService`)

### `GET /api/Produto/BuscarTodos`
*   **Finalidade**: Lista todos os produtos cadastrados no inventário.
*   **Onde é utilizado**:
    *   [ProductsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ProductsPage.tsx) (Grade/tabela principal de inventário).
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Listagem de produtos para associação de itens vendidos em um Deal).
    *   [ReportsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ReportsPage.tsx) (Cálculos de itens e preços mais vendidos).

### `POST /api/Produto/Criar` / `PUT /api/Produto/Atualizar/{id}` / `DELETE /api/Produto/Deletar/{id}`
*   **Finalidade**: Cadastro e manutenção de itens de venda do catálogo.
*   **Onde é utilizado**:
    *   [ProductsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ProductsPage.tsx) (Ações de adicionar, alterar e excluir produtos).

---

## 12. Planos e Faturamento (`billingService`)

### `GET /api/plano/BuscarTodos` / `POST /api/plano/Criar` / `PUT /api/plano/Atualizar` / `DELETE /api/plano/Remover/{id}`
*   **Finalidade**: Gerenciamento de planos cadastrados para os clientes.
*   **Onde é utilizado**:
    *   [PlanManagementPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/PlanManagementPage.tsx) (Cadastro e controle administrativo de planos de serviço).
    *   [BillingPlanPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/BillingPlanPage.tsx) (Visualização dos planos contratáveis para os usuários finais).

### `GET /api/assinatura/BuscarAssinatura`
*   **Finalidade**: Carrega os dados da assinatura corrente do tenant autenticado.
*   **Onde é utilizado**:
    *   [BillingPlanPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/BillingPlanPage.tsx) (Exibição do plano contratado atualmente e data de vencimento).

### `POST /api/assinatura/CriarCheckout`
*   **Finalidade**: Inicializa a contratação de um plano gerando uma fatura/checkout.
*   **Onde é utilizado**:
    *   [BillingPlanPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/BillingPlanPage.tsx) (Botão "Assinar" que redireciona o cliente para pagamento).

### `PATCH /api/assinatura/TrocarPlano`
*   **Finalidade**: Executa upgrade ou downgrade de planos recorrentes contratados.
*   **Onde é utilizado**:
    *   [BillingPlanPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/BillingPlanPage.tsx) (Botão "Trocar de Plano").

---

## 13. Administração Multi-Tenant de Empresas e Times (`EmpresaService` & `EquipeService`)

### `GET /api/AdministrarEmpresas/BuscarTodasEmpresas` / `POST /api/AdministrarEmpresas/CriarEmpresa` / `PATCH /api/AdministrarEmpresas/AtualizarEmpresa` / `DELETE /api/AdministrarEmpresas/DesativarEmpresa/{id}`
*   **Finalidade**: Controle e onboarding de empresas parceiras na plataforma LemeAI.
*   **Onde é utilizado**:
    *   [EmpresasPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/EmpresasPage.tsx) (Gestão administrativa geral de tenants de clientes).

### `GET /api/equipe/BuscarTodas` / `POST /api/equipe/Criar` / `PUT /api/equipe/Atualizar/{id}` / `DELETE /api/equipe/Excluir/{id}`
*   **Finalidade**: Criação de grupos e times internos de atendentes/vendedores.
*   **Onde é utilizado**:
    *   [TeamsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/TeamsPage.tsx) (Lista e formulários de gerenciamento de equipes).
    *   [GoalsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/GoalsPage.tsx) (Associação de metas coletivas ao time correto).

---

## 14. Gestão de Usuários, Perfis e Acessos (Chamadas Diretas de API)

### `GET /api/Usuario/BuscarTodos`
*   **Finalidade**: Lista todos os operadores e usuários cadastrados no tenant da empresa.
*   **Onde é utilizado**:
    *   [UserManagementPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/UserManagementPage.tsx) (Grade principal de gestão de usuários).

### `POST /api/Usuario/CriarUsuario` / `PUT /api/Usuario/Atualizar/{id}` / `DELETE /api/Usuario/Deletar/{id}`
*   **Finalidade**: Criação, atualização de dados e inativação física de operadores no sistema.
*   **Onde é utilizado**:
    *   [UserManagementPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/UserManagementPage.tsx) (Modal de formulário e exclusão lógica/desativação de usuários).

### `GET /api/TipoUsuario/BuscarTodos`
*   **Finalidade**: Lista os perfis de acesso cadastrados (ex: Administrador, Vendedor).
*   **Onde é utilizado**:
    *   [UserManagementPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/UserManagementPage.tsx) (Dropdown de seleção de perfil para o usuário).

### `GET /api/PermissaoAcesso/PermissoesPorTipoUsuario/{tipoPerfil}` / `PATCH /api/PermissaoAcesso/PermissoesPorTipoUsuario`
*   **Finalidade**: Busca e salva as permissões atribuídas a um determinado perfil (quais módulos ele pode visualizar).
*   **Onde é utilizado**:
    *   [ProfileManagementPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ProfileManagementPage.tsx) (Painel de controle de perfil e chaves liga/desliga de privilégios).

### `GET /api/Auth/Me`
*   **Finalidade**: Retorna as informações do usuário autenticado no momento através do token JWT ativo.
*   **Onde é utilizado**:
    *   [Login.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/Login.tsx) (Validação pós-login para redirecionamento).
    *   [ChatPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatPage.tsx) (Identificação de nome e ID do vendedor logado para transferências).
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Atribuição do usuário criador de notas/anotações).

### `POST /api/Auth/login` / `/api/Auth/refresh-token`
*   **Finalidade**: Autenticação de usuários e atualização automática de tokens JWT expirados.
*   **Onde é utilizado**:
    *   [Login.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/Login.tsx) (Formulário de acesso).
    *   [api.ts](file:///c:/git/lemeai.platform/lemeai-platform/src/services/api.ts) (Interceptor padrão para interceptar erros 401).

---

## 15. Endpoints de Conversas e Envio Direto de Chat

### `GET /api/Chat/ConversasPorVendedor`
*   **Finalidade**: Retorna as conversas ativas atribuídas ao vendedor autenticado no momento.
*   **Onde é utilizado**:
    *   [ChatPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatPage.tsx) (Preenchimento da lista lateral de conversas ativas).

### `GET /api/Chat/Conversas/{idConversa}/Mensagens`
*   **Finalidade**: Retorna o histórico cronológico de mensagens trocadas em uma conversa.
*   **Onde é utilizado**:
    *   [ChatPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatPage.tsx) (Visualização da janela de mensagens).
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Aba de Chat do Deal).

### `POST /api/Chat/Conversas/{idConversa}/EnviarMensagem`
*   **Finalidade**: Envia uma mensagem de texto simples do atendente para o cliente.
*   **Onde é utilizado**:
    *   [ChatPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatPage.tsx) (Botão enviar do input).
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Envio de mensagens na aba de Chat).

### `PATCH /api/Chat/Conversas/{idConversa}/AtualizarStatus`
*   **Finalidade**: Altera o estágio/status de vendas da oportunidade comercial associada à conversa.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Dropdown de alteração do estágio do funil).

### `PATCH /api/Chat/Conversas/{idConversa}/TranferirConversa`
*   **Finalidade**: Transfere a responsabilidade do atendimento da conversa para outro vendedor.
*   **Onde é utilizado**:
    *   [ChatPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatPage.tsx) (Menu de transferência de conversas).

### `DELETE /api/Chat/Conversas/{idConversa}`
*   **Finalidade**: Deleta ou arquiva a conversa.
*   **Onde é utilizado**:
    *   [DealDetailsPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/DealDetailsPage.tsx) (Botão de excluir/deletar conversa).

---

## 16. Central de Ajuda e Tutoriais (`HelpService`)

### `GET /api/Help/Categorias`
*   **Finalidade**: Retorna as categorias disponíveis de artigos/tutoriais.
*   **Onde é utilizado**:
    *   [HelpPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/HelpPage.tsx) (Listagem de categorias).
    *   [HelpManagerPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/HelpManagerPage.tsx) (Seleção de categoria no modal).

### `GET /api/Help/Artigos`
*   **Finalidade**: Retorna todos os artigos da base de conhecimento, com filtros opcionais de texto e categoria.
*   **Onde é utilizado**:
    *   [HelpPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/HelpPage.tsx) (Listagem e busca de tutoriais).
    *   [HelpManagerPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/HelpManagerPage.tsx) (Tabela de administração).

### `GET /api/Help/Artigos/{id}`
*   **Finalidade**: Retorna o conteúdo completo (texto/HTML) de um artigo de ajuda específico.
*   **Onde é utilizado**:
    *   [HelpArticlePage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/HelpArticlePage.tsx) (Leitura do tutorial completo).

### `POST /api/Help/Artigos` / `PUT /api/Help/Artigos/{id}` / `DELETE /api/Help/Artigos/{id}`
*   **Finalidade**: CRUD administrativo de artigos e tutoriais.
*   **Onde é utilizado**:
    *   [HelpManagerPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/HelpManagerPage.tsx) (Criação, edição e remoção).

### `POST /api/Help/UploadImagem`
*   **Finalidade**: Faz upload de imagens inseridas no corpo de um artigo através de `FormData`.
*   **Onde é utilizado**:
    *   [HelpManagerPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/HelpManagerPage.tsx) (Botão "Inserir Imagem" no editor).

