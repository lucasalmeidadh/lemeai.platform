# Templates de Campanha (CampaignTemplatesPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **CampaignTemplatesPage** é a interface de criação e aprovação de HSMs (Highly Structured Messages) exigidos pela Meta. Negocialmente, para que a empresa possa iniciar uma conversa ativa com um lead fora da janela de 24h, ela é obrigada a usar um Template aprovado previamente pela equipe do WhatsApp.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/CampaignTemplatesPage.tsx`
- **Rotas:** `/campanhas/templates`
- **Editor Dinâmico e Validador Meta:**
  - Controla um formulário altamente estrito para refletir a API da Meta.
  - Suporta placeholders de variáveis (`{{1}}`, `{{2}}`), mapeando-as dinamicamente através de uma `Regex` no corpo de texto e exigindo um "Exemplo" em tempo real.
  - Suporta formatação de cabeçalho complexa: `TEXT`, `IMAGE`, `VIDEO`, `DOCUMENT`, `LOCATION`.
  - Se for envio de mídia (Imagem/Documento/Vídeo), o React faz o upload do arquivo e gera um `handle` via Graph API antes mesmo de salvar o formulário (`obterHandleExemplo`).
- **Pré-visualização (Live Preview):** Renderiza uma bolha nativa idêntica ao WhatsApp para o usuário ver o resultado final (incluindo renderização condicional de Botoes).

## 3. Componentes e Estrutura
- **`StatusBadge` e `CategoriaBadge`:** Indicadores visuais do status do template na Meta (`PENDING`, `APPROVED`, `REJECTED`, etc.).
- **`WhatsAppPreview`:** Componente complexo que simula o celular do usuário final preenchendo as variáveis falsas (`resolveVariables`).
- **`CreateTemplateModal`:** O grande modal onde a mágica acontece. Controla a restrição dos botões interativos (ex: no máximo 2 botões de URL, 1 de Telefone que conflita com Voz, e 1 de Copiar Código).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `MetaTemplateService` (`getAll`, `create`, `update`, `delete`, `obterHandleExemplo`).
- **Guardião de Conexão:** A página é envelopada pelo componente `<WhatsAppConnectionGuard>`, ou seja, se a conta do Meta não estiver pareada em `ConnectionsPage`, a tela é bloqueada.
- Os templates listados aqui com status `APPROVED` alimentam a lista suspensa na tela de `CampaignPage`.
