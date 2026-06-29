# Plano — Endpoints (Admin)

Base URL: `https://api.lemeia.com.br`

Todos os endpoints exigem o header:
```
Authorization: Bearer <jwt-token>
```

> Requer policy `GBCodeAdminPolicy`.

---

## Visão Geral

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/plano/BuscarTodos` | Lista todos os planos, incluindo inativos |
| `GET` | `/api/plano/BuscarPorId/{id}` | Busca plano por ID |
| `POST` | `/api/plano/Criar` | Cria plano e registra produtos na AbacatePay (se aplicável) |
| `PUT` | `/api/plano/Atualizar` | Atualiza dados do plano (apenas local) |
| `DELETE` | `/api/plano/Remover/{id}` | Remove plano e deleta produtos da AbacatePay (se aplicável) |

---

## Campos do Plano

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `planoLimiteUsuario` | `int?` | Quantidade máxima de usuários ativos permitida. `null` = sem limite |
| `planoLimiteConexao` | `int?` | Quantidade máxima de conexões **por plataforma** (WhatsApp Meta, Evolution, Instagram etc. contam separadamente, mesmo número). `null` = sem limite |
| `planoIntegradoAbacatePay` | `bool` | Se `false`, o plano não é sincronizado com a AbacatePay (sem cobrança, sem exigir cartão) — usado pelo plano de teste |
| `planoIsTrial` | `bool` | Marca o plano de teste. Só pode existir **um** plano com esse valor `true` no sistema. Não aparece em `GET /api/assinatura/PlanosDisponiveis` e não pode ser contratado via checkout/troca de plano |

Esses limites valem tanto para planos pagos quanto para o plano de teste (toda empresa sempre tem uma `Assinatura` vinculada a um `Plano` — trial ou pago — então os mesmos limites são aplicados de forma uniforme).

---

### GET /api/plano/BuscarTodos

```http
GET /api/plano/BuscarTodos
Authorization: Bearer <token>
```

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Planos encontrados.",
  "dados": [
    {
      "planoId": 1,
      "planoNome": "Starter",
      "planoDescricao": "Até 3 usuários",
      "planoPreco": 197.00,
      "planoCiclo": "MONTHLY",
      "planoAtivo": true,
      "planoLimiteUsuario": 3,
      "planoLimiteConexao": 1,
      "planoIntegradoAbacatePay": true,
      "planoIsTrial": false,
      "abacateProductId": "prod_abc123",
      "abacateStatus": "ACTIVE",
      "planoCreatedat": "2025-01-10T12:00:00Z"
    },
    {
      "planoId": 2,
      "planoNome": "Teste Gratuito",
      "planoDescricao": "Plano de teste — 15 dias",
      "planoPreco": 0,
      "planoCiclo": "TRIAL",
      "planoAtivo": true,
      "planoLimiteUsuario": 2,
      "planoLimiteConexao": 1,
      "planoIntegradoAbacatePay": false,
      "planoIsTrial": true,
      "abacateProductId": null,
      "abacateStatus": null,
      "planoCreatedat": "2025-01-05T09:00:00Z"
    }
  ]
}
```

---

### GET /api/plano/BuscarPorId/{id}

```http
GET /api/plano/BuscarPorId/1
Authorization: Bearer <token>
```

**Resposta 200** — mesmo shape de um item de `BuscarTodos`.

**Resposta 400**
```json
{ "sucesso": false, "mensagem": "Plano não encontrado.", "dados": null }
```

---

### POST /api/plano/Criar

Cria o plano no banco. Se `integradoAbacatePay` for `true` (padrão), registra **dois produtos** na AbacatePay: um com ciclo (checkout CARD) e um sem ciclo (checkout PIX avulso). Se `false`, o plano fica só no banco local, sem nenhuma chamada à AbacatePay — usado para o plano de teste.

```http
POST /api/plano/Criar
Authorization: Bearer <token>
Content-Type: application/json
```

**Plano pago (padrão)**
```json
{
  "nome": "Starter",
  "descricao": "Até 3 usuários, 1 conexão WhatsApp",
  "preco": 197.00,
  "ciclo": "MONTHLY",
  "limiteUsuario": 3,
  "limiteConexao": 1,
  "integradoAbacatePay": true,
  "ehPlanoTeste": false
}
```

