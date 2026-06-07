# Requisitos de API — LemeAI Platform

> Documento gerado em 02/06/2026  
> Escopo: telas `/equipes`, `/metas` e `/monitoramento`  
> Todos os endpoints devem retornar o envelope padrão `{ sucesso: boolean, dados: T, mensagem?: string }`

---

## 1. Tela — Equipes (`/equipes`)

Tela de gestão de equipes: listagem, criação, edição e exclusão.

### 1.1 Listar equipes

```
GET /api/Equipe/BuscarTodas
```

**Response `dados`:**
```json
[
  {
    "id": 1,
    "nome": "Vendas SP",
    "liderId": 1,
    "liderNome": "Lucas Almeida",
    "membroIds": [1, 2, 3],
    "membros": [
      { "id": 1, "nome": "Lucas Almeida" },
      { "id": 2, "nome": "Ana Silva" }
    ]
  }
]
```

---

### 1.2 Criar equipe

```
POST /api/Equipe/Criar
```

**Body:**
```json
{
  "nome": "Vendas SP",
  "liderId": 1,
  "membroIds": [1, 2, 3]
}
```

---

### 1.3 Editar equipe

```
PUT /api/Equipe/Atualizar/{id}
```

**Body:** mesmo schema do POST.

---

### 1.4 Excluir equipe

```
DELETE /api/Equipe/Excluir/{id}
```

---

### 1.5 Listar usuários (para seleção de líder/membros)

Já existe:
```
GET /api/Usuario/BuscarTodos
```

Resposta esperada:
```json
{
  "sucesso": true,
  "dados": [
    { "userId": 1, "userName": "Lucas Almeida" }
  ]
}
```

---

## 2. Tela — Metas (`/metas`)

Tela de cadastro e gestão de metas mensais por colaborador ou equipe. Também configura os dias úteis da semana.

### 2.1 Listar metas

```
GET /api/Meta/BuscarTodas?mes={YYYY-MM}
```

Query params opcionais: `mes` (ex: `2026-06`), `tipoAlvo` (`user` | `team`)

**Response `dados`:**
```json
[
  {
    "id": "uuid",
    "tipoAlvo": "user",
    "alvoId": 1,
    "alvoNome": "Lucas Almeida",
    "tipo": "value",
    "valorAlvo": 50000,
    "mes": "2026-06"
  }
]
```

**Tipos de meta (`tipo`):**
| Valor      | Descrição            |
|------------|----------------------|
| `value`    | Faturamento em R$    |
| `quantity` | Quantidade de vendas |
| `calls`    | Quantidade de ligações |

---

### 2.2 Criar meta

```
POST /api/Meta/Criar
```

**Body:**
```json
{
  "tipoAlvo": "user",
  "alvoId": 1,
  "tipo": "value",
  "valorAlvo": 50000,
  "mes": "2026-06"
}
```

**Regra de negócio:** não pode haver duas metas do mesmo `tipoAlvo + alvoId + tipo + mes`.

---

### 2.3 Editar meta

```
PUT /api/Meta/Atualizar/{id}
```

**Body:** mesmo schema do POST.

---

### 2.4 Excluir meta

```
DELETE /api/Meta/Excluir/{id}
```

---

### 2.5 Replicar metas do mês anterior

```
POST /api/Meta/Replicar
```

**Body:**
```json
{
  "mesOrigem": "2026-05",
  "mesDestino": "2026-06"
}
```

Retorna quantas foram copiadas e quantas foram ignoradas (já existiam).

---

### 2.6 Configurar dias úteis

```
GET  /api/Configuracao/DiasUteis
PUT  /api/Configuracao/DiasUteis
```

**Schema:**
```json
{
  "segunda": true,
  "terca": true,
  "quarta": true,
  "quinta": true,
  "sexta": true,
  "sabado": false,
  "domingo": false
}
```

---

## 3. Tela — Monitoramento (`/monitoramento`)

Tela com três abas: **Analytics**, **Individual** e **Equipes**.

---

### 3.1 Aba Analytics

#### 3.1.1 Dados de pipeline (oportunidades)

Já existe:
```
GET /api/Oportunidade/BuscarTodas
```

Campos usados: `descricaoStatus`, `valor`, `responsavelId`, `dataAtualizacao`

---

#### 3.1.2 Performance de faturamento mensal (histórico)

```
GET /api/Relatorio/FaturamentoMensal?meses={N}
```

Retorna os últimos N meses agregados.

**Response `dados`:**
```json
[
  { "mes": "2026-01", "mesLabel": "Jan", "totalFaturado": 32000 },
  { "mes": "2026-02", "mesLabel": "Fev", "totalFaturado": 38000 }
]
```

---

#### 3.1.3 Performance de equipes vs. meta (gráfico + ranking)

```
GET /api/Relatorio/PerformanceEquipes?mes={YYYY-MM}
```

> **Regra de negócio:** `totalFaturado` é a soma do campo `valor` de todas as oportunidades com status **"Venda Fechada" (ganho)** cujo responsável pertença à equipe, dentro do mês de referência.

**Response `dados`:**
```json
[
  {
    "equipeId": 1,
    "equipeNome": "Vendas SP",
    "totalFaturado": 87400,
    "totalLigacoes": 412,
    "metaFaturamento": 200000,
    "percentualAtingido": 44
  }
]
```

