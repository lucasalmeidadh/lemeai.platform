# Checklist e Diretrizes de Code Review - LemeAI Platform

Este documento serve como **checklist obrigatório** para agentes de IA e desenvolvedores ao realizar Code Review (revisão de código) de qualquer nova implementação, Pull Request ou refatoração na plataforma LemeAI.

O agente revisor deve cruzar o código analisado com os itens abaixo. **Qualquer violação deve resultar em reprovação do código**, exigindo a devida adequação aos padrões descritos no documento `IA-instructions.md`.

---

## 1. CSS, Estilização e Design System

- [ ] **Sem Tailwind CSS**: O código utiliza classes do Tailwind? *(Deve ser reprovado. O projeto usa CSS Vanilla).*
- [ ] **Sem Estilos Inline de Layout**: Há uso de `style={{...}}` para estruturas ou espaçamentos? *(Só é tolerado para propriedades dinâmicas pontuais, como `opacity` ou `cursor` baseados em estado).*
- [ ] **Sem Cores Hardcoded**: Foram utilizados hexadecimais no CSS/TSX? *(Cores devem obrigatoriamente usar as variáveis de `index.css`, ex: `var(--bg-primary)`, `var(--color-success)`).*
- [ ] **Arquivos CSS Dedicados**: O componente possui seu arquivo `.css` homônimo (ex: `MyComponent.css`) e importado corretamente no `.tsx`?
- [ ] **Responsividade**: As telas e grids foram pensados de forma responsiva (uso de `flex-wrap: wrap` e `@media (max-width: 768px)`)?

## 2. Uso de Componentes Reutilizáveis (Proibido Recriar)

- [ ] **Selects**: Utilizou a tag nativa `<select>`? *(Reprovar e exigir `CustomSelect` ou `SearchableContactSelect`).*
- [ ] **Inputs de Data**: Utilizou `<input type="date">`? *(Reprovar e exigir `DateRangeFilter` ou `MonthPicker`).*
- [ ] **Layout Base**: A página respeita a estrutura base com `<div className="page-container">` e `<div className=b"page-header">`?
- [ ] **Ícones**: Foram usados ícones fora da biblioteca `react-icons/fa`? *(Apenas FontAwesome `fa` é permitido).*
- [ ] **Ações de Tabela**: Botões de ação em listas usam as classes globais `.action-button` ou `.action-icon-btn`?
- [ ] **Badges de Status**: Os indicadores de status usam as classes de base `.badge` e suas variações (ex: `.badge-success`, `.badge-warning`)?

## 3. Integração de API, UX e Estado

- [ ] **Uso Exclusivo do `apiFetch`**: Foram usados `fetch` nativo ou `axios`? *(Reprovar. Obrigatório usar `apiFetch` de `services/api` para garantir interceptors de JWT).*
- [ ] **Validação do Retorno**: O código verifica a flag `sucesso` da resposta do backend (`{ sucesso, dados, mensagem }`) antes de seguir com o fluxo positivo?
- [ ] **Tratamento de Erros e Loading**: A chamada de API está encapsulada em um `try/catch` com o estado de `isLoading` sendo desligado no `finally`?
- [ ] **Prevenção de Duplo Clique**: Os botões de envio/ação possuem `disabled={isLoading}` (ou equivalente) durante requisições?
- [ ] **Feedback de Ações (Toasts)**: Há uso de `alert()` ou `console.log()` para mostrar mensagens ao usuário? *(Reprovar e exigir `react-hot-toast`).*
- [ ] **Modais de Confirmação**: O código usa `window.confirm()`? *(Reprovar e exigir o uso do componente padrão `ConfirmationModal.tsx`).*

## 4. Boas Práticas de TypeScript e HTML

- [ ] **Tipagem Strict**: O código introduziu o tipo `any`? *(Reprovar. As tipagens devem ser explícitas e corretas).*
- [ ] **HTML Semântico e Acessível**: Formulários utilizam `<label>` corretamente mapeados para os inputs?
- [ ] **Localização**: Textos, moedas e datas voltadas para o usuário estão no padrão `pt-BR`?

## 5. Documentação e Especificações (CRÍTICO)

- [ ] **Atualização de Spec Features**: O arquivo correspondente em `docs/spec_features/[NomeDaPagina].md` foi criado ou atualizado refletindo as mudanças de regras de negócio e de interface?
- [ ] **Mapeamento de Endpoints**: Se a implementação envolve um novo endpoint, o arquivo `docs/endpoints-paginas.md` foi atualizado?

---

## Como Executar a Revisão (Prompt para IA):

Se você for o Agente de IA realizando a revisão deste código, aja da seguinte forma:
0. **Análise de problemas**: Verifique se houve algum problema no código e corrija, como por exemplo os "Problems" que aparecem no VsCode
1. **Analise o Diff**: Verifique todas as adições e edições de código em relação a este checklist.
2. **Apontamento de Violações**: Para cada regra violada, liste o nome do arquivo, a linha (se aplicável), qual regra do `IA-instructions.md` foi quebrada e apresente o trecho de código corrigido usando os componentes/padrões da LemeAI.
3. **Decisão Final**: 
   - Se houver violações, responda com `STATUS: REPROVADO` e a lista de exigências.
   - Se tudo estiver perfeito e a documentação estiver atualizada, responda com `STATUS: APROVADO`.
