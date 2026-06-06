# Gestão de Metas — Documentação de Endpoints

> Todos os endpoints requerem autenticação via JWT (`Authorization: Bearer <token>` ou cookie `jwt-token`).  
> O `empresaId` é extraído automaticamente do token — nunca enviar como parâmetro.

---

## Módulo Equipes — `/api/equipe`

### GET /api/equipe/BuscarTodas

Retorna todas as equipes da empresa.

**Request**
```http
GET /api/equipe/BuscarTodas
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Equipes encontradas.",
  "dados": [
    {
      "id": 1,
      "nome": "Equipe Alpha",
      "liderId": 3,
      "liderNome": "Carlos Souza",
      "membroIds": [3, 5, 7],
      "membros": [
        { "id": 3, "nome": "Carlos Souza" },
        { "id": 5, "nome": "Ana Lima" },
        { "id": 7, "nome": "Pedro Rocha" }
      ]
    },
    {
      "id": 2,
      "nome": "Equipe Beta",
      "liderId": 10,
      "liderNome": "Fernanda Costa",
      "membroIds": [10, 12],
      "membros": [
        { "id": 10, "nome": "Fernanda Costa" },
        { "id": 12, "nome": "Lucas Martins" }
      ]
    }
  ]
}
```

---

### GET /api/equipe/BuscarPorId/{id}

Retorna uma equipe pelo ID.

**Request**
```http
GET /api/equipe/BuscarPorId/1
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Equipe encontrada.",
  "dados": {
    "id": 1,
    "nome": "Equipe Alpha",
    "liderId": 3,
    "liderNome": "Carlos Souza",
    "membroIds": [3, 5, 7],
    "membros": [
      { "id": 3, "nome": "Carlos Souza" },
      { "id": 5, "nome": "Ana Lima" },
      { "id": 7, "nome": "Pedro Rocha" }
    ]
  }
}
```

**Response 400 (não encontrada)**
```json
{
  "sucesso": false,
  "mensagem": "Equipe não encontrada.",
  "dados": null
}
```

---

### POST /api/equipe/Criar

Cria uma nova equipe.

**Request**
```http
POST /api/equipe/Criar
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Equipe Alpha",
  "liderId": 3,
  "membroIds": [3, 5, 7]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Sim | Nome da equipe |
| `liderId` | int | Sim | ID do usuário líder |
| `membroIds` | int[] | Não | IDs dos membros (pode incluir o líder) |

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Equipe criada com sucesso.",
  "dados": {
    "id": 1,
    "nome": "Equipe Alpha",
    "liderId": 3,
    "liderNome": "",
    "membroIds": [3, 5, 7],
    "membros": [
      { "id": 3, "nome": "" },
      { "id": 5, "nome": "" },
      { "id": 7, "nome": "" }
    ]
  }
}
```

> **Nota:** `liderNome` e nomes dos membros ficam vazios no retorno da criação pois as navigation properties não são carregadas nesse momento. Use `BuscarPorId` para obter os nomes.

---

### PUT /api/equipe/Atualizar/{id}

Atualiza nome, líder e membros de uma equipe. A lista de membros é **substituída** integralmente.

**Request**
```http
PUT /api/equipe/Atualizar/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Equipe Alpha Plus",
  "liderId": 3,
  "membroIds": [3, 5, 7, 9]
}
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Equipe atualizada com sucesso.",
  "dados": null
}
```

**Response 400 (acesso não autorizado)**
```json
{
  "sucesso": false,
  "mensagem": "Acesso não autorizado.",
  "dados": null
}
```

---

### DELETE /api/equipe/Excluir/{id}

Remove (soft delete) uma equipe.

**Request**
```http
DELETE /api/equipe/Excluir/1
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Equipe removida com sucesso.",
  "dados": null
}
```

---

## Módulo Metas — `/api/meta`

> `TipoAlvo`: `"user"` | `"team"`  
> `Tipo` (TipoMeta): `"vendas"` (contagem de vendas fechadas) | `"valor"` (soma do valor das vendas fechadas)  
> `Mes`: formato `"YYYY-MM"` (ex: `"2025-06"`)

> **`ValorRealizado`:** calculado automaticamente pelo servidor com base nas conversas com status `VendaFechada` e `conversation_closed_at` dentro do mês da meta.  
> - `TipoMeta = "vendas"` → contagem de conversas fechadas no mês  
> - `TipoMeta = "valor"` → soma do campo `value` das conversas fechadas no mês  
> - Para metas de equipe, soma todos os membros da equipe. Equipe sem membros retorna `0`.

