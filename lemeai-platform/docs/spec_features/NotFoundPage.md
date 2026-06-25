# Not Found (Página 404)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **NotFoundPage** é o *fallback* de segurança para rotas não mapeadas no CRM. Seu propósito de negócios é reter o usuário (evitando que feche a aba ao esbarrar num erro técnico) informando-o amigavelmente que o endereço digitado não existe, e oferecendo um botão de atalho rápido de volta para o *home* da plataforma.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/NotFoundPage.tsx`
- **Rotas:** Rota "catch-all" (`*`) configurada no fim do `main.tsx`.
- Totalmente estática. Não carrega CSS externo e injeta estilos inline básicos via `style={{...}}`. 

## 3. Componentes e Estrutura
- Exibe a ilustração em SVG `undraw_nao_encontrado.svg` centralizada.
- Usa o componente `<Link>` do `react-router-dom` apontando para `/monitoramento`.

## 4. Interdependências (Relacionamentos)
- Sem chamadas a API.
- Captura toda rota inválida interceptada pelo roteador React.
