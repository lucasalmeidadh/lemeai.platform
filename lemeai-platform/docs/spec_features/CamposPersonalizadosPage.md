# Campos Personalizados (CamposPersonalizadosPage)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A **CamposPersonalizadosPage** permite que cada cliente do CRM expanda o modelo de dados padrão dos Contatos (que geralmente é apenas Nome e Telefone). 
Negocialmente, um despachante pode querer salvar a "Placa do Carro" do cliente, enquanto uma clínica quer salvar a "Data de Nascimento". Essa tela permite criar esses atributos flexíveis que serão exibidos nos painéis de conversas de toda a empresa.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/CamposPersonalizadosPage.tsx`
- **Rotas:** `/configuracao/campos-personalizados`
- **Tipos de Dados:** Suporta os tipos base definidos pelo enum `TipoCampoPersonalizado`: `Texto`, `Numero`, `Data`, `Booleano` (Sim/Não) e `Selecao` (Dropdown List).
- **Metadados:** Controla a propriedade `obrigatorio` (determina se um contato pode ser salvo sem essa informação) e `ordem` (que define a ordem de renderização desse campo na interface do Chat e no formulário de Contatos).

## 3. Componentes e Estrutura
- **Tabela de Listagem:** Exibe os campos cadastrados, com uma conversão visual do Enum para o texto humano usando a constante `tipoLabels`.
- **`CampoPersonalizadoFormModal`:** Coleta o Nome, Tipo, Obrigatoriedade e Ordem. Se o tipo for `Selecao`, a interface se expande para permitir o cadastro dinâmico das "Opções" do dropdown (separadas por um array JSON ou lógica local do componente).
- **`ConfirmationModal`:** Avisa explicitamente o usuário que "remover este campo não apaga os valores já salvos nas conversas", funcionando apenas como um encerramento da coleta desse dado de agora em diante.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `CampoPersonalizadoService` (`buscarTodos`, `criar`, `atualizar`, `remover`).
- **Onde reflete:** 
  - Todo campo criado aqui será renderizado dinamicamente dentro de `ContactsPage.tsx` (na visualização e edição de um Contato) e dentro da `ChatPage.tsx` na barra lateral direita de Informações do Contato Ativo, usando renderização condicional baseada no `tipo`.
