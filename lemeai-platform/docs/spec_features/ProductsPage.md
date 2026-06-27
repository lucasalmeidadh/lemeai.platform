# Produtos e Serviços (Catálogo)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **ProductsPage** atua como o catálogo de itens vendáveis da empresa (SKUs). Negocialmente, cadastrar produtos aqui permite que eles sejam selecionados na aba de Produtos da `DealDetailsPage`, o que gera automaticamente o valor financeiro da oportunidade (`Deal.valor`).

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/ProductsPage.tsx`
- **Rotas:** `/produtos`
- **Categorização Híbrida (Produto vs Serviço):**
  - O banco de dados salva tudo na mesma entidade `Produto`, porém a interface força o usuário a escolher logo na criação qual é a natureza do item usando dois *Cards* iniciais no modal.
  - Se for **Serviço**: Exibe apenas Nome, Preço e Descrição.
  - Se for **Produto**: Exibe adicionalmente Marca, Peso (kg) e Link.
- **Tratamento Monetário:** 
  - Contém a lógica customizada de input monetário `formatCurrencyInput` e `parseCurrencyInput` que obriga o usuário a digitar os centavos convertendo um `Number` em uma string BRL.

## 3. Componentes e Estrutura
- **Tabela Simples:** Listagem paginada (atualmente carregada de uma vez só no frontend) com colunas básicas de identificação.
- **Modal de Criação:** Modal unificado de duas etapas invisíveis: a tela de escolha "Produto ou Serviço" e a tela de formulário, onde os campos são ocultados via React state (`itemType === 'produto'`).
- Código Aleatório gerado pelo front-end (`generateRandomCode()`) como fallback se o usuário não digitar um SKU.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `ProductService` (`getAll`, `create`, `update`, `delete`).
- Quando modificado ou deletado, não afeta retroativamente o histórico das conversas já ganhas no passado, mas afeta a listagem oferecida nas novas oportunidades através de `ConversaProdutoService`.
