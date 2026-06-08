# Produtos Vinculados à Conversa — Documentação de Endpoints

Base URL: `/api/Chat`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).  
O `empresaId` é extraído automaticamente do token JWT — não deve ser enviado pelo cliente.

---

## GET `/api/Chat/Conversas/{conversaId}/Produtos`

Retorna todos os produtos vinculados a uma conversa (Deal).

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `conversaId` | `int` | ID da conversa |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Produtos listados com sucesso.",
  "dados": [
    {
      "oportunidadeProdutoId": 1,
      "conversaId": 10,
      "produtoId": 3,
      "codigo": "PROD-001",
      "nome": "Notebook Gamer",
      "marca": "Dell",
      "quantidade": 2,
      "precoUnitarioNegociado": 4500.00,
      "precoTotal": 9000.00
    },
    {
      "oportunidadeProdutoId": 2,
      "conversaId": 10,
      "produtoId": 7,
      "codigo": "PROD-007",
      "nome": "Mouse Sem Fio",
      "marca": "Logitech",
      "quantidade": 1,
      "precoUnitarioNegociado": 150.00,
      "precoTotal": 150.00
    }
  ]
}
```

**Response 400** (conversa não encontrada ou sem permissão):
```json
{
  "sucesso": false,
  "mensagem": "Conversa não encontrada.",
  "dados": null
}
```

---

## POST `/api/Chat/Conversas/{conversaId}/Produtos`

Vincula um produto a uma conversa, registrando quantidade e preço negociado. Recalcula automaticamente o `value` (valor total) da conversa.

**Path param:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `conversaId` | `int` | ID da conversa |

**Request body:**
```json
{
  "produtoId": 3,
  "quantidade": 2,
  "precoUnitarioNegociado": 4500.00
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `produtoId` | `int` | Sim | ID do produto a vincular |
| `quantidade` | `int` | Sim | Quantidade (deve ser > 0) |
| `precoUnitarioNegociado` | `decimal` | Sim | Preço unitário negociado (deve ser >= 0) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Produto vinculado com sucesso.",
  "dados": {
    "oportunidadeProdutoId": 1,
    "conversaId": 10,
    "produtoId": 3,
    "codigo": "PROD-001",
    "nome": "Notebook Gamer",
    "marca": "Dell",
    "quantidade": 2,
    "precoUnitarioNegociado": 4500.00,
    "precoTotal": 9000.00
  }
}
```

**Response 400** (validações):
```json
{
  "sucesso": false,
  "mensagem": "Quantidade deve ser maior que zero.",
  "dados": null
}
```
```json
{
  "sucesso": false,
  "mensagem": "Produto não encontrado.",
  "dados": null
}
```
```json
{
  "sucesso": false,
  "mensagem": "Produto não pertence a esta empresa.",
  "dados": null
}
```

---

## PUT `/api/Chat/Conversas/{conversaId}/Produtos/{oportunidadeProdutoId}`

Atualiza a quantidade e/ou o preço negociado de um produto já vinculado. Recalcula automaticamente o `value` da conversa.

**Path params:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `conversaId` | `int` | ID da conversa |
| `oportunidadeProdutoId` | `int` | ID do vínculo (retornado no POST/GET) |

**Request body:**
```json
{
  "quantidade": 3,
  "precoUnitarioNegociado": 4200.00
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `quantidade` | `int` | Sim | Nova quantidade (deve ser > 0) |
| `precoUnitarioNegociado` | `decimal` | Sim | Novo preço unitário negociado (deve ser >= 0) |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Produto atualizado no Deal.",
  "dados": {
    "oportunidadeProdutoId": 1,
    "conversaId": 10,
    "produtoId": 3,
    "codigo": null,
    "nome": null,
    "marca": null,
    "quantidade": 3,
    "precoUnitarioNegociado": 4200.00,
    "precoTotal": 12600.00
  }
}
```

**Response 400** (não encontrado ou sem permissão):
```json
{
  "sucesso": false,
  "mensagem": "Vínculo não encontrado.",
  "dados": null
}
```
```json
{
  "sucesso": false,
  "mensagem": "Acesso não autorizado.",
  "dados": null
}
```

---

## DELETE `/api/Chat/Conversas/{conversaId}/Produtos/{oportunidadeProdutoId}`

Remove um produto vinculado à conversa (soft delete). Recalcula automaticamente o `value` da conversa.

**Path params:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `conversaId` | `int` | ID da conversa |
| `oportunidadeProdutoId` | `int` | ID do vínculo a remover |

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Produto removido da oportunidade.",
  "dados": null
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Vínculo não encontrado.",
  "dados": null
}
```

---

## Comportamentos automáticos

- **Recálculo de valor**: toda operação de escrita (vincular, atualizar, remover) recalcula e persiste o campo `value` na conversa com a soma de `quantidade × precoUnitarioNegociado` de todos os vínculos ativos.
- **Validação ao fechar venda**: ao tentar atualizar o status da conversa para `VendaFechada`, a API retorna erro se não houver nenhum produto vinculado:

```json
{
  "sucesso": false,
  "mensagem": "Para fechar uma venda, é necessário vincular pelo menos um produto à conversa.",
  "dados": null
}
```

---

## Notas

- O campo `codigo`, `nome` e `marca` na response do PUT retornam `null` — para obter os dados do produto, use o GET após a atualização.
- O `oportunidadeProdutoId` é o identificador do vínculo (tabela `conversation_products`), não do produto em si.
- O mesmo produto pode ser vinculado mais de uma vez à mesma conversa com quantidades ou preços diferentes.
