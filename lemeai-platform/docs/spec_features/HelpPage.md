# Central de Ajuda (Help Page)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **HelpPage** é a central educacional interna da plataforma. Ela disponibiliza uma grade (grid) de tutoriais em vídeo para treinar novos colaboradores da empresa (como vendedores ou gerentes) na utilização dos recursos principais do CRM, como Kanban de Vendas, Chat IA, Conexão WhatsApp e Relatórios. 
Aumenta a retenção do cliente através de *self-service support*, reduzindo dúvidas operacionais básicas.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/HelpPage.tsx`
- **Rotas:** `/help`
- **Funcionalidade:**
  - Carrega uma lista de vídeos a partir de uma constante interna `tutorials` mapeada na interface `VideoTutorial` (atualmente contendo placeholders estáticos do YouTube, requer substituição manual ou via API futuramente).
  - O clique sobre um card de vídeo (`handleVideoClick`) dispara uma abertura de nova aba do navegador para o link correspondente (`window.open(url, '_blank')`).
  - Sem persistência ou estado complexo no backend associado. É uma tela *stateless*.

## 3. Componentes e Estrutura
- **CSS:** Totalmente contido em `HelpPage.css`. Estilização baseada em grid responsivo para apresentar os "Thumbnail Cards" com a duração e botões overlay de "Play".
- **Ícones:** Usa `FaPlay` e `FaQuestionCircle` do `react-icons/fa`.
- Não renderiza sub-componentes customizados complexos, iterando diretamente sobre o array local com o método `.map()`.

## 4. Interdependências (Relacionamentos)
- Sem dependências de rotas ou serviços externos.
- É acessada geralmente através do menu do Topbar ou Sidebar na área de "Suporte" do usuário logado.
