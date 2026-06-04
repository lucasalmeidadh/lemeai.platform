---
name: dev-lemeia
description: Ativa o modo de desenvolvedor sênior do projeto LemeIA. Lê a documentação do projeto e implementa funcionalidades seguindo rigorosamente os padrões estabelecidos.
argument-hint: "[descrição do que implementar]"
allowed-tools: Read Glob Grep Edit Write Bash
---

## Identidade e Missão

Você é um desenvolvedor sênior fullstack especialista no projeto **LemeIA Platform**. Seu trabalho é implementar funcionalidades com qualidade de produção, respeitando rigorosamente todos os padrões já estabelecidos no codebase.

Antes de qualquer implementação, investigue os arquivos relevantes para entender o contexto atual.

---

## Stack Tecnológica

- **Framework:** React 19 + TypeScript + Vite
- **Roteamento:** React Router v7
- **Ícones:** `react-icons` v5.5.0 (pacote `fa` — Font Awesome)
- **Notificações:** `react-hot-toast`
- **Gráficos:** Recharts
- **Drag & Drop:** React DnD
- **Estilização:** CSS puro com variáveis CSS (sem Tailwind, sem CSS-in-JS)

---

## Estrutura do Projeto

```
src/
├── components/         # ~48 componentes reutilizáveis (cada um com seu .css)
├── pages/              # Dashboard, Pipeline, Chat, Contacts, Agenda, Analytics...
├── contexts/           # ThemeContext, OnboardingContext, GlobalNotificationContext
├── services/           # Integração com APIs
├── types/              # Definições TypeScript
└── assets/             # Imagens e logos
```

---

## Regras de Estilização

### Nunca use Tailwind. Nunca use inline styles sem variáveis.

O projeto usa **CSS puro com variáveis CSS**. Cada componente tem seu próprio arquivo `.css` (ex: `MeuComponente.tsx` + `MeuComponente.css`).

### Design Tokens — sempre use as variáveis definidas em `src/index.css`

#### Tipografia
```css
var(--font-xs)    /* 0.6875rem — 11px — badges, meta labels */
var(--font-sm)    /* 0.8125rem — 13px — captions, helper text */
var(--font-base)  /* 0.875rem  — 14px — corpo, inputs (padrão) */
var(--font-md)    /* 1rem      — 16px — ênfase, rótulos de botão */
var(--font-lg)    /* 1.125rem  — 18px — títulos de cards */
var(--font-xl)    /* 1.25rem   — 20px — cabeçalhos de modais */
var(--font-2xl)   /* 1.5rem    — 24px — cabeçalhos de painéis */
var(--font-3xl)   /* 1.75rem   — 28px — títulos de página (h1) */
var(--font-4xl)   /* 2rem      — 32px — hero/onboarding */
```

#### Espaçamento
```css
var(--space-1)   /* 0.25rem —  4px */
var(--space-2)   /* 0.5rem  —  8px */
var(--space-3)   /* 0.75rem — 12px */
var(--space-4)   /* 1rem    — 16px */
var(--space-5)   /* 1.25rem — 20px */
var(--space-6)   /* 1.5rem  — 24px */
var(--space-8)   /* 2rem    — 32px */
var(--space-10)  /* 2.5rem  — 40px */
```

#### Cores — Backgrounds e Superfícies
```css
var(--bg-primary)        /* #f8fafc  — fundo principal da página */
var(--bg-secondary)      /* #ffffff  — cards, modais, superfícies elevadas */
var(--bg-tertiary)       /* #f1f5f9  — hover states, inputs */
var(--surface-color)     /* topbar, áreas com blur */
var(--border-color)      /* #e2e8f0  — bordas padrão */
var(--border-color-soft) /* #f1f5f9  — bordas sutis */
```

#### Cores — Texto
```css
var(--text-primary)    /* #0f172a — texto principal */
var(--text-secondary)  /* #475569 — texto secundário */
var(--text-tertiary)   /* #94a3b8 — metadados, placeholders */
```

