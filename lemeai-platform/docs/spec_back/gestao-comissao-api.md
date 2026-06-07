# Requisitos de API — Gestão de Comissões (LemeAI)

Este documento define os requisitos de backend e especificações de endpoints para o desenvolvimento da API do módulo de **Gestão de Comissões**.

> Todos os endpoints requerem autenticação via JWT (`Authorization: Bearer <token>`).  
> O `empresaId` deve ser extraído automaticamente do token da requisição.  
> Todos os retornos devem seguir o padrão envelope da plataforma: `{ sucesso: boolean, dados: T, mensagem?: string }`.

---

## 1. Módulo Regras — `/api/comissao/regra`

Gerenciamento das regras comerciais de parametrização de comissão.

### 1.1 Listar Regras
Retorna todas as regras de comissão da empresa.
```http
GET /api/comissao/regra
```
**Response `dados`:**
```json
[
  {
    "id": 1,
    "nome": "Regra Geral de Vendas (5%)",
    "tipoComissao": "percentual",
    "valorPercentual": 5.0,
    "ativo": true,
    "criadoEm": "2026-05-01T10:00:00Z"
  },
  {
    "id": 3,
    "nome": "Bônus Escalonado por Metas",
    "tipoComissao": "escalonado",
    "faixasEscalonadas": [
      { "percentualMetaMinimo": 0, "percentualMetaMaximo": 79, "valorAplicado": 2.0, "tipoValor": "percentual" },
      { "percentualMetaMinimo": 80, "percentualMetaMaximo": 99, "valorAplicado": 4.0, "tipoValor": "percentual" },
      { "percentualMetaMinimo": 100, "percentualMetaMaximo": 999, "valorAplicado": 6.0, "tipoValor": "percentual" }
    ],
    "usuarioId": 5,
    "usuarioNome": "Ana Lima",
    "ativo": true,
    "criadoEm": "2026-05-03T14:00:00Z"
  }
]
```

### 1.2 Criar Regra
```http
POST /api/comissao/regra
```
**Body:**
```json
{
  "nome": "Regra Geral de Vendas (5%)",
  "tipoComissao": "percentual", // "percentual" | "fixo" | "escalonado"
  "valorPercentual": 5.0,
  "valorFixo": 0.0,
  "faixasEscalonadas": [],
  "produtoId": null,
  "usuarioId": null,
  "equipeId": null,
  "ativo": true
}
```

### 1.3 Editar Regra
```http
PUT /api/comissao/regra/{id}
```
**Body:** mesmo schema do POST.

### 1.4 Inativar/Excluir Regra
```http
DELETE /api/comissao/regra/{id}
```

---

## 2. Módulo Extratos — `/api/comissao/extrato`

Registros individuais de comissões vinculadas a vendas no pipeline.

### 2.1 Listar Extratos
Busca extratos detalhados com filtros.
```http
GET /api/comissao/extrato?vendedorId=5&periodo=2026-06&status=pendente
```
*   `vendedorId` (opcional): ID do colaborador.
*   `periodo` (opcional): Formato `YYYY-MM`.
*   `status` (opcional): `pendente` | `em_revisao` | `aprovado` | `rejeitado` | `pago`.

**Response `dados`:**
```json
[
  {
    "id": 102,
    "vendaId": 502,
    "vendedorId": 5,
    "vendedorNome": "Ana Lima",
    "valorVenda": 8000.00,
    "dataVenda": "2026-06-04T10:15:00Z",
    "descricaoVenda": "Cliente Soluções Integradas",
    "regraAplicadaId": 1,
    "regraAplicadaNome": "Regra Geral de Vendas (5%)",
    "valorCalculado": 400.00,
    "status": "pendente",
    "dataCalculo": "2026-06-04T10:20:00Z",
    "atualizadoEm": "2026-06-04T10:20:00Z"
  }
]
```

### 2.2 Alterar Status (Aprovar / Contestar)
Atualiza o status de aprovação de um extrato.
```http
PUT /api/comissao/extrato/{id}/status
```
**Body (Aprovar):**
```json
{
  "status": "aprovado"
}
```
**Body (Contestar / Pedir revisão):**
```json
{
  "status": "em_revisao",
  "motivoRevisao": "Desconto de 10% foi aplicado indevidamente. Revisar base."
}
```

---

## 3. Módulo Pagamentos — `/api/comissao/pagamento`

Fechamento financeiro periódico consolidado por vendedor.

### 3.1 Listar Fechamentos
```http
GET /api/comissao/pagamento?periodo=2026-06
```
**Response `dados`:**
```json
[
  {
    "id": 12,
    "vendedorId": 5,
    "vendedorNome": "Ana Lima",
    "periodo": "2026-06",
    "quantidadeVendas": 2,
    "valorTotalVendas": 20000.00,
    "valorTotalComissao": 650.00,
    "status": "pronto_para_pagamento", // "pronto_para_pagamento" | "pago"
    "comprovanteUrl": null,
    "pagoEm": null,
    "pagoPorNome": null
  }
]
```

### 3.2 Consolidar Período
Agrupa todas as comissões com status `aprovado` daquele mês e gera os relatórios consolidados de pagamento para cada vendedor.
```http
POST /api/comissao/pagamento/consolidar
```
**Body:**
```json
{
  "periodo": "2026-06"
}
```
*   **Regra**: Vincula o `relatorioPagamentoId` aos extratos aprovados agrupados.

### 3.3 Confirmar Pagamento
Registra o pagamento e anexa o comprovante (Pix/TED).
```http
POST /api/comissao/pagamento/{id}/confirmar
```
**Body (Multipart Form-Data):**
*   `arquivo`: Arquivo físico do comprovante (PDF ou imagem).
*   **Regra**: Atualiza o status do relatório para `pago` e altera o status de todos os extratos vinculados a este fechamento para `pago`.

---

## 4. Regras de Negócio Críticas (Backend)

### 4.1 Gatilho de Geração Automática
*   Quando uma oportunidade no Kanban muda de status para **"Venda Fechada" (Ganho)**, o backend deve disparar o pipeline de comissões de forma assíncrona.
*   **Resolução de Regra**:
    1.  Verificar se há regra ativa para o **Vendedor específico**.
    2.  Se não houver, verificar se há regra ativa para a **Equipe** do vendedor.
    3.  Se não houver, verificar se há regra ativa para o **Produto** vendido na oportunidade.
    4.  Se não houver, aplicar a **Regra Geral** (se ativa).
    5.  Se nenhuma regra estiver ativa, não gerar comissão.
*   **Regras Escalonadas**: Para calcular regras do tipo `escalonado`, o backend deve obter a meta de faturamento individual do vendedor para o mês corrente (da tabela de metas) e dividi-la pelo faturamento real acumulado até o momento do fechamento. O percentual resultante dita qual faixa de bonificação aplicar.

### 4.2 Segurança no Fluxo de Negócios (Kanban Lock)
*   **Bloqueio**: Uma oportunidade com status final "Venda Fechada" **não pode** ser reaberta ou movida de coluna por vendedores.
*   **Reabertura pelo Gestor**: Apenas usuários com privilégios de gestão podem desfazer o fechamento de uma oportunidade.
    *   Se a comissão vinculada estiver como `pendente` ou `em_revisao`, o backend deve **excluir ou cancelar** a comissão atrelada automaticamente.
    *   Se a comissão já estiver `aprovada` (consolidada) ou `paga`, a API de reabertura da oportunidade deve retornar erro `400` impedindo a ação, orientando o gestor a estornar a comissão antes de prosseguir.
