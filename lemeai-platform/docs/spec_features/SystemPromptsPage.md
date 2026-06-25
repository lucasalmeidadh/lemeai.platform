# Regras da IA (SystemPromptsPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **SystemPromptsPage** permite que a empresa configure o comportamento e o tom de voz da Inteligência Artificial do CRM (o Agente LLM). É aqui que o lojista define se o bot deve atuar como vendedor, suporte, ou assistente de agendamento, além de instruir regras estritas (ex: "Não dar descontos", "Sempre pedir email").

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/SystemPromptsPage.tsx`
- **Rotas:** `/configuracao-ia`
- **Estrutura Wizard (3 Passos em 1 tela):**
  - **1. Personalidade (Header):** O grande System Prompt inicial que define a persona (`descricaoCabecalho`).
  - **2. Regras de Conduta (Rules):** Uma tabela de regras pontuais adicionais (`regras`). Permite CRUD local (adicionar, editar, deletar da lista na memória) ou persistido na API.
  - **3. Finalização (Footer):** O Prompt final de formatação (`descricaoRodape`), usado geralmente para forçar tamanhos de texto ou retornos estruturados.
- **Toggle Global (Botão "Bot de IA"):** Controla o status Mestre (`botAtivo`). Desligar aqui derruba a IA para toda a empresa, repassando todo atendimento aos humanos.

## 3. Componentes e Estrutura
- **Layout Dividido (Split View):**
  - Esquerda: O Wizard de configuração (`wizard-stepper`).
  - Direita: Um chat de simulação (`<TestAgentChat />`) que permite ao usuário conversar com a IA aplicando as regras imediatamente antes de salvar em produção.
- **Modal de Sugestões:** Provê botões rápidos para preencher prompts comuns (ex: Consultor de Vendas, Evitar Concorrentes) ajudando usuários menos técnicos (Engenharia de Prompt visual).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `RegrasIAService` (`getConfigAgente`, `createConfigAgente`, `updateConfigAgente`, `deleteConfigAgente`, `toggleBot`, `create`/`update`/`delete` para regras individuais).
- Essa tela configura a fundação de como o bot vai interagir no `/api/Chat` e, consequentemente, afeta todas as conversas da `ChatPage`.