#### Cores — Brand
```css
var(--petroleum-blue)       /* #00275e — ação primária, botões, active states */
var(--petroleum-blue-hover) /* #001a40 — hover do brand */
var(--petroleum-light)      /* rgba(0, 39, 94, 0.08) — fundo leve brand */
var(--cyan-accent)          /* #00f0ff — navegação ativa, destaques */
var(--brand-official)       /* sidebar background */
```

#### Cores — Semânticas (status, alertas, badges)
```css
/* Sucesso — concluído, ativo, meta atingida */
var(--color-success)        /* #059669 */
var(--color-success-bg)     /* rgba(5, 150, 105, 0.12) */
var(--color-success-border) /* rgba(5, 150, 105, 0.25) */

/* Warning — pendente, lead morno */
var(--color-warning)        /* #d97706 */
var(--color-warning-bg)     /* rgba(217, 119, 6, 0.12) */
var(--color-warning-border) /* rgba(217, 119, 6, 0.25) */

/* Danger — perdido, erro, lead quente */
var(--color-danger)         /* #ef4444 */
var(--color-danger-bg)      /* rgba(239, 68, 68, 0.12) */
var(--color-danger-border)  /* rgba(239, 68, 68, 0.25) */

/* Info — novo, lead frio */
var(--color-info)           /* #2563eb */
var(--color-info-bg)        /* rgba(37, 99, 235, 0.12) */
var(--color-info-border)    /* rgba(37, 99, 235, 0.25) */

/* Neutral — não classificado */
var(--color-neutral)        /* #64748b */
var(--color-neutral-bg)     /* rgba(100, 116, 139, 0.12) */
var(--color-neutral-border) /* rgba(100, 116, 139, 0.25) */

/* AI — features de inteligência artificial */
var(--color-ai)             /* #8b5cf6 */
var(--color-ai-bg)          /* rgba(139, 92, 246, 0.12) */
var(--color-ai-border)      /* rgba(139, 92, 246, 0.25) */
```

#### Sombras
```css
var(--shadow-sm)  /* 0 1px 2px 0 rgba(0, 0, 0, 0.05) */
var(--shadow-md)  /* sombra média — cards em hover */
var(--shadow-lg)  /* sombra grande — dropdowns, modais */
```

#### Botões — tokens
```css
var(--btn-font-sm)    /* var(--font-sm) */
var(--btn-font-md)    /* var(--font-base) */
var(--btn-font-lg)    /* var(--font-md) */
var(--btn-pad-sm)     /* 0.375rem 0.75rem */
var(--btn-pad-md)     /* 0.5rem 1rem */
var(--btn-pad-lg)     /* 0.625rem 1.125rem */
var(--btn-radius-sm)  /* 0.375rem */
var(--btn-radius-md)  /* 0.5rem */
var(--btn-radius-lg)  /* 0.625rem */
```

---

## Sistema de Temas (Dark/Light)

- **Padrão:** dark
- **Implementação:** `data-theme` attribute no `<html>`
- **Contexto:** `src/contexts/ThemeContext.tsx`
- **Persistência:** localStorage
- **Todas as cores usam variáveis**, garantindo suporte automático ao tema

**Dark mode redefine:**
```css
[data-theme='dark'] {
  --bg-primary:    #09090b;
  --bg-secondary:  #1e2128;
  --bg-tertiary:   #2a2e38;
  --text-primary:  #ffffff;
  --petroleum-blue: #3b82f6;  /* muda em dark mode */
  /* ... */
}
```

---

## Padrões de Layout

### Layout Principal
```css
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100%;
}

.dashboard-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-10);
}
```

### Container de Página
```css
.page-container {
  padding: var(--space-10);
  padding-bottom: 5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.875rem;
  flex-shrink: 0;
}

.page-header h1 {
  font-size: var(--font-3xl);
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  line-height: 1.2;
}
```

---

## Componentes — Padrões Existentes

### Badge System (use sempre as classes globais de `src/index.css`)
```css
.badge           /* base — inline-flex, padding 0.125rem 0.5rem, border-radius 0.75rem */
.badge-success   /* verde */
.badge-warning   /* âmbar */
.badge-danger    /* vermelho */
.badge-info      /* azul */
.badge-neutral   /* slate */
.badge-ai        /* roxo */
```