---

#### 3.1.4 Ranking individual vs. meta

```
GET /api/Relatorio/PerformanceIndividual?mes={YYYY-MM}
```

> **Regra de negócio:** `totalFaturado` é a soma do campo `valor` de todas as oportunidades com status **"Venda Fechada" (ganho)** atribuídas ao usuário dentro do mês de referência.

**Response `dados`:**
```json
[
  {
    "usuarioId": 1,
    "usuarioNome": "Lucas Almeida",
    "totalFaturado": 58000,
    "totalLigacoes": 290,
    "metaFaturamento": 50000,
    "metaLigacoes": 300,
    "percentualFaturamento": 116,
    "percentualLigacoes": 97
  }
]
```

---

### 3.2 Aba Individual

Usa os mesmos dados de **3.1.3** e **3.1.4** filtrados por mês selecionado.  
Também consome metas via **2.1**.

Dados adicionais para cálculo de projeção de fechamento do mês:

```
GET /api/Relatorio/ProjecaoFechamento?mes={YYYY-MM}&usuarioId={id}
```

**Response `dados`:**
```json
{
  "diasUteisTotais": 22,
  "diasUteisDecorridos": 14,
  "mediaDiaria": 4142,
  "projecaoFechamento": 91124
}
```

---

### 3.3 Aba Equipes

Usa os mesmos dados de **3.1.3** filtrados por mês selecionado.

#### 3.3.1 Membros de uma equipe com performance individual

```
GET /api/Relatorio/PerformanceEquipeMembros?equipeId={id}&mes={YYYY-MM}
```

> **Regra de negócio:** `totalFaturado` de cada membro é a soma do campo `valor` das oportunidades com status **"Venda Fechada" (ganho)** atribuídas ao usuário dentro do mês de referência.

**Response `dados`:**
```json
{
  "equipeId": 1,
  "equipeNome": "Vendas SP",
  "membros": [
    {
      "usuarioId": 1,
      "usuarioNome": "Lucas Almeida",
      "totalFaturado": 58000,
      "metaFaturamento": 50000,
      "percentualFaturamento": 116,
      "totalLigacoes": 290
    }
  ]
}
```

---

## 4. Resumo de Endpoints

| Tela            | Método | Endpoint                                        | Status     |
|-----------------|--------|-------------------------------------------------|------------|
| Equipes         | GET    | `/api/Equipe/BuscarTodas`                       | Novo       |
| Equipes         | POST   | `/api/Equipe/Criar`                             | Novo       |
| Equipes         | PUT    | `/api/Equipe/Atualizar/{id}`                    | Novo       |
| Equipes         | DELETE | `/api/Equipe/Excluir/{id}`                      | Novo       |
| Equipes         | GET    | `/api/Usuario/BuscarTodos`                      | Existente  |
| Metas           | GET    | `/api/Meta/BuscarTodas`                         | Novo       |
| Metas           | POST   | `/api/Meta/Criar`                               | Novo       |
| Metas           | PUT    | `/api/Meta/Atualizar/{id}`                      | Novo       |
| Metas           | DELETE | `/api/Meta/Excluir/{id}`                        | Novo       |
| Metas           | POST   | `/api/Meta/Replicar`                            | Novo       |
| Metas           | GET    | `/api/Configuracao/DiasUteis`                   | Novo       |
| Metas           | PUT    | `/api/Configuracao/DiasUteis`                   | Novo       |
| Monitoramento   | GET    | `/api/Oportunidade/BuscarTodas`                 | Existente  |
| Monitoramento   | GET    | `/api/Relatorio/FaturamentoMensal`              | Novo       |
| Monitoramento   | GET    | `/api/Relatorio/PerformanceEquipes`             | Novo       |
| Monitoramento   | GET    | `/api/Relatorio/PerformanceIndividual`          | Novo       |
| Monitoramento   | GET    | `/api/Relatorio/ProjecaoFechamento`             | Novo       |
| Monitoramento   | GET    | `/api/Relatorio/PerformanceEquipeMembros`       | Novo       |

---

## 5. Regras de Negócio Globais

### Cálculo de faturamento atingido
Em todas as telas e relatórios, **"valor atingido" ou "total faturado" é sempre a soma do campo `valor` das oportunidades com status de ganho**, atribuídas ao responsável (usuário ou membros da equipe) dentro do período de referência. Nunca usa outro campo ou fonte de dados.

O status de ganho no sistema é identificado quando `descricaoStatus` contém `"fechada"` (case-insensitive). A API deve filtrar por este critério internamente — o frontend não deve fazer esse filtro por conta própria.

---

## 6. Observações

- **Dados mock ativos:** Equipes, metas individuais/equipes e performance de vendedores estão todos em mock no frontend. A integração com a API substituirá esses mocks ponto a ponto.
- **Metas no localStorage:** Atualmente persistidas em `lemeai_goals_v2` e `lemeai_working_days`. A migração para API deve manter retrocompatibilidade durante a transição.
- **Cálculos de projeção e percentual:** Podem ser feitos no frontend a partir dos dados brutos retornados, ou delegados à API via endpoints de relatório — a preferência é delegar à API para centralizar a lógica de negócio.
