# Design System — Leme AI Platform

> Documento de referência completo. Tudo definido em `src/index.css` (`:root`).  
> Ao criar qualquer componente novo, consulte aqui antes de escrever cores ou tamanhos.

---

## 1. Tipografia

### Escala responsiva

A plataforma usa `font-size: clamp(13px, 1vw, 16px)` no `:root`.  
Isso significa que todo valor em `rem` escala automaticamente com o tamanho da janela:

| Largura de tela | Base |
|-----------------|------|
| ≥ 1600px        | 16px |
| 1300–1600px     | escala linear |
| ≤ 1300px        | 13px |

### Escala de tamanhos

| Variável       | Valor rem  | px (base 16px) | Quando usar                                    |
|----------------|------------|----------------|------------------------------------------------|
| `--font-xs`    | 0.6875rem  | 11px           | Badges, timestamps, meta labels                |
| `--font-sm`    | 0.8125rem  | 13px           | Captions, labels secundários, helper text      |
| `--font-base`  | 0.875rem   | **14px** ← padrão | Corpo, células de tabela, inputs            |
| `--font-md`    | 1rem       | 16px           | Texto enfatizado, modal body                   |
| `--font-lg`    | 1.125rem   | 18px           | Subtítulos, nomes de contato, card headings    |
| `--font-xl`    | 1.25rem    | 20px           | Cabeçalhos de seção, títulos de modal          |
| `--font-2xl`   | 1.5rem     | 24px           | Títulos de painel, nomes de deal               |
| `--font-3xl`   | 1.75rem    | 28px           | **Título de página (h1)**                      |
| `--font-4xl`   | 2rem       | 32px           | Hero, onboarding                               |

### Hierarquia de referência rápida

```
Page Title (h1)        →  --font-3xl  + weight 700
Section Header         →  --font-xl   + weight 600–700
Card / Panel Title     →  --font-lg   + weight 600
Body Text (default)    →  --font-base + weight 400–500
Secondary Text         →  --font-sm   + color: --text-secondary
Caption / Meta         →  --font-xs   + color: --text-tertiary
Badge / Tag / Label    →  --font-xs   + weight 600 + uppercase
```

---

## 2. Cores

### Paleta de interface

| Variável             | Light Mode  | Dark Mode   | Uso                            |
|----------------------|-------------|-------------|--------------------------------|
| `--bg-primary`       | #f8fafc     | #09090b     | Fundo da página                |
| `--bg-secondary`     | #ffffff     | #1e2128     | Cards, modais, painéis         |
| `--bg-tertiary`      | #f1f5f9     | #2a2e38     | Inputs, tabs, hover background |
| `--text-primary`     | #0f172a     | #ffffff     | Texto principal                |
| `--text-secondary`   | #475569     | #94a3b8     | Texto secundário, labels       |
| `--text-tertiary`    | #94a3b8     | #64748b     | Placeholder, meta, datas       |
| `--border-color`     | #e2e8f0     | #334155     | Bordas de cards e inputs       |
| `--border-color-soft`| #f1f5f9     | #1e293b     | Divisórias internas            |
| `--petroleum-blue`   | #00275e     | #3b82f6     | Brand primary, CTAs            |
| `--cyan-accent`      | #00f0ff     | #00f0ff     | Indicador ativo na sidebar     |

### Cores semânticas de estado

Use sempre os tokens abaixo — **nunca hex diretamente** para estados de negócio.

| Token                  | Valor      | Contexto de uso                               |
|------------------------|------------|-----------------------------------------------|
| `--color-success`      | #059669    | Texto de badge success                        |
| `--color-success-bg`   | rgba verde | Fundo de badge success                        |
| `--color-warning`      | #d97706    | Texto de badge warning                        |
| `--color-warning-bg`   | rgba âmbar | Fundo de badge warning                        |
| `--color-danger`       | #ef4444    | Texto de badge danger, ícones de delete       |
| `--color-danger-bg`    | rgba verm. | Fundo de badge danger                         |
| `--color-info`         | #2563eb    | Texto de badge info                           |
| `--color-info-bg`      | rgba azul  | Fundo de badge info                           |
| `--color-neutral`      | #64748b    | Texto de badge neutral                        |
| `--color-neutral-bg`   | rgba cinza | Fundo de badge neutral                        |
| `--color-ai`           | #8b5cf6    | Funcionalidades de IA (summarize, etc.)       |
| `--color-ai-bg`        | rgba roxo  | Fundo de elementos de IA                      |