---

### GET /api/meta/BuscarTodas

Retorna todas as metas da empresa. Aceita filtros opcionais por mês e tipo de alvo.

**Request**
```http
GET /api/meta/BuscarTodas?mes=2025-06&tipoAlvo=user
Authorization: Bearer <token>
```

| Query param | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| `mes` | string | Não | Filtrar por mês (`YYYY-MM`) |
| `tipoAlvo` | string | Não | `"user"` ou `"team"` |

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Metas encontradas.",
  "dados": [
    {
      "id": 1,
      "tipoAlvo": "user",
      "alvoId": 5,
      "alvoNome": "Ana Lima",
      "tipo": "valor",
      "valorAlvo": 50000.00,
      "valorRealizado": 38000.00,
      "mes": "2025-06"
    },
    {
      "id": 2,
      "tipoAlvo": "user",
      "alvoId": 5,
      "alvoNome": "Ana Lima",
      "tipo": "vendas",
      "valorAlvo": 20.00,
      "valorRealizado": 13,
      "mes": "2025-06"
    }
  ]
}
```

---

### GET /api/meta/BuscarPorId/{id}

Retorna uma meta pelo ID.

**Request**
```http
GET /api/meta/BuscarPorId/1
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Meta encontrada.",
  "dados": {
    "id": 1,
    "tipoAlvo": "user",
    "alvoId": 5,
    "alvoNome": "Ana Lima",
    "tipo": "valor",
    "valorAlvo": 50000.00,
    "valorRealizado": 38000.00,
    "mes": "2025-06"
  }
}
```

---

### POST /api/meta/Criar

Cria uma nova meta. Valida unicidade: só pode existir uma meta por combinação de `(empresa, tipoAlvo, alvoId, tipo, mes)`.

**Request**
```http
POST /api/meta/Criar
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipoAlvo": "user",
  "alvoId": 5,
  "tipo": "value",
  "valorAlvo": 50000.00,
  "mes": "2025-06"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipoAlvo` | string | Sim | `"user"` ou `"team"` |
| `alvoId` | int | Sim | ID do usuário ou da equipe |
| `tipo` | string | Sim | `"vendas"` ou `"valor"` |
| `valorAlvo` | decimal | Sim | Valor da meta |
| `mes` | string | Sim | Mês no formato `"YYYY-MM"` |

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Meta criada com sucesso.",
  "dados": {
    "id": 3,
    "tipoAlvo": "user",
    "alvoId": 5,
    "alvoNome": "Ana Lima",
    "tipo": "valor",
    "valorAlvo": 50000.00,
    "valorRealizado": 0,
    "mes": "2025-06"
  }
}
```

**Response 400 (duplicidade)**
```json
{
  "sucesso": false,
  "mensagem": "Já existe uma meta com esse tipo e período para o alvo informado.",
  "dados": null
}
```

---

### PUT /api/meta/Atualizar/{id}

Atualiza uma meta existente.

**Request**
```http
PUT /api/meta/Atualizar/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipoAlvo": "user",
  "alvoId": 5,
  "tipo": "value",
  "valorAlvo": 60000.00,
  "mes": "2025-06"
}
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Meta atualizada com sucesso.",
  "dados": null
}
```

---

### DELETE /api/meta/Excluir/{id}

Remove (soft delete) uma meta.

**Request**
```http
DELETE /api/meta/Excluir/1
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Meta removida com sucesso.",
  "dados": null
}
```

---

### POST /api/meta/Replicar

Copia todas as metas de um mês de origem para um mês de destino. Metas já existentes no destino são ignoradas (não sobrescritas).

**Request**
```http
POST /api/meta/Replicar
Authorization: Bearer <token>
Content-Type: application/json

{
  "mesOrigem": "2025-06",
  "mesDestino": "2025-07"
}
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Replicação concluída.",
  "dados": {
    "copiadas": 5,
    "ignoradas": 2
  }
}
```

| Campo | Descrição |
|-------|-----------|
| `copiadas` | Quantidade de metas criadas no mês destino |
| `ignoradas` | Quantidade de metas puladas (já existiam no destino) |

---

## Módulo Configuração — `/api/configuracao`

### GET /api/configuracao/DiasUteis

Retorna a configuração de dias úteis da empresa. Se não houver configuração salva, retorna o padrão (segunda a sexta habilitados).

