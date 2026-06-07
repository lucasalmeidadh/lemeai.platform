# Diretrizes para Agentes de IA - LemeAI Platform

Este arquivo contém instruções de desenvolvimento específicas da plataforma LemeAI. Qualquer agente de inteligência artificial (Antigravity, Claude, Copilot, Cursor) deve seguir rigorosamente as regras abaixo ao propor mudanças no código do projeto.

---

## 1. Padrões de Design e CSS

### ❌ O que NÃO fazer:
- **Não usar Tailwind CSS** (a menos que explicitamente solicitado pelo usuário com a versão exata).
- **Não usar estilos inline** (`style={{...}}`) para layouts principais ou componentes reutilizáveis.
- **Não usar cores em hexadecimal diretamente no código** (ex: `#10b981`, `#059669`). Sempre utilize as variáveis semânticas CSS do projeto.
- **Não usar componentes nativos de data do navegador** (`<input type="date">`).

###  O que fazer:
- Usar **CSS Vanilla** em arquivos externos.
- Criar sempre um arquivo `.css` específico para o componente ao lado do arquivo `.tsx`. Exemplo:
  - Componente: [MyComponent.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/MyComponent.tsx)
  - Estilos: [MyComponent.css](file:///c:/git/lemeai.platform/lemeai-platform/src/components/MyComponent.css)
- Usar variáveis CSS globais definidas no `:root` em [index.css](file:///c:/git/lemeai.platform/lemeai-platform/src/index.css):

| Tipo | Variável | Descrição / Uso |
|---|---|---|
| **Fundo** | `var(--bg-primary)` | Fundo da página principal |
| | `var(--bg-secondary)` | Fundo de cards, modais, painéis |
| | `var(--bg-tertiary)` | Inputs, abas, background de hover |
| **Texto** | `var(--text-primary)` | Títulos e textos principais |
| | `var(--text-secondary)` | Labels, subtextos |
| | `var(--text-tertiary)` | Placeholders, datas, textos secundários |
| **Bordas** | `var(--border-color)` | Bordas padrão |
| | `var(--border-color-soft)` | Divisórias e linhas sutis |
| **Destaque** | `var(--petroleum-blue)` | Cor primária da marca / CTAs principais |
| | `var(--cyan-accent)` | Indicador de item ativo na barra lateral |

### Cores Semânticas de Estado:
- **Sucesso (Ganho, Ativo):** `var(--color-success)` (texto) / `var(--color-success-bg)` (fundo)
- **Aviso (Pendente, Negociação):** `var(--color-warning)` (texto) / `var(--color-warning-bg)` (fundo)
- **Perigo (Erro, Perdido, Quente):** `var(--color-danger)` (texto) / `var(--color-danger-bg)` (fundo)
- **Informação (Frio, Novo):** `var(--color-info)` (texto) / `var(--color-info-bg)` (fundo)
- **Neutro:** `var(--color-neutral)` (texto) / `var(--color-neutral-bg)` (fundo)
- **IA (Inteligência Artificial):** `var(--color-ai)` (texto) / `var(--color-ai-bg)` (fundo)

---

## 2. Inventário de Componentes Reutilizáveis

Antes de criar um elemento visual do zero, verifique e utilize os componentes que já estão prontos na plataforma:

### Calendários e Seleção de Datas
- Para filtros de período de datas: **[DateRangeFilter.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/DateRangeFilter.tsx)**.
  - Ele utiliza `react-datepicker` pré-configurado com a localidade `pt-BR`.
- Para seleção específica de mês: **[MonthPicker.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/MonthPicker.tsx)**.

### Inputs e Dropdowns
- Para seletores estilizados com busca ou renderização customizada: **[CustomSelect.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/CustomSelect.tsx)**.
- Para seleção de contatos cadastrados: **[SearchableContactSelect.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/SearchableContactSelect.tsx)**.

### Layout e Componentes de Controle
- Paginação de tabelas/listas: **[Pagination.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/Pagination.tsx)**.
- Cards de Métricas: **[KPICard.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/KPICard.tsx)**.

---

## 3. Diretriz Global de Idioma

- **Planejamento, Resumos e Interações no Chat:** Devem ser feitos obrigatoriamente em **Português (PT-BR)**.
- **Códigos e Comentários:** O código (variáveis, funções, componentes) deve ser escrito em inglês, mas comentários explicativos ou documentações locais devem seguir a preferência da equipe (preferencialmente PT-BR para documentações e inglês para código de produção).
