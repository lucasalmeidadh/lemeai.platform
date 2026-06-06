# Especificação Técnica: API de Produtos do Deal (Oportunidade)

Esta documentação detalha os requisitos e especificações de endpoints necessários no backend para persistir a associação de produtos e serviços de interesse (e vendas fechadas) a um Deal (Oportunidade/Conversa).

---

## 1. Modelo de Dados Sugerido

### Tabela: `OportunidadeProduto` (ou `ConversaProduto`)
Representa o relacionamento de muitos-para-muitos entre uma Conversa (Deal) e um Produto, permitindo a customização de preço e quantidade no momento da negociação.

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `OportunidadeProdutoId` | INT / GUID | PK, Auto Increment | Identificador único do item no Deal |
| `ConversaId` (ou `OportunidadeId`) | INT | FK -> `Conversa.Id` | ID do Deal/Conversa associada |
| `ProdutoId` | INT | FK -> `Produto.ProdutoId` | ID do Produto associado |
| `Quantidade` | INT | NOT NULL, Default 1 | Quantidade de itens negociados |
| `PrecoUnitarioNegociado` | DECIMAL(18,2) | NOT NULL | Preço unitário fechado para esta venda |
| `DataAssociacao` | DATETIME | NOT NULL, Default GETDATE() | Data em que o produto foi vinculado |

---

## 2. Endpoints Necessários

### 2.1. Listar Produtos de um Deal
Retorna todos os produtos vinculados a uma conversa específica.

* **Rota:** `GET /api/Chat/Conversas/{conversaId}/Produtos`
* **Resposta de Sucesso (`200 OK`):**
```json
{
  "sucesso": true,
  "mensagem": "Produtos listados com sucesso",
  "dados": [
    {
      "oportunidadeProdutoId": 12,
      "conversaId": 154,
      "produtoId": 25,
      "codigo": "PROD-025",
      "nome": "Agente de IA com CRM integrado ao WhatsApp",
      "marca": "LemeAI",
      "quantidade": 2,
      "precoUnitarioNegociado": 257.00,
      "precoTotal": 514.00
    }
  ]
}
```

---

### 2.2. Vincular Produto ao Deal
Adiciona um novo produto ao Deal com quantidade e preço negociados.

* **Rota:** `POST /api/Chat/Conversas/{conversaId}/Produtos`
* **Corpo da Requisição (Request Body):**
```json
{
  "produtoId": 25,
  "quantidade": 2,
  "precoUnitarioNegociado": 257.00
}
```
* **Resposta de Sucesso (`201 Created`):**
```json
{
  "sucesso": true,
  "mensagem": "Produto vinculado com sucesso",
  "dados": {
    "oportunidadeProdutoId": 12,
    "conversaId": 154,
    "produtoId": 25,
    "quantidade": 2,
    "precoUnitarioNegociado": 257.00
  }
}
```

---

### 2.3. Atualizar Quantidade/Preço de um Produto no Deal
Permite alterar a quantidade ou o preço negociado de um item já vinculado.

* **Rota:** `PUT /api/Chat/Conversas/{conversaId}/Produtos/{oportunidadeProdutoId}`
* **Corpo da Requisição (Request Body):**
```json
{
  "quantidade": 3,
  "precoUnitarioNegociado": 240.00
}
```
* **Resposta de Sucesso (`200 OK`):**
```json
{
  "sucesso": true,
  "mensagem": "Produto atualizado no Deal",
  "dados": {
    "oportunidadeProdutoId": 12,
    "quantidade": 3,
    "precoUnitarioNegociado": 240.00
  }
}
```

---

### 2.4. Remover Produto do Deal
Desvincula um produto da oportunidade.

* **Rota:** `DELETE /api/Chat/Conversas/{conversaId}/Produtos/{oportunidadeProdutoId}`
* **Resposta de Sucesso (`200 OK`):**
```json
{
  "sucesso": true,
  "mensagem": "Produto removido da oportunidade"
}
```

---

## 3. Regras de Negócio e Comportamento Esperado

1. **Atualização Automática do Valor da Oportunidade (Opcional no Back):**
   * Ao adicionar, atualizar ou remover produtos de uma Oportunidade, o sistema pode recalcular automaticamente o campo `Valor` da tabela `Conversa` com base no somatório de `Quantidade * PrecoUnitarioNegociado`.
   * Caso o cálculo automático no back não seja o ideal, o endpoint `PATCH /api/Chat/Conversas/{id}/AtualizarStatus` continuará sendo usado para sincronizar o valor total manualmente, como feito no frontend hoje.

2. **Fechamento de Venda:**
   * Quando o status do Deal mudar para **Venda Fechada** (ID: `3`), o backend pode validar se existe pelo menos um produto associado a esse Deal, registrando no histórico de auditoria os itens que de fato foram faturados.