### Mapeamento semântico por domínio

| Estado de negócio           | Cor semântica    | Classe badge       |
|-----------------------------|------------------|--------------------|
| Lead quente (hot)           | danger / vermelho | `.badge-danger`   |
| Lead morno (warm)           | warning / âmbar   | `.badge-warning`  |
| Lead frio (cold)            | info / azul       | `.badge-info`     |
| Lead novo (new)             | info / azul       | `.badge-info`     |
| Sem classificação           | neutral / cinza   | `.badge-neutral.badge-dashed` |
| Deal concluído / ganho      | success / verde   | `.badge-success`  |
| Deal em negociação          | warning / âmbar   | `.badge-warning`  |
| Deal perdido                | danger / vermelho | `.badge-danger`   |
| Deal novo                   | info / azul       | `.badge-info`     |
| Meta batida / ativo         | success / verde   | `.badge-success`  |
| Meta pendente               | warning / âmbar   | `.badge-warning`  |
| Meta tipo valor (R$)        | success / verde   | `.badge-success`  |
| Meta tipo quantidade        | info / azul       | `.badge-info`     |
| Meta tipo ligações          | warning / âmbar   | `.badge-warning`  |
| Erro / falha                | danger / vermelho | `.badge-danger`   |
| Funcionalidade de IA        | ai / roxo         | `.badge-ai`       |

---

## 3. Botões

Três tamanhos para cobrir todos os contextos:

| Tamanho | Font          | Padding       | Radius       | Quando usar                          |
|---------|---------------|---------------|--------------|--------------------------------------|
| `sm`    | 13px          | 6px 12px      | 6px          | Ações inline, table actions, chips   |
| `md`    | 14px          | 8px 16px      | 8px          | **Botão padrão** da plataforma       |
| `lg`    | 16px          | 10px 18px     | 8px          | CTA principal (Adicionar, Salvar)    |

### Variáveis

```css
--btn-font-sm / --btn-font-md / --btn-font-lg
--btn-pad-sm  / --btn-pad-md  / --btn-pad-lg
--btn-radius-sm / --btn-radius-md / --btn-radius-lg
```

### Variantes visuais

| Variante    | Background        | Texto  | Uso                          |
|-------------|-------------------|--------|------------------------------|
| Primary     | `--petroleum-blue`| white  | Ação principal da página     |
| Secondary   | `--bg-tertiary`   | primary| Ação secundária              |
| Ghost       | transparent       | primary| Ação terciária, cancelar     |
| Danger      | `--color-danger-bg`| danger| Deletar, remover             |
| AI          | `--color-ai-bg`   | ai     | Funcionalidades de IA        |

---

## 4. Badges e Tags

### Uso

Qualquer indicador de estado deve usar a classe `.badge` + variante semântica:

```html
<!-- Em um card de deal -->
<span class="badge badge-danger">Perdido</span>
<span class="badge badge-success">Ganho</span>
<span class="badge badge-warning">Em negociação</span>

<!-- Lead temperature -->
<span class="badge badge-danger">Quente</span>
<span class="badge badge-warning">Morno</span>
<span class="badge badge-info">Frio</span>
<span class="badge badge-neutral badge-dashed">Sem classificação</span>
```

### Anatomia do `.badge`

```css
.badge {
  display: inline-flex;
  padding: 0.125rem 0.5rem;   /* 2px 8px */
  border-radius: 0.75rem;      /* pill shape */
  font-size: var(--font-xs);   /* 11px */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
```

