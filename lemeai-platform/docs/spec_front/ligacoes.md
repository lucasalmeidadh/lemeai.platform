# Ligações — Exemplos de Requisições HTTP

Base URL: `https://{host}/api/ligacao`

Todos os endpoints exigem autenticação JWT via cookie `jwt-token` ou header `Authorization: Bearer {token}`.

---

## POST /api/ligacao/Criar

Registra uma nova ligação para o usuário autenticado.

**Request**
```http
POST /api/ligacao/Criar
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": "2026-06-03T14:30:00Z",
  "duracaoSegundos": 180,
  "observacao": "Cliente interessado no plano premium, ligar novamente na sexta.",
  "conversaId": 42
}
```

> `conversaId` é opcional. `duracaoSegundos` e `observacao` também são opcionais.

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Ligação registrada com sucesso.",
  "dados": {
    "id": 101,
    "usuarioId": 7,
    "usuarioNome": "",
    "conversaId": 42,
    "data": "2026-06-03T14:30:00Z",
    "duracaoSegundos": 180,
    "observacao": "Cliente interessado no plano premium, ligar novamente na sexta."
  }
}
```

**Resposta 400**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao registrar ligação.",
  "dados": null
}
```

---

## GET /api/ligacao/BuscarTodas

Retorna todas as ligações da empresa do usuário autenticado.

**Request**
```http
GET /api/ligacao/BuscarTodas
Authorization: Bearer {token}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Ligações encontradas.",
  "dados": [
    {
      "id": 101,
      "usuarioId": 7,
      "usuarioNome": "",
      "conversaId": 42,
      "data": "2026-06-03T14:30:00Z",
      "duracaoSegundos": 180,
      "observacao": "Cliente interessado no plano premium, ligar novamente na sexta."
    },
    {
      "id": 98,
      "usuarioId": 5,
      "usuarioNome": "",
      "conversaId": null,
      "data": "2026-06-02T09:15:00Z",
      "duracaoSegundos": 60,
      "observacao": null
    }
  ]
}
```

---

## GET /api/ligacao/BuscarPorId/{id}

Retorna uma ligação específica. Valida que ela pertence à empresa do token.

**Request**
```http
GET /api/ligacao/BuscarPorId/101
Authorization: Bearer {token}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Ligação encontrada.",
  "dados": {
    "id": 101,
    "usuarioId": 7,
    "usuarioNome": "",
    "conversaId": 42,
    "data": "2026-06-03T14:30:00Z",
    "duracaoSegundos": 180,
    "observacao": "Cliente interessado no plano premium, ligar novamente na sexta."
  }
}
```

**Resposta 400 — não encontrada**
```json
{
  "sucesso": false,
  "mensagem": "Ligação não encontrada.",
  "dados": null
}
```

**Resposta 400 — acesso negado (ligação de outra empresa)**
```json
{
  "sucesso": false,
  "mensagem": "Acesso não autorizado.",
  "dados": null
}
```

---

## PUT /api/ligacao/Atualizar

Atualiza os dados de uma ligação existente. Valida que ela pertence à empresa do token.

**Request**
```http
PUT /api/ligacao/Atualizar
Authorization: Bearer {token}
Content-Type: application/json

{
  "ligacaoId": 101,
  "data": "2026-06-03T15:00:00Z",
  "duracaoSegundos": 240,
  "observacao": "Confirmou interesse. Enviar proposta por e-mail.",
  "conversaId": 42
}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Ligação atualizada com sucesso.",
  "dados": null
}
```

**Resposta 400 — não encontrada**
```json
{
  "sucesso": false,
  "mensagem": "Ligação não encontrada.",
  "dados": null
}
```

---

## DELETE /api/ligacao/Remover/{id}

Remove (soft delete) uma ligação. Valida que ela pertence à empresa do token.

**Request**
```http
DELETE /api/ligacao/Remover/101
Authorization: Bearer {token}
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Ligação removida com sucesso.",
  "dados": null
}
```

**Resposta 400 — não encontrada**
```json
{
  "sucesso": false,
  "mensagem": "Ligação não encontrada.",
  "dados": null
}
```

---

## Uso nos Relatórios de Metas

Os métodos de repositório adicionais (`BuscarPorUsuario`, `BuscarPorMes`, `ContarPorUsuarioNoMes`) não são expostos diretamente via endpoints de ligação — eles são consumidos internamente pelo `RelatorioService` para calcular `totalLigacoes` nos relatórios de performance.

```
GET /api/relatorio/... → RelatorioService → ILigacaoRepositorio.ContarPorUsuarioNoMes(usuarioId, ano, mes)
```