**Request**
```http
GET /api/configuracao/DiasUteis
Authorization: Bearer <token>
```

**Response 200 (configuração salva)**
```json
{
  "sucesso": true,
  "mensagem": "Configuração encontrada.",
  "dados": {
    "segunda": true,
    "terca": true,
    "quarta": true,
    "quinta": true,
    "sexta": true,
    "sabado": false,
    "domingo": false
  }
}
```

**Response 200 (padrão — sem configuração salva)**
```json
{
  "sucesso": true,
  "mensagem": "Configuração padrão.",
  "dados": {
    "segunda": true,
    "terca": true,
    "quarta": true,
    "quinta": true,
    "sexta": true,
    "sabado": false,
    "domingo": false
  }
}
```

---

### PUT /api/configuracao/DiasUteis

Salva ou atualiza a configuração de dias úteis (upsert). Usado para definir quais dias contam como dias úteis no cálculo de projeções.

**Request**
```http
PUT /api/configuracao/DiasUteis
Authorization: Bearer <token>
Content-Type: application/json

{
  "segunda": true,
  "terca": true,
  "quarta": true,
  "quinta": true,
  "sexta": true,
  "sabado": true,
  "domingo": false
}
```

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Configuração atualizada com sucesso.",
  "dados": {
    "segunda": true,
    "terca": true,
    "quarta": true,
    "quinta": true,
    "sexta": true,
    "sabado": true,
    "domingo": false
  }
}
```

---

## Módulo Relatórios — `/api/relatorio`

### GET /api/relatorio/FaturamentoMensal

Retorna o faturamento total dos últimos N meses (conversas com status "fechada").

**Request**
```http
GET /api/relatorio/FaturamentoMensal?meses=6
Authorization: Bearer <token>
```

| Query param | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `meses` | int | `6` | Quantidade de meses a retornar (contando o mês atual) |

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Faturamento mensal.",
  "dados": [
    { "mes": "2025-01", "mesLabel": "Jan", "totalFaturado": 32500.00 },
    { "mes": "2025-02", "mesLabel": "Fev", "totalFaturado": 41200.00 },
    { "mes": "2025-03", "mesLabel": "Mar", "totalFaturado": 38900.00 },
    { "mes": "2025-04", "mesLabel": "Abr", "totalFaturado": 55100.00 },
    { "mes": "2025-05", "mesLabel": "Mai", "totalFaturado": 47800.00 },
    { "mes": "2025-06", "mesLabel": "Jun", "totalFaturado": 29300.00 }
  ]
}
```

---

### GET /api/relatorio/PerformanceIndividual

Retorna a performance individual de todos os vendedores da empresa no mês informado.

**Request**
```http
GET /api/relatorio/PerformanceIndividual?mes=2025-06
Authorization: Bearer <token>
```

| Query param | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| `mes` | string | Sim | Mês no formato `"YYYY-MM"` |

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Performance individual.",
  "dados": [
    {
      "usuarioId": 5,
      "usuarioNome": "Ana Lima",
      "totalFaturado": 38000.00,
      "totalLigacoes": 65,
      "metaFaturamento": 50000.00,
      "metaLigacoes": 80.00,
      "percentualFaturamento": 76,
      "percentualLigacoes": 81
    },
    {
      "usuarioId": 7,
      "usuarioNome": "Pedro Rocha",
      "totalFaturado": 52000.00,
      "totalLigacoes": 90,
      "metaFaturamento": 50000.00,
      "metaLigacoes": 80.00,
      "percentualFaturamento": 104,
      "percentualLigacoes": 112
    }
  ]
}
```

> **Nota:** `percentualFaturamento` e `percentualLigacoes` são 0 quando a meta correspondente não foi cadastrada para o mês.

---

### GET /api/relatorio/PerformanceEquipes

Retorna a performance de todas as equipes da empresa no mês informado.

**Request**
```http
GET /api/relatorio/PerformanceEquipes?mes=2025-06
Authorization: Bearer <token>
```

| Query param | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| `mes` | string | Sim | Mês no formato `"YYYY-MM"` |

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Performance das equipes.",
  "dados": [
    {
      "equipeId": 1,
      "equipeNome": "Equipe Alpha",
      "totalFaturado": 90000.00,
      "totalLigacoes": 155,
      "metaFaturamento": 100000.00,
      "percentualAtingido": 90
    },
    {
      "equipeId": 2,
      "equipeNome": "Equipe Beta",
      "totalFaturado": 45000.00,
      "totalLigacoes": 72,
      "metaFaturamento": 80000.00,
      "percentualAtingido": 56
    }
  ]
}
```