---

## 5. Espaçamento

Escala de 4px. Como usa `rem`, escala junto com o root.

| Variável    | rem        | px (base) | Uso típico                      |
|-------------|------------|-----------|---------------------------------|
| `--space-1` | 0.25rem    | 4px       | gap mínimo, ícone + label       |
| `--space-2` | 0.5rem     | 8px       | gap de elementos inline         |
| `--space-3` | 0.75rem    | 12px      | gap de grupos pequenos          |
| `--space-4` | 1rem       | 16px      | padding de card, gap de seção   |
| `--space-5` | 1.25rem    | 20px      | gap de cards em grid            |
| `--space-6` | 1.5rem     | 24px      | padding interno de modal        |
| `--space-8` | 2rem       | 32px      | margin entre seções             |
| `--space-10`| 2.5rem     | 40px      | padding de página (`main-content`) |

---

## 6. Sombras

```css
--shadow-sm   /* Elevação leve — cards, inputs em foco */
--shadow-md   /* Elevação média — dropdowns, cards hover */
--shadow-lg   /* Elevação alta — modais, tooltips */
```

---

## 7. Responsividade

### Como funciona

1. `font-size: clamp(13px, 1vw, 16px)` no `:root` — escala fluida entre 1300–1600px
2. Todos os valores em `rem` escalam automaticamente
3. Media queries `(max-height: 850px), (max-width: 1300px)` aplicam overrides em `px` como piso fixo

### Breakpoints

| Breakpoint       | Contexto                          |
|------------------|-----------------------------------|
| `max-width: 768px`  | Mobile — sidebar oculta, layout colapsado |
| `max-width: 900px`  | Tablet — nav reduzida, grids em 1 coluna  |
| `max-width: 1300px` | Laptop — compactação de padding e alturas |
| `max-height: 850px` | Monitor baixo — mesma compactação         |

---

## 8. Regras de Ouro

✅ **Usar sempre**
- `var(--font-*)` para qualquer `font-size`
- `var(--color-success/warning/danger/info/neutral)` para estados de negócio
- `var(--btn-pad-*)` e `var(--btn-radius-*)` para botões
- `rem` para padding, margin, gap, width, height de componentes
- `.badge + .badge-*` para qualquer indicador de estado

❌ **Nunca usar**
- Cores hex diretamente em estados (`#10b981`, `#c92a2a`, etc.)
- `font-size` em `px` fora de media queries
- Criar novos shades de verde/vermelho/azul — use os tokens existentes
- `!important` fora de media queries de compactação

---

## 9. Arquivos do sistema

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/index.css` | Tokens, variáveis, classes utilitárias (`.badge`), layout global |
| `src/components/Sidebar.css` | Navegação lateral |
| `src/components/Topbar.css` | Barra superior |
| `src/components/ConversationHeader.css` | Cabeçalho do chat |
| `src/components/DetailsPanel.css` | Painel de detalhes do contato |
| `src/components/UserProfileModal.css` | Modal de perfil |
| `src/pages/ChatDashboard.css` | Dashboard comercial |
| `src/pages/PipelinePage.css` | Kanban de pipeline |
| `src/pages/DealDetailsPage.css` | Detalhes do deal |
| `src/pages/GoalsPage.css` | Metas |

---

## 10. Próximas áreas de evolução

| Área | Status | Prioridade |
|------|--------|------------|
| Tipografia + Responsividade | ✅ Implementado | — |
| Cores semânticas + Badge system | ✅ Implementado | — |
| Cards e superfícies (elevação, border-radius padrão) | 🔜 Pendente | Alta |
| Estados de interação (hover, focus, loading, empty, error) | 🔜 Pendente | Alta |
| Formulários (inputs, selects, textareas padronizados) | 🔜 Pendente | Média |
| Animações e transições (duração, easing padronizados) | 🔜 Pendente | Baixa |

---

*Atualizado em: 2026-05-31*
