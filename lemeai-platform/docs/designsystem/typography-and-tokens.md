# Design System — Tipografia, Botões e Tokens

> Fonte da verdade para tamanhos, espaçamentos e padrões visuais da plataforma.  
> Todas as variáveis estão definidas em `src/index.css` dentro do bloco `:root`.

---

## Escala de Tipografia

Todas as fontes usam `rem`, que escala automaticamente com o tamanho de tela via:

```css
:root {
  font-size: clamp(13px, 1vw, 16px);
}
```

Isso significa que em monitores grandes (≥ 1600px) a base é **16px**, e em laptops menores (≤ 1300px) cai suavemente para **13px** — sem quebrar o layout.

### Variáveis

| Variável       | Valor rem   | Valor base (16px) | Quando usar                                      |
|----------------|-------------|-------------------|--------------------------------------------------|
| `--font-xs`    | 0.6875rem   | 11px              | Badges, timestamps, meta labels                  |
| `--font-sm`    | 0.8125rem   | 13px              | Captions, labels secundários, helper text        |
| `--font-base`  | 0.875rem    | **14px** ← padrão | Texto de corpo, células de tabela, inputs        |
| `--font-md`    | 1rem        | 16px              | Texto enfatizado, body em destaque               |
| `--font-lg`    | 1.125rem    | 18px              | Subtítulos, nomes de contato, card headings      |
| `--font-xl`    | 1.25rem     | 20px              | Cabeçalhos de seção, títulos de modal            |
| `--font-2xl`   | 1.5rem      | 24px              | Títulos de painel, nomes de deal                 |
| `--font-3xl`   | 1.75rem     | 28px              | **Título de página (h1)**                        |
| `--font-4xl`   | 2rem        | 32px              | Hero text, onboarding headings                   |

### Exemplos de uso

```css
/* título de página */
.page-header h1 {
  font-size: var(--font-3xl);
  font-weight: 700;
}

/* nome de contato no chat */
.header-contact-name {
  font-size: var(--font-lg);
  font-weight: 600;
}

/* label de campo de formulário */
.form-group label {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-secondary);
}

/* badge de status */
.lead-badge {
  font-size: var(--font-xs);
  font-weight: 600;
  text-transform: uppercase;
}
```

---

## Sistema de Botões

Três tamanhos definidos para cobrir todos os contextos da plataforma:

| Tamanho | Font               | Padding              | Border Radius         | Quando usar                        |
|---------|--------------------|----------------------|-----------------------|------------------------------------|
| `sm`    | `--btn-font-sm` (13px) | `--btn-pad-sm` (6px 12px) | `--btn-radius-sm` (6px) | Ações inline, table actions, chips |
| `md`    | `--btn-font-md` (14px) | `--btn-pad-md` (8px 16px) | `--btn-radius-md` (8px) | **Botão padrão** da plataforma     |
| `lg`    | `--btn-font-lg` (16px) | `--btn-pad-lg` (10px 18px) | `--btn-radius-lg` (10px) | CTA principal (Adicionar, Salvar)   |

### Variáveis de botão

```css
/* Fonte */
--btn-font-sm:    var(--font-sm);    /* 13px */
--btn-font-md:    var(--font-base);  /* 14px */
--btn-font-lg:    var(--font-md);    /* 16px */

/* Padding */
--btn-pad-sm:     0.375rem 0.75rem;
--btn-pad-md:     0.5rem 1rem;
--btn-pad-lg:     0.625rem 1.125rem;

/* Border Radius */
--btn-radius-sm:  0.375rem;   /* 6px */
--btn-radius-md:  0.5rem;     /* 8px */
--btn-radius-lg:  0.625rem;   /* 10px */
```

### Exemplos de uso

```css
/* botão CTA de página */
.add-button {
  padding: var(--btn-pad-lg);
  font-size: var(--btn-font-lg);
  border-radius: var(--btn-radius-md);
  font-weight: 600;
}

/* botão de ação em tabela */
.action-button {
  padding: var(--btn-pad-sm);
  font-size: var(--btn-font-md);
  border-radius: var(--btn-radius-sm);
}
```

---

## Espaçamento

Escala de spacing baseada em múltiplos de 4px. Como usam `rem`, também escalam com o root.

| Variável    | Valor rem  | Valor base |
|-------------|------------|------------|
| `--space-1` | 0.25rem    | 4px        |
| `--space-2` | 0.5rem     | 8px        |
| `--space-3` | 0.75rem    | 12px       |
| `--space-4` | 1rem       | 16px       |
| `--space-5` | 1.25rem    | 20px       |
| `--space-6` | 1.5rem     | 24px       |
| `--space-8` | 2rem       | 32px       |
| `--space-10`| 2.5rem     | 40px       |

---

## Hierarquia de Texto — Referência Rápida

```
Page Title (h1)         → --font-3xl  + weight 700
Section Header (h2/h3)  → --font-xl   + weight 600/700
Card Title              → --font-lg   + weight 600
Body Text               → --font-base + weight 400/500
Secondary Text          → --font-sm   + color: text-secondary
Caption / Meta          → --font-xs   + color: text-tertiary
Badge / Tag             → --font-xs   + weight 600 + uppercase
```

---

## Responsividade

O sistema usa uma única regra no `:root` para escalar toda a plataforma:

```
≥ 1600px  →  16px base  (desktop grande)
1300–1600px  →  escala linear (clamp)
≤ 1300px  →  13px base  (laptop / monitor pequeno)
```

Os media queries `@media (max-height: 850px), (max-width: 1300px)` nos componentes servem como **piso fixo** para ajustes de layout estrutural (heights de topbar, padding de page, etc.) e sobrescrevem com valores em `px` quando necessário.

---

## O que NÃO usar

- ❌ `font-size: 14px` diretamente — use `var(--font-base)`
- ❌ `padding: 10px 18px` em botões — use `var(--btn-pad-lg)`
- ❌ `border-radius: 8px` em botões — use `var(--btn-radius-md)`
- ✅ Valores `px` são permitidos apenas em: bordas (`1px`, `2px`), scrollbars, e overrides dentro de media queries

---

*Atualizado em: 2026-05-31*
