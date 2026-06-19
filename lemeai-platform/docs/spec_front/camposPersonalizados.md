# Campos Personalizados — Documentação de Endpoints

Implementa o modelo EAV de campos personalizados por empresa, descrito em [campos-personalizados/especificacao.md](../campos-personalizados/especificacao.md). Duas controllers:

- `CampoPersonalizadoController` — CRUD da **definição** dos campos (nome, tipo, opções, obrigatoriedade, ordem).
- `CampoPersonalizadoValorController` — leitura e preenchimento dos **valores** desses campos para uma conversa específica.

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`). `empresaId` é extraído automaticamente do token JWT (claim `empresaId`) — nunca enviado pelo client.

**Enum `TipoCampoPersonalizadoEnum`:**

| Valor | Tipo | Formato esperado |
|---|---|---|
| `1` | Texto | qualquer string |
| `2` | Numero | `decimal.TryParse` |
| `3` | Data | `DateTime.TryParse` (ISO 8601 recomendado) |
| `4` | Booleano | `"true"` / `"false"` |
| `5` | Selecao | deve estar contido na lista `Opcoes` do campo |

---

## CampoPersonalizadoController

Base URL: `/api/campopersonalizado`

### GET `/api/campopersonalizado/BuscarTodos`

Lista os campos personalizados **ativos** (não deletados) da empresa logada, ordenados por `Ordem`.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Campos personalizados encontrados.",
  "dados": [
    {
      "campoPersonalizadoId": 3,
      "nome": "Origem do Lead",
      "chave": "origem_do_lead",
      "tipo": 5,
      "opcoes": ["Indicação", "Instagram", "Site"],
      "obrigatorio": true,
      "ordem": 1
    },
    {
      "campoPersonalizadoId": 7,
      "nome": "Data de Retorno",
      "chave": "data_de_retorno",
      "tipo": 3,
      "opcoes": null,
      "obrigatorio": false,
      "ordem": 2
    }
  ]
}
```

---

### GET `/api/campopersonalizado/BuscarPorId/{id}`

Busca um campo personalizado específico. Retorna erro se o campo não existir ou não pertencer à empresa do token.

**Response 200:** mesmo formato de item do `BuscarTodos`.

**Response 400 — não encontrado/não autorizado:**
```json
{ "sucesso": false, "mensagem": "Campo personalizado não encontrado.", "dados": null }
```

---

### POST `/api/campopersonalizado/Criar`

Cria um novo campo personalizado para a empresa logada. A `chave` é gerada automaticamente a partir do `nome` (lowercase, sem acento, espaços → `_`) e deve ser única por empresa entre os campos ativos.

**Regras:**
- Se `tipo = 5` (Selecao), `opcoes` é obrigatório e não pode ser vazio.
- Nome duplicado (mesma chave gerada) entre campos ativos da empresa é rejeitado.

**Request:**
```json
{
  "nome": "Origem do Lead",
  "tipo": 5,
  "opcoes": ["Indicação", "Instagram", "Site"],
  "obrigatorio": true,
  "ordem": 1
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Campo personalizado criado com sucesso.",
  "dados": {
    "campoPersonalizadoId": 3,
    "nome": "Origem do Lead",
    "chave": "origem_do_lead",
    "tipo": 5,
    "opcoes": ["Indicação", "Instagram", "Site"],
    "obrigatorio": true,
    "ordem": 1
  }
}
```

**Response 400 — campo Seleção sem opções:**
```json
{ "sucesso": false, "mensagem": "É necessário informar as opções para campos do tipo Seleção.", "dados": null }
```

**Response 400 — nome/chave duplicado:**
```json
{ "sucesso": false, "mensagem": "Já existe um campo personalizado com este nome.", "dados": null }
```

---

### PUT `/api/campopersonalizado/Atualizar`

Atualiza nome, tipo, opções, obrigatoriedade ou ordem de um campo. Se o `nome` mudar, a `chave` é regerada e revalidada (ignorando o próprio id na checagem de unicidade).