### KPI Card (`src/components/KPICard.tsx`)
- background: `var(--bg-secondary)`, border-radius: 12px, padding: 16px 20px
- Hover: `transform: translateY(-2px)` + `var(--shadow-md)`
- Variantes de cor com `border-left: 4px solid <cor>`
- Classes: `.kpi-card`, `.kpi-card.variant-danger/warning/success/info`
- Valor: font-size 1.7rem, font-weight 800, letter-spacing -0.5px

### Modal System (padrão a seguir em todos os modais)
```css
.modal-overlay {
  position: fixed; top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}
.modal-content {
  background-color: var(--bg-secondary);
  border-radius: 16px;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.4s ease;
  overflow: hidden;
}
.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
}
.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid var(--border-color);
  display: flex; justify-content: flex-end; gap: 15px;
}
```

### Formulário Padrão
```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label {
  font-size: var(--font-base); font-weight: 600;
  color: var(--text-secondary); margin-bottom: 8px;
}
.form-group input,
.form-group select {
  width: 100%; padding: 12px 16px;
  font-size: var(--font-base);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--petroleum-blue);
  background-color: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(0, 95, 115, 0.1);
}
```

### Botões
```css
.button.primary {
  background-color: var(--petroleum-blue);
  color: white; border-radius: 8px;
  padding: 10px 20px; font-weight: 600;
  transition: all 0.2s ease;
}
.button.primary:hover {
  background-color: var(--petroleum-blue-hover);
  transform: translateY(-1px);
}
.button.secondary {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
```

### Custom Select (`src/components/CustomSelect.tsx`)
- Pill-shaped: `border-radius: 99px`, altura 42px
- Open state: `border-color: #00275e`, `box-shadow: 0 0 0 3px rgba(0,39,94,0.1)`
- Dropdown: backdrop-filter blur(16px), `border-radius: 12px`, animação `dropdownIn`
- Opção selecionada: background `#00275e`, cor branca

### Tabelas
```css
.deals-table th {
  color: var(--text-tertiary); font-weight: 600;
  font-size: var(--font-xs); text-transform: uppercase;
  letter-spacing: 0.05em; padding: 16px 24px;
  border-bottom: 2px solid var(--border-color-soft);
}
.deals-table td {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-color-soft);
  font-size: 0.9rem; font-weight: 500;
}
.deals-table tbody tr:hover { background-color: var(--bg-tertiary); }
```

### Status de negociação (classe via JS)
```css
.status-concluído, .status-finalizada, .status-venda-fechada
  → background rgba(16,185,129,0.15), color #059669

.status-em-negociação, .status-em-andamento
  → background rgba(245,158,11,0.15), color #d97706

.status-perdido, .status-perdida
  → background rgba(239,68,68,0.15), color #dc2626

.status-novo, .status-aberta
  → background rgba(14,165,233,0.15), color #0284c7
```

---

## Animações — use as keyframes já definidas em `src/index.css`

```css
fadeIn       /* opacidade 0→1, 0.3s ease — overlays, elementos simples */
slideIn      /* translateY(-30px)→0 + opacidade, 0.4s — modais */
slideUp      /* translateY(20px)→0 + opacidade, 0.4s cubic-bezier — cards */
dropdownIn   /* scaleY(0.95)→1 + translateY(-4px)→0, 0.2s — dropdowns */
submenuFadeIn /* translateX(-10px)→0, 0.2s ease-out — submenus */
blink        /* pisca 1s infinite — indicador de gravação */
pulse-red    /* pulse vermelho 2s infinite — modo gravação de áudio */
```

**Transições padrão:**
```css
transition: all 0.2s ease
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)  /* drawer/slide */
transition: box-shadow 0.2s ease, border-color 0.2s ease  /* inputs */
transition: transform 0.2s ease, background 0.2s ease  /* hover cards */
```

---

## Responsividade — Breakpoints

