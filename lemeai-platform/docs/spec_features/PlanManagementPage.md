# Gerenciamento de Planos (PlanManagementPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **PlanManagementPage** é uma interface de Administração Master (Master Admin) que permite gerenciar os pacotes de assinatura oferecidos pela plataforma (ex: Basic, Pro, Enterprise).
Ela reflete diretamente o portfólio de produtos de software que a LemeAI comercializa, sendo usada para ajustar descrições, preços e a periodicidade das cobranças que são mostradas para o usuário final na tela de `BillingPlanPage`.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/PlanManagementPage.tsx`
- **Rotas:** `/configuracao/planos-master`
- **Sincronização com Gateway (AbacatePay):** Ao criar um plano novo, o backend automaticamente o registra no Gateway de Pagamento, criando um "Produto" lá, o que retorna o `abacateProductId` visualizado na tabela. A edição de um plano *não* atualiza o preço no gateway (apenas a exibição local), exigindo que se crie um plano novo em caso de reajustes.
- **Campos Controlados:** 
  - Nome, Descrição (texto corrido ou separado por vírgula para virar bullets), Preço, Ciclo (Weekly, Monthly, Quarterly, Semiannually, Annually) e Ativo.

## 3. Componentes e Estrutura
- **Tabela de Listagem:** Exibe colunas ricas com o ID do AbacatePay em tag `<code>` e status (Ativo/Inativo) usando badges.
- **Modal de Formulário:** Modal adaptativo.
  - Se for Criação: O seletor de "Ciclo de Cobrança" é liberado.
  - Se for Edição: O ciclo é travado e surge o toggle "Plano Ativo no Sistema". A UI apresenta avisos (`plan-form-hint`) educando o operador sobre as regras de sincronização da AbacatePay.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `billingService` (`buscarTodosPlanos`, `criarPlano`, `atualizarPlano`, `removerPlano`).
- Essa tela é a única fonte de verdade de onde a `BillingPlanPage` extrai a lista de opções de Upgrade que o cliente vê (filtrando apenas os planos `Ativo === true`).
