# Diretrizes de Desenvolvimento e Design System - LemeAI Platform

Este documento serve como guia de referência técnica obrigatório para inteligências artificiais (e desenvolvedores) ao criar ou modificar qualquer componente, formulário, página ou layout na plataforma LemeAI.

---

## 1. Diretrizes de CSS e Estilização

### ❌ O que NÃO fazer:
1. **Proibido usar Tailwind CSS**: O projeto utiliza CSS Vanilla puro. Não use classes do Tailwind, a menos que solicitado de forma explícita com a versão exata.
2. **Proibido usar Estilos Inline**: Não use `style={{...}}` para estruturas, layouts ou componentes reutilizáveis. O uso de `style` inline é tolerado exclusivamente para manipulações de propriedades dinâmicas e de estado pontuais (ex: `opacity` ou `cursor: not-allowed` baseados em uma prop `disabled`).
3. **Proibido usar Cores em Hexadecimal no código**: Cores de texto, fundo, bordas ou estados não devem ser hardcoded (ex: `#10b981`, `#00275e`). Use sempre as variáveis CSS semânticas listadas abaixo.

###  O que fazer:
1. **Criar arquivos CSS externos por componente**: Para cada componente `.tsx`, crie um arquivo `.css` homônimo no mesmo diretório (ex: `MyComponent.tsx` e `MyComponent.css`) e faça a importação direta no arquivo TypeScript: `import './MyComponent.css';`.
2. **Utilizar as Variáveis CSS Globais**: Use as variáveis definidas em `:root` em [index.css](file:///c:/git/lemeai.platform/lemeai-platform/src/index.css):

| Escopo | Variável | Valor (Light) | Valor (Dark) | Descrição / Uso |
|---|---|---|---|---|
| **Fundo** | `var(--bg-primary)` | `#f8fafc` | `#09090b` | Fundo principal da página/tela |
| | `var(--bg-secondary)` | `#ffffff` | `#1e2128` | Cards, modais, painéis e elementos flutuantes |
| | `var(--bg-tertiary)` | `#f1f5f9` | `#2a2e38` | Inputs, abas inativas, backgrounds em hover |
| **Texto** | `var(--text-primary)` | `#0f172a` | `#ffffff` | Títulos e textos principais |
| | `var(--text-secondary)` | `#475569` | `#94a3b8` | Labels, subtextos, descrições secundárias |
| | `var(--text-tertiary)` | `#94a3b8` | `#64748b` | Placeholders, datas, informações de menor prioridade |
| **Bordas** | `var(--border-color)` | `#e2e8f0` | `#334155` | Bordas padrão de inputs, cards e divisórias |
| | `var(--border-color-soft)`| `#f1f5f9` | `#1e293b` | Divisórias e linhas sutis dentro de elementos |
| **Marca** | `var(--petroleum-blue)` | `#00275e` | `#3b82f6` | Azul petróleo oficial - botões primários / CTAs |
| | `var(--cyan-accent)` | `#00f0ff` | `#00f0ff` | Ciano ativo - indicadores de destaque e item selecionado |

### Cores Semânticas de Estado:
Utilize estas variáveis para elementos de status, mensagens de erro, alertas ou cores contextuais de dados. O padrão é usar `--color-X` para textos ou bordas e `--color-X-bg` para fundos.

* **Sucesso (Concluído, Ativo, Ganho, Meta Batida):**
  * Texto: `var(--color-success)` (ex: `#059669`)
  * Fundo/Badge: `var(--color-success-bg)` (`rgba(5, 150, 105, 0.12)`)
  * Borda: `var(--color-success-border)` (`rgba(5, 150, 105, 0.25)`)
* **Aviso (Pendente, Em Negociação, Morno):**
  * Texto: `var(--color-warning)` (ex: `#d97706`)
  * Fundo/Badge: `var(--color-warning-bg)` (`rgba(217, 119, 6, 0.12)`)
  * Borda: `var(--color-warning-border)` (`rgba(217, 119, 6, 0.25)`)
* **Perigo (Cancelado, Erro, Exclusão, Quente/Urgente):**
  * Texto: `var(--color-danger)` (ex: `#ef4444`)
  * Fundo/Badge: `var(--color-danger-bg)` (`rgba(239, 68, 68, 0.12)`)
  * Borda: `var(--color-danger-border)` (`rgba(239, 68, 68, 0.25)`)
* **Informação (Novo, Informativo, Frio):**
  * Texto: `var(--color-info)` (ex: `#2563eb`)
  * Fundo/Badge: `var(--color-info-bg)` (`rgba(37, 99, 235, 0.12)`)
  * Borda: `var(--color-info-border)` (`rgba(37, 99, 235, 0.25)`)
* **Neutro (Inativo, Não Classificado):**
  * Texto: `var(--color-neutral)` (ex: `#64748b`)
  * Fundo/Badge: `var(--color-neutral-bg)` (`rgba(100, 116, 139, 0.12)`)
* **IA (Inteligência Artificial):**
  * Texto: `var(--color-ai)` (ex: `#8b5cf6`)
  * Fundo/Badge: `var(--color-ai-bg)` (`rgba(139, 92, 246, 0.12)`)

---

## 2. Inventário de Componentes Reutilizáveis (Uso Obrigatório)

NUNCA recrie componentes visuais do zero. Sempre verifique se o comportamento e estilo que você precisa estão cobertos por um dos seguintes arquivos:

### 2.1. Seleção de Opções (Selects)
* **❌ NUNCA utilize a tag HTML `<select>` nativa.** Ela não segue o padrão estético da plataforma.
* **Seletor Simples Customizado**: Use **[CustomSelect.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/CustomSelect.tsx)**.
  ```tsx
  import CustomSelect from './components/CustomSelect';

  const options = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' }
  ];

  <CustomSelect
    options={options}
    value={status}
    onChange={(val) => setStatus(val)}
    placeholder="Selecione o status..."
    disabled={isLoading}
  />
  ```
* **Seletor de Clientes com Busca Integrada**: Use **[SearchableContactSelect.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/SearchableContactSelect.tsx)**. Ele se conecta à API de contatos e possui modal de criação integrada.
  ```tsx
  import SearchableContactSelect from './components/SearchableContactSelect';

  <SearchableContactSelect
    value={selectedContactId}
    onChange={(contactId) => setSelectedContactId(contactId)}
    placeholder="Selecione ou busque um cliente..."
  />
  ```

### 2.2. Calendários e Datas
* **❌ NUNCA utilize `<input type="date">` nativo.** O estilo nativo do navegador é incompatível com a plataforma.
* **Seleção de Período (Range)**: Use **[DateRangeFilter.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/DateRangeFilter.tsx)**. Ele utiliza `react-datepicker` localizado para `pt-BR` e opcionalmente exibe atalhos rápidos (presets de 7, 15, 30 dias).
  ```tsx
  import DateRangeFilter from './components/DateRangeFilter';

  <DateRangeFilter
    startDate={startDate}
    endDate={endDate}
    onChangeStartDate={(date) => setStartDate(date)}
    onChangeEndDate={(date) => setEndDate(date)}
    hidePresets={false}
  />
  ```
* **Seleção Específica de Mês**: Use **[MonthPicker.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/MonthPicker.tsx)**.
  ```tsx
  import MonthPicker from './components/MonthPicker';

  <MonthPicker
    selectedMonth={currentMonth} // Objeto Date contendo o mês ativo
    onChange={(date) => setCurrentMonth(date)}
  />
  ```

### 2.3. Layout e Estrutura de Listagem
* **Página Padrão**: Toda página dentro da plataforma deve usar a seguinte árvore HTML para garantir espaçamento e comportamento responsivo corretos:
  ```tsx
  <div className="page-container">
      <div className="page-header">
          <h1>Título da Página</h1>
          <button className="add-button" onClick={handleCreate}>
              Adicionar Novo Item
          </button>
      </div>
      {/* Conteúdo principal (tabelas, cards, filtros) */}
  </div>
  ```
* **Paginação de Dados**: Use **[Pagination.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/Pagination.tsx)** para listas e tabelas que possuam dados limitados por página.
  ```tsx
  import Pagination from './components/Pagination';

  <Pagination
    currentPage={page}
    totalPages={totalPages}
    onPageChange={(newPage) => setPage(newPage)}
  />
  ```
* **Métricas e KPIs**: Use **[KPICard.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/KPICard.tsx)** para compor cards no topo de dashboards.
  ```tsx
  import KPICard from './components/KPICard';

  <KPICard
    title="Oportunidades Ganhas"
    value={stats.ganhasCount}
    trend="+12% em relação ao mês anterior" // Opcional
    isLoading={isLoading}
  />
  ```

---

## 3. Padrões de Componentes de Tabela e Listagens (Ações de Linha)

Sempre que renderizar ações dentro de uma linha de tabela (ex: editar, deletar, gerenciar usuários), utilize as seguintes classes CSS globais fornecidas por `index.css`:

### 3.1. Botão de Ação com Texto (`.action-button`)
```html
<button className="action-button edit" onClick={() => handleEdit(item)}>Editar</button>
<button className="action-button delete" onClick={() => handleDelete(item)}>Excluir</button>
```

### 3.2. Botão de Ação apenas com Ícone (`.action-icon-btn`)
Útil para tabelas densas, usando ícones de bibliotecas como `react-icons/fa`.
```tsx
import { FaEdit, FaTrash, FaUsers } from 'react-icons/fa';

<button className="action-icon-btn edit" onClick={() => handleEdit(item)}>
    <FaEdit />
</button>
<button className="action-icon-btn delete" onClick={() => handleDelete(item)}>
    <FaTrash />
</button>
<button className="action-icon-btn users" onClick={() => handleManageUsers(item)}>
    <FaUsers />
</button>
```

---

## 4. Sistema de Badges de Estado (Indicadores Visuais)

Use a classe base `.badge` juntamente com a classe de variação de estado para exibir status de itens ou origens na plataforma:

```html
<!-- Estados de Transações ou Operações -->
<span className="badge badge-success">Concluído</span>
<span className="badge badge-warning">Pendente</span>
<span className="badge badge-danger">Perdido</span>
<span className="badge badge-info">Novo</span>
<span className="badge badge-neutral">Inativo</span>
<span className="badge badge-ai">Gerado por IA</span>

<!-- Origens (Redes Sociais / Fontes) -->
<span className="badge badge-origin-whatsapp">WhatsApp</span>
<span className="badge badge-origin-instagram">Instagram</span>
<span className="badge badge-origin-messenger">Messenger</span>
<span className="badge badge-origin-leadads">Lead Ads</span>
<span className="badge badge-origin-manual">Manual</span>
```

---

## 5. Práticas Gerais e Verificações Obrigatórias

Sempre que a IA finalizar um código, certifique-se de:
1. **Conformidade de HTML**: Todo formulário deve ter elementos semânticos e rótulos (`<label>`).
2. **Tipagem Strict do TS**: Não usar `any`. Tipar corretamente os callbacks de mudança (ex: `onChange: (value: string) => void`).
3. **Internacionalização**: Todas as datas e termos voltados para o usuário final devem seguir a localidade `pt-BR`.
4. **Verificação de Importação**: Garantir que caminhos de importação usem a extensão correta e respeitem as localizações das pastas (`src/components/`, `src/services/`, etc.).
5. **Padronização de Ícones**: Utilize EXCLUSIVAMENTE a biblioteca `react-icons/fa` (FontAwesome). Evite importar de outras famílias (`md`, `fi`, etc.) para não inchar o bundle e manter consistência visual.
6. **Responsividade (Mobile-First)**: Sempre que criar listas, grids ou layouts flexíveis, considere o uso em telas menores. Use `flex-wrap: wrap` e media queries (`@media (max-width: 768px)`) no CSS Vanilla para adaptar a interface.
7. **Documentação e Manutenção do Conhecimento (OBRIGATÓRIO)**:
   - **Ler a Base de Conhecimento Antes de Agir**: Ao atuar em uma página ou feature existente, a IA DEVE sempre ler primeiro o respectivo documento em `docs/spec_features/[NomeDaPagina].md` para entender as regras de negócios, escopo técnico e interdependências. Esta é a fundação para qualquer alteração.
   - **Atualização Contínua**: Sempre que você alterar ou atualizar uma feature existente, a documentação correspondente em `docs/spec_features/` DEVE ser atualizada refletindo as mudanças.
   - **Criação de Nova Documentação**: Sempre que criar algo novo (uma nova tela ou funcionalidade), crie um NOVO arquivo Markdown em `docs/spec_features/` com o escopo técnico e de negócios da feature recém-criada.
   - **Mapeamento de Endpoints**: Se a nova implementação introduzir, alterar ou consumir um endpoint novo do backend, você DEVE atualizar obrigatoriamente o arquivo [endpoints-paginas.md](file:///c:/git/lemeai.platform/lemeai-platform/docs/endpoints-paginas.md), registrando a finalidade do endpoint e a(s) página(s) correspondente(s) do frontend que o utilizam.

---

## 6. Padrões de Integração, Estado e Experiência do Usuário (UX)

### 6.1 Integração com Backend e APIs
1. **Uso Obrigatório do `apiFetch`**: NUNCA utilize `fetch()` nativo do navegador ou instale o `axios`. Use sempre a função `apiFetch` (geralmente importada de `../services/api`). Ela já possui os interceptors configurados para injetar o Token JWT e redirecionar o usuário em caso de sessão expirada (Erro 401).
2. **Padrão de Resposta do Backend**: Lembre-se que as chamadas ao backend geralmente retornam o objeto no padrão `{ sucesso: boolean, dados: any, mensagem: string }`. Todo serviço e tela deve checar a flag `.sucesso` para decidir entre o fluxo de sucesso ou de falha.
3. **Blocos Try/Catch**: Toda chamada de API deve estar encapsulada em blocos `try/catch`, atualizando rigorosamente o estado de carregamento (`isLoading`) nos blocos `finally`.

### 6.2 Gerenciamento de Estado e UX
1. **Prevenção de Cliques Duplos**: Durante requisições assíncronas (POST, PUT, DELETE), todos os botões de ação associados devem receber a propriedade `disabled={isLoading}` (ou estado similar).
2. **Feedback Visual Constante (Toasts)**: NUNCA use `alert()`, `console.log()` ou crie modais customizados apenas para exibir mensagens de sucesso/erro. Use obrigatoriamente a biblioteca **`react-hot-toast`** (`toast.success('...')` ou `toast.error('...')`).
3. **Modais de Confirmação e Alertas (USO OBRIGATÓRIO)**:
   - NUNCA utilize padrões nativos do navegador como `window.confirm()` ou `alert()` para solicitar confirmação de exclusão ou alteração importante.
   - O projeto possui o componente padronizado **[ConfirmationModal.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/components/ConfirmationModal.tsx)**. Utilize-o SEMPRE que for necessário perguntar ao usuário: "Tem certeza que deseja fazer isso?".

```tsx
import ConfirmationModal from '../components/ConfirmationModal';

<ConfirmationModal
    isOpen={isConfirmModalOpen}
    onClose={() => setIsConfirmModalOpen(false)}
    onConfirm={handleDeleteConfirmed}
    title="Excluir Registro"
    message="Tem certeza que deseja excluir permanentemente este registro?"
    confirmText="Sim, excluir"
    isConfirming={isDeleting}
/>
```

---

## 7. Regras de Navegação e Menus (Sidebar e Topbar)

Sempre que a estrutura de menus for modificada ou testada, siga estas definições:

### 7.1. Estrutura Padrão do Menu Lateral
* **Gestão de usuários**: Deve conter as opções `Usuários`, `Perfis` e `Equipes`.
* **Administração**: Deve conter as opções `Metas` e `Campos Personalizados`.
* **Chatbot**: Deve conter as opções `Regras do Chat` e `Produtos`.
* **Empresa**: Deve conter as opções `Gerenciar Empresa`, `Empresas`, `Conexões` e `Gerenciar Planos` (Meu Plano).

### 7.2. Regras de Exibição de Plano (empresaId)
* **Ocultação do menu "Meu Plano" / "Gerenciar Planos"**: O acesso à gestão de planos (rotas `/plano` ou `/gerenciar-planos`) deve ser **obrigatoriamente** ocultado para usuários que pertencem às empresas de ID **4** ou **8**.
* A verificação desta regra deve considerar o campo `empresaId` do objeto do usuário salvo em `localStorage` (ex: `user.empresaId`).
* Essa verificação condicional deve ser mantida na **Sidebar**, na **Top Bar** e no **Drawer Mobile** (MainLayout).