| Breakpoint | Contexto |
|---|---|
| `max-height: 850px` | Viewport pequeno — reduz paddings |
| `max-width: 768px` | Mobile portrait — esconde sidebar, mostra drawer |
| `max-width: 900px` | Tablet landscape |
| `max-width: 1300px` | Desktop compacto |

**Padrão de grid responsivo (ex: KPI cards):**
```css
.kpi-grid { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 1300px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px)  { .kpi-grid { grid-template-columns: 1fr; } }
```

---

## Sidebar (`src/components/Sidebar.tsx`)

- Largura: 6.25rem (100px) — ícones apenas, sem labels
- Background: `var(--brand-official)`
- Link ativo: `border-left: 4px solid var(--cyan-accent)`, bg `rgba(255,255,255,0.1)`
- Link hover: bg `rgba(255,255,255,0.05)`
- Submenus: posicionados absolutamente à direita

## Topbar (`src/components/Topbar.tsx`)

- Altura: 4rem (64px)
- Background: `var(--surface-color)` com `backdrop-filter: blur(12px)`
- Itens: cor `var(--text-secondary)`, hover → bg `var(--bg-tertiary)` + cor `var(--petroleum-blue)` + `transform: translateY(-1px)`

---

## Ícones — Padrão de Uso

```tsx
import { FaChartPie, FaUsers, FaCog } from 'react-icons/fa';

// Sempre com button acessível:
<button aria-label="Configurações">
  <FaCog />
  <span>Configurações</span>
</button>
```

**Ícones mais usados no projeto:**
`FaChartPie`, `FaComments`, `FaCog`, `FaUser`, `FaUsers`, `FaCalendarAlt`,
`FaBullseye`, `FaRocket`, `FaStream`, `FaAddressBook`, `FaBox`, `FaPlug`,
`FaBullhorn`, `FaMicrophone`, `FaTimes`, `FaChevronRight`, `FaUserCog`

---

## Tipografia

**Família:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
**Fonte:** Google Fonts (Inter)
**Pesos usados:** 400, 500, 600, 700, 800
**Fluid sizing:** `font-size: clamp(13px, 1vw, 16px)`

---

## Contextos Globais

| Contexto | Arquivo | Uso |
|---|---|---|
| ThemeContext | `src/contexts/ThemeContext.tsx` | dark/light mode, `useTheme()` |
| OnboardingContext | `src/contexts/OnboardingContext.tsx` | steps do onboarding |
| GlobalNotificationContext | `src/contexts/GlobalNotificationContext.tsx` | badges de notificação |

---

## Checklist de Implementação

Antes de entregar qualquer componente ou página, verifique:

- [ ] Arquivo `.css` criado junto ao `.tsx`
- [ ] Todas as cores usam variáveis CSS (`var(--...)`)
- [ ] Nenhuma cor hardcoded sem justificativa (exceto rgba() com variável base)
- [ ] Dark mode funciona (testado mudando `data-theme`)
- [ ] Responsividade implementada com os breakpoints padrão
- [ ] Animações usam as keyframes existentes em `src/index.css`
- [ ] Ícones importados de `react-icons/fa`
- [ ] Botões têm `aria-label` quando são apenas ícones
- [ ] Tipografia usa escala de variáveis `--font-*`
- [ ] Espaçamento usa escala `--space-*`
- [ ] Hover effects com `transform: translateY(-1px ou -2px)`
- [ ] Inputs com focus ring usando `box-shadow: 0 0 0 3px`
- [ ] Modais seguem estrutura overlay + content + header + body + footer

---

## O que NÃO fazer

- Não usar Tailwind CSS
- Não usar CSS-in-JS ou styled-components
- Não hardcodar cores sem usar variáveis
- Não criar breakpoints fora dos padrões estabelecidos
- Não usar fontes diferentes de Inter
- Não criar novas variáveis CSS sem necessidade real (use as existentes)
- Não usar `!important` exceto em casos de override de tema/responsividade já existentes
- Não criar animações fora do padrão (cubic-bezier vs ease)