**Plano de teste** (sem cobrança, sem AbacatePay)
```json
{
  "nome": "Teste Gratuito",
  "descricao": "Plano de teste — 15 dias",
  "preco": 0,
  "ciclo": "TRIAL",
  "limiteUsuario": 2,
  "limiteConexao": 1,
  "integradoAbacatePay": false,
  "ehPlanoTeste": true
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | `string` | sim | |
| `descricao` | `string?` | não | |
| `preco` | `decimal` | sim | `0` para o plano de teste |
| `ciclo` | `string` | sim | `WEEKLY`/`MONTHLY`/`QUARTERLY`/`SEMIANNUALLY`/`ANNUALLY` para planos pagos |
| `limiteUsuario` | `int?` | não | `null` = sem limite |
| `limiteConexao` | `int?` | não | `null` = sem limite |
| `integradoAbacatePay` | `bool` | não (padrão `true`) | `false` pula a sincronização com a AbacatePay |
| `ehPlanoTeste` | `bool` | não (padrão `false`) | marca este plano como o plano de trial do sistema |

**Resposta 200**
```json
{
  "sucesso": true,
  "mensagem": "Plano criado com sucesso.",
  "dados": {
    "planoId": 1,
    "planoNome": "Starter",
    "planoDescricao": "Até 3 usuários, 1 conexão WhatsApp",
    "planoPreco": 197.00,
    "planoCiclo": "MONTHLY",
    "planoAtivo": true,
    "planoLimiteUsuario": 3,
    "planoLimiteConexao": 1,
    "planoIntegradoAbacatePay": true,
    "planoIsTrial": false,
    "abacateProductId": "prod_abc123",
    "abacateStatus": "ACTIVE",
    "planoCreatedat": "2025-06-16T10:00:00Z"
  }
}
```

> Se `integradoAbacatePay` for `false`, `abacateProductId`/`abacateStatus` ficam `null` e nenhuma chamada é feita à AbacatePay.
> Se a AbacatePay não estiver configurada (`ApiKey` ausente) em um plano com `integradoAbacatePay: true`, o plano é salvo com `abacateProductId: null`. Checkouts falharão até sincronização manual.

**Resposta 400 — já existe plano de teste**
```json
{ "sucesso": false, "mensagem": "Já existe um plano de teste configurado. Edite ou remova o plano existente antes de criar outro.", "dados": null }
```

> Só pode existir um plano com `ehPlanoTeste: true` no sistema (índice único parcial no banco).

---

### PUT /api/plano/Atualizar

Atualiza nome, descrição, preço, status ativo e os limites de usuário/conexão. Atualização **apenas local** — não reflete na AbacatePay. Alterações de preço só valem para novas assinaturas.

```http
PUT /api/plano/Atualizar
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "planoId": 1,
  "nome": "Starter Plus",
  "descricao": "Até 5 usuários",
  "preco": 247.00,
  "ativo": true,
  "limiteUsuario": 5,
  "limiteConexao": 2
}
```

> `ehPlanoTeste` e `integradoAbacatePay` **não podem ser alterados** por este endpoint — mudar a integração com a AbacatePay ou a flag de trial depois que o plano já foi criado é uma operação delicada (produtos já criados na AbacatePay, assinaturas em andamento apontando para o plano) e está fora do escopo deste endpoint.

**Resposta 200**
```json
{ "sucesso": true, "mensagem": "Plano atualizado com sucesso.", "dados": null }
```

---

### DELETE /api/plano/Remover/{id}

Soft delete do plano no banco e exclusão de ambos os produtos na AbacatePay, caso existam (produto CARD e produto PIX avulso). Assinaturas existentes não são canceladas automaticamente.

```http
DELETE /api/plano/Remover/1
Authorization: Bearer <token>
```

**Resposta 200**
```json
{ "sucesso": true, "mensagem": "Plano removido com sucesso.", "dados": null }
```

---

## Limite de Usuário e Conexão por Plano

Os limites configurados no plano (`planoLimiteUsuario`/`planoLimiteConexao`) são aplicados pelo `ILimitePlanoService` em três pontos do sistema:

| Onde é validado | Quando |
|------------------|--------|
| `POST /api/usuario/CriarUsuario` | Antes de criar um novo usuário — bloqueia se a empresa já atingiu `planoLimiteUsuario` |
| `POST /api/conexaoplataforma/Criar` e `CriarComPermissao` | Antes de criar uma nova conexão — bloqueia se a empresa já atingiu `planoLimiteConexao` **para aquela plataforma** (contagem independente por plataforma) |
| `POST /api/assinatura/CriarCheckout`, `CriarCheckoutPix` e `PATCH /api/assinatura/TrocarPlano` | Antes de contratar/trocar para um plano — bloqueia se a empresa já está **acima** do limite do plano de destino |

**Resposta 400 — limite de usuário atingido**
```json
{ "sucesso": false, "mensagem": "Limite de usuários do plano \"Starter\" atingido (3 usuários). Faça upgrade do plano para adicionar mais usuários.", "dados": null }
```

**Resposta 400 — limite de conexão atingido**
```json
{ "sucesso": false, "mensagem": "Limite de conexões do plano \"Starter\" atingido (1 conexões por plataforma). Faça upgrade do plano para adicionar mais conexões.", "dados": null }
```

**Resposta 400 — troca de plano bloqueada por excedente**
```json
{ "sucesso": false, "mensagem": "Não é possível mudar para este plano: a empresa possui 5 usuários, mas o plano \"Starter\" permite no máximo 3. Remova o excedente antes de trocar de plano.", "dados": null }
```

> `null` em `planoLimiteUsuario`/`planoLimiteConexao` significa **sem limite**. Downgrades/trocas só são bloqueados no momento da troca — não há remoção retroativa de usuários/conexões de quem já está acima do limite de um plano vigente.

**Resposta 400 — empresa sem plano ativo (estado inconsistente)**
```json
{ "sucesso": false, "mensagem": "Empresa não possui um plano ativo. Contate o suporte.", "dados": null }
```

---

## Plano de Teste (Trial)

- O plano de teste é um `Plano` real, criado pelo admin GBCode via `POST /api/plano/Criar` com `ehPlanoTeste: true` e `integradoAbacatePay: false`.
- **Não aparece** em `GET /api/assinatura/PlanosDisponiveis` e é **rejeitado** explicitamente em `CriarCheckout`/`CriarCheckoutPix`/`TrocarPlano`:

**Resposta 400 — tentativa de contratar o plano de teste**
```json
{ "sucesso": false, "mensagem": "O plano de teste não pode ser contratado diretamente.", "dados": null }
```

- Ao ativar o trial para uma empresa (onboarding), o sistema cria uma `Assinatura` apontando para o plano de teste com `assinaturaStatus: "TRIAL"`, `assinaturaExpiraEm` = hoje + 15 dias, e sem `AbacateSubscriptionId` real (usa um identificador sintético local, prefixo `trial_`).
- **Cadastro obrigatório:** o admin GBCode precisa criar o plano de teste **antes** de qualquer novo onboarding — sem ele, a ativação do trial retorna erro.
