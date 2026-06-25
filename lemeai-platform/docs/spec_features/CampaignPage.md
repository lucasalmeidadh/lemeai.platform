# Disparo de Campanhas (CampaignPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **CampaignPage** é o motor de vendas ativas (Growth) da plataforma. Ela orquestra a criação, rascunho e disparo de milhares de mensagens (HSMs) pelo WhatsApp usando a Meta API Cloud. 
Negocialmente, cada disparo gera custo para a empresa (mostrado em tempo real no wizard), e o objetivo da tela é facilitar a seleção de público, vinculação de templates e injeção de variáveis personalizadas (ex: Nome do Contato, Variáveis do Arquivo Colado).

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/CampaignPage.tsx`
- **Rotas:** `/campanhas`
- **Fluxo Wizard (4 Passos):**
  - **Passo 1 (Identificação):** Nome da campanha.
  - **Passo 2 (Público):** Permite adicionar contatos de 3 formas: Selecionar da Base, Digitar Manualmente ou Colar lista (Nome/Telefone). Controla a duplicidade e gerencia a adição/remoção em tempo real.
  - **Passo 3 (Conteúdo):** Onde o usuário seleciona um Template `APPROVED` da Meta. O React renderiza formulários dinâmicos com base nas variáveis do template. Há lógica para buscar coordenadas GPS geocoding usando a API do ArcGIS caso o template peça uma "LOCATION".
  - **Passo 4 (Revisão):** Resumo financeiro (Custo estimado: Qtd x R$0,31) e botão de Disparo.
- **Ciclo de Vida (Rascunho):**
  - Se a pessoa fechar, ou salvar como Rascunho, o `CampaignService` salva os metadados. O `CampaignService.addDestinatarios` salva o público que já foi selecionado para poder voltar e continuar de onde parou.

## 3. Componentes e Estrutura
- **Tabela de Listagem:** Exibe as Campanhas com status (`Rascunho`, `Enviando`, `Finalizada`), e botões para Editar, Retomar Envio (se falhou), ou Deletar.
- **Wizard Modal:** Controla as validações antes de permitir avançar o passo. A API de geolocalização (`handleSearchCoordinates`) é robusta e tem fallbacks caso falhe, para garantir o disparo de templates de endereço.
- **Indicadores Visuais (Summary):** Caixa na direita no modal (Passo 2) detalhando exatamente quem vai receber.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `CampaignService` (`getAll`, `create`, `update`, `disparar`, `addDestinatarios`, `removeDestinatario`).
  - `MetaTemplateService.getAll()` (Exibe apenas `status === 'APPROVED'`).
  - `ContactService.getAll()` (Para a seleção de público).
- **Guardião de Conexão:** A página é envelopada pelo componente `<WhatsAppConnectionGuard>`, forçando o usuário a conectar o WhatsApp em `ConnectionsPage` primeiro.
- **API Externa de Geocoding:** Usa `geocode.arcgis.com` para transformar endereços em Latitude e Longitude.