---

### GET /api/relatorio/ProjecaoFechamento

Calcula a projeção de faturamento de fechamento do mês para um vendedor, com base nos dias úteis decorridos e no faturamento atual.

**Request**
```http
GET /api/relatorio/ProjecaoFechamento?mes=2025-06&usuarioId=5
Authorization: Bearer <token>
```

| Query param | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| `mes` | string | Sim | Mês no formato `"YYYY-MM"` |
| `usuarioId` | int | Sim | ID do vendedor |

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Projeção de fechamento.",
  "dados": {
    "diasUteisTotais": 21,
    "diasUteisDecorridos": 14,
    "mediaDiaria": 2714.29,
    "projecaoFechamento": 57000.09
  }
}
```

| Campo | Descrição |
|-------|-----------|
| `diasUteisTotais` | Total de dias úteis no mês (calculado com base em `ConfiguracaoDiasUteis`) |
| `diasUteisDecorridos` | Dias úteis já passados até hoje |
| `mediaDiaria` | `totalFaturado / diasUteisDecorridos` |
| `projecaoFechamento` | `mediaDiaria * diasUteisTotais` |

> **Nota:** Se `diasUteisDecorridos == 0`, a projeção retorna 0. Configure os dias úteis via `PUT /api/configuracao/DiasUteis` antes de usar este endpoint.

---

### GET /api/relatorio/PerformanceEquipeMembros

Retorna a performance detalhada de cada membro de uma equipe no mês informado.

**Request**
```http
GET /api/relatorio/PerformanceEquipeMembros?equipeId=1&mes=2025-06
Authorization: Bearer <token>
```

| Query param | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| `equipeId` | int | Sim | ID da equipe |
| `mes` | string | Sim | Mês no formato `"YYYY-MM"` |

**Response 200**
```json
{
  "sucesso": true,
  "mensagem": "Performance da equipe.",
  "dados": {
    "equipeId": 1,
    "equipeNome": "Equipe Alpha",
    "membros": [
      {
        "usuarioId": 3,
        "usuarioNome": "Carlos Souza",
        "totalFaturado": 28000.00,
        "metaFaturamento": 50000.00,
        "percentualFaturamento": 56,
        "totalLigacoes": 48
      },
      {
        "usuarioId": 5,
        "usuarioNome": "Ana Lima",
        "totalFaturado": 38000.00,
        "metaFaturamento": 50000.00,
        "percentualFaturamento": 76,
        "totalLigacoes": 65
      },
      {
        "usuarioId": 7,
        "usuarioNome": "Pedro Rocha",
        "totalFaturado": 24000.00,
        "metaFaturamento": 50000.00,
        "percentualFaturamento": 48,
        "totalLigacoes": 42
      }
    ]
  }
}
```

**Response 400 (equipe não encontrada ou de outra empresa)**
```json
{
  "sucesso": false,
  "mensagem": "Equipe não encontrada.",
  "dados": null
}
```

---

## Respostas de Erro Comuns

| Situação | HTTP | Corpo |
|----------|------|-------|
| Recurso não encontrado | 400 | `{ "sucesso": false, "mensagem": "... não encontrado.", "dados": null }` |
| Acesso a recurso de outra empresa | 400 | `{ "sucesso": false, "mensagem": "Acesso não autorizado.", "dados": null }` |
| Token ausente ou inválido | 401 | Retorno padrão do middleware JWT |
| Formato de mês inválido | 400 | `{ "sucesso": false, "mensagem": "Formato de mês inválido. Use YYYY-MM.", "dados": null }` |
| Erro interno | 400 | `{ "sucesso": false, "mensagem": "Erro ao ...", "dados": null }` |

---

## Fluxo Recomendado de Uso

```
1. Criar equipes                → POST /api/equipe/Criar
2. Configurar dias úteis        → PUT  /api/configuracao/DiasUteis
3. Cadastrar metas do mês       → POST /api/meta/Criar (repetir para cada meta)
4. Replicar metas (mês seguinte)→ POST /api/meta/Replicar
5. Acompanhar performance       → GET  /api/relatorio/PerformanceIndividual?mes=YYYY-MM
                                  GET  /api/relatorio/PerformanceEquipes?mes=YYYY-MM
6. Projeção de fechamento       → GET  /api/relatorio/ProjecaoFechamento?mes=YYYY-MM&usuarioId=X
```