**Request:**
```json
{
  "campoPersonalizadoId": 3,
  "nome": "Origem do Contato",
  "tipo": 5,
  "opcoes": ["Indicação", "Instagram", "Site", "Google Ads"],
  "obrigatorio": true,
  "ordem": 1
}
```

**Response 200:**
```json
{ "sucesso": true, "mensagem": "Campo personalizado atualizado com sucesso.", "dados": null }
```

**Response 400 — não pertence à empresa:**
```json
{ "sucesso": false, "mensagem": "Acesso não autorizado.", "dados": null }
```

---

### DELETE `/api/campopersonalizado/Remover/{id}`

Remove (soft delete) um campo personalizado. Valores já preenchidos em conversas **não são apagados** — apenas o campo deixa de aparecer em `BuscarTodos` e no formulário de preenchimento (`BuscarPorConversa`).

**Response 200:**
```json
{ "sucesso": true, "mensagem": "Campo personalizado removido com sucesso.", "dados": null }
```

---

## CampoPersonalizadoValorController

Base URL: `/api/campopersonalizadovalor`

### GET `/api/campopersonalizadovalor/BuscarPorConversa/{conversaId}`

Lista **todos os campos ativos** da empresa, cada um já acompanhado do valor preenchido para a conversa informada (ou `null` se ainda não preenchido). Valida que a conversa pertence à empresa do token antes de buscar.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Valores encontrados.",
  "dados": [
    {
      "campoPersonalizadoId": 3,
      "nome": "Origem do Lead",
      "chave": "origem_do_lead",
      "tipo": 5,
      "opcoes": ["Indicação", "Instagram", "Site"],
      "obrigatorio": true,
      "ordem": 1,
      "valor": "Instagram"
    },
    {
      "campoPersonalizadoId": 7,
      "nome": "Data de Retorno",
      "chave": "data_de_retorno",
      "tipo": 3,
      "opcoes": null,
      "obrigatorio": false,
      "ordem": 2,
      "valor": null
    }
  ]
}
```

**Response 400 — conversa não encontrada/não autorizada:**
```json
{ "sucesso": false, "mensagem": "Conversa não encontrada.", "dados": null }
```

---

### PUT `/api/campopersonalizadovalor/PreencherValores/{conversaId}`

Preenche/atualiza em **lote** os valores dos campos personalizados de uma conversa (upsert por `CampoPersonalizadoId`). Todo item é validado (existência/posse do campo, obrigatoriedade, formato de acordo com o `Tipo`) **antes** de qualquer gravação — se um único item for inválido, nada é salvo.

Para autosave de um único campo, basta enviar a lista `valores` com um único item.

**Request:**
```json
{
  "valores": [
    { "campoPersonalizadoId": 3, "valor": "Instagram" },
    { "campoPersonalizadoId": 7, "valor": "2026-06-25" }
  ]
}
```

**Response 200:**
```json
{ "sucesso": true, "mensagem": "Valores preenchidos com sucesso.", "dados": null }
```

**Response 400 — campo obrigatório vazio:**
```json
{ "sucesso": false, "mensagem": "O campo \"Origem do Lead\" é obrigatório.", "dados": null }
```

**Response 400 — formato inválido:**
```json
{ "sucesso": false, "mensagem": "O valor informado para o campo \"Data de Retorno\" é inválido.", "dados": null }
```

---

## Uso a partir de outros fluxos

`ICampoPersonalizadoValorService` expõe `ValidarValores(List<CampoPersonalizadoValorItem>, int empresaId)` para que outros services validem campos personalizados **antes** de criar um recurso, sem duplicar a lógica de validação de formato/obrigatoriedade. É o caso de `POST /api/oportunidadevenda/Criar` (ver [oportunidadeVenda.md](oportunidadeVenda.md)), que valida `camposPersonalizados` antes de criar o Contato/Conversa e só preenche os valores (via `PreencherValores`) depois da conversa já existir.
