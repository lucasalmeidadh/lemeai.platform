# Novidades (Release Notes)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **NovidadesPage** funciona como o "Changelog" oficial e público do sistema LemeAI. O objetivo de negócio é manter os clientes atualizados sobre os novos recursos liberados, melhorias de usabilidade e correções de bugs em ordem cronológica (linha do tempo). Isso demonstra constante evolução da ferramenta para o cliente final, aumentando a percepção de valor.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/NovidadesPage.tsx`
- **Rotas:** `/novidades`
- **Gestão de Estado e Filtragem:**
  - Controla o estado `activeFilter` que pode assumir os valores literais do tipo `FilterType`: `'todos' | 'recurso' | 'melhoria' | 'correcao'`.
  - Os botões de pílula (pill buttons) alteram este estado, gerando a re-renderização do array `filteredNovidades` derivado nativamente através de um `.filter()` iterativo sobre a massa de dados estática global (`novidadesData`).
- **Navegação (History):** Utiliza o hook `useNavigate` do React Router DOM para a função "Voltar" (`navigate(-1)`), permitindo que o usuário retorne à aba anterior independente da onde ele tenha vindo.

## 3. Componentes e Estrutura
- **CSS:** Arquivo local `NovidadesPage.css`.
- Renderiza uma estrutura de *Timeline* simplificada (`.novidades-timeline`) em lista de cartões empilhados verticalmente.
- O dado cru que preenche a página é importado localmente de um mock file: `import { novidadesData } from '../data/novidadesMock'`. O que indica que essas informações ainda não vêm de forma dinâmica de uma API/Banco de Dados central do back-office administrativo da GBCode, mas estão hardcoded no Front-end (para futuras atualizações/refatoração para um endpoint dinâmico).
- Utiliza a tag CSS especial indicativa por categoria (`.tag-recurso`, `.tag-melhoria`) para colorizar o selo automaticamente.

## 4. Interdependências (Relacionamentos)
- Depende diretamente do array definido em `src/data/novidadesMock.ts`.
- Geralmente é linkada através de um ícone de "Sino" ou "Mão" no componente Topbar global do sistema.
