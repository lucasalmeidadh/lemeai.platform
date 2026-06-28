# Documentação de Funcionalidade: Central de Ajuda

## 1. Escopo e Objetivo
A funcionalidade de **Central de Ajuda** permite que os usuários da LemeAI encontrem tutoriais em vídeo e artigos passo a passo (com textos e imagens) para aprender a utilizar as funcionalidades da plataforma de forma independente. 

Adicionalmente, foi criada uma área administrativa (`HelpManagerPage.tsx`) que permite que a equipe interna crie, edite e remova tutoriais utilizando formatação HTML e inserção de imagens.

## 2. Componentes e Telas

### `HelpPage.tsx` (Central de Ajuda - Visão do Usuário)
- **Localização:** `src/pages/HelpPage.tsx`
- **Descrição:** Tela principal da Central de Ajuda. Ela carrega as categorias e os artigos vindos da API, além de possuir um componente de busca para filtrar rapidamente os tutoriais pelo título. Também renderiza um fallback de tutoriais em vídeo caso nenhuma busca ou categoria esteja selecionada.
- **Rota:** `/help`

### `HelpArticlePage.tsx` (Leitura de Tutorial)
- **Localização:** `src/pages/HelpArticlePage.tsx`
- **Descrição:** Tela responsável por exibir o conteúdo completo de um artigo. O conteúdo é injetado via `dangerouslySetInnerHTML`, permitindo que formatações complexas e imagens (`<img>`) sejam exibidas corretamente.
- **Rota:** `/help/article/:id`

### `HelpManagerPage.tsx` (Gerenciamento Administrativo)
- **Localização:** `src/pages/HelpManagerPage.tsx`
- **Descrição:** Painel CRUD (Criar, Ler, Atualizar, Deletar) para a equipe interna da plataforma administrar a base de conhecimento. Conta com um modal de edição e um botão nativo para upload de imagens, que utiliza a rota `UploadImagem` para salvar o arquivo no storage e retornar a URL que é injetada no corpo do texto.
- **Rota:** `/admin/help`

## 3. Serviços de API Utilizados (`HelpService.ts`)
A comunicação com o backend é realizada através do `HelpService.ts`, que abstrai as seguintes operações:
- `getCategories()`: Retorna as categorias (ex: Primeiros Passos, Marketing, Chatbot).
- `getArticles(searchTerm, categoryId)`: Busca e filtra os tutoriais.
- `getArticleById(id)`: Retorna os detalhes de um artigo específico.
- `createArticle`, `updateArticle`, `deleteArticle`: Métodos CRUD administrativos.
- `uploadImage(file: File)`: Utiliza `FormData` para enviar a imagem ao backend (usando a mesma estratégia dos anexos de contatos), retornando a URL da imagem hospedada no Storage (ex: S3) para exibição.

## 4. Regras de Negócio e Comportamento
- O upload de imagens (`POST /api/Help/UploadImagem`) deve suportar envio multipart (`FormData`) assim como os anexos de contato da plataforma.
- A exclusão de um artigo invoca um modal padrão de confirmação (`ConfirmationModal.tsx`) antes da remoção definitiva.
- Se o backend falhar ao buscar as categorias, um conjunto de categorias mockadas é carregado por fallback.

## 5. Permissões
- A página `/help` e `/help/article/:id` são acessíveis por todos os usuários autenticados.
- O acesso ao `/admin/help` (visível na `Sidebar`) deve, idealmente, ser restrito a usuários com perfil administrativo ou suporte técnico (o frontend atualmente exibe para usuários com base no menu, mas o backend deve validar tokens).
