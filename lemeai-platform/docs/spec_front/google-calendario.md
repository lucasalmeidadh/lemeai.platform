# Google Calendar — Documentação de Endpoints

Cobre os dois controllers envolvidos na integração e sincronização com o Google Calendar:

- **`CalendarioGoogleController`** (`/api/CalendarioGoogle`) — OAuth2, CRUD de eventos no Google e desconexão de conta.
- **`AgendaController`** (`/api/Agenda`) — CRUD da Agenda interna do CRM, agora com propagação automática para o Google e botão de reconciliação ("Sincronizar").

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).
`empresaId` (multi-tenancy) e `usuarioId` são extraídos automaticamente do token JWT — nunca recebidos por parâmetro.

Todas as respostas seguem o envelope padrão `GenericResponseDTO`:

```json
{
  "sucesso": true,
  "mensagem": "...",
  "dados": { }
}
```

---

## CalendarioGoogleController — `/api/CalendarioGoogle`

### GET `/api/CalendarioGoogle/Autenticar/Google`

Gera a URL de consentimento OAuth2 do Google para o usuário conectar sua conta. O front-end deve redirecionar o navegador (ou abrir um popup) para a URL retornada.

**Query params:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `redirectUri` | `string` | sim | URL para a qual o Google deve redirecionar após o consentimento (deve estar cadastrada no Google Cloud Console) |

**Request:** sem body.

```http
GET /api/CalendarioGoogle/Autenticar/Google?redirectUri=https%3A%2F%2Fapp.lemeia.com%2Fintegracoes%2Fgoogle%2Fcallback
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "URL gerada com sucesso",
  "dados": "https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=...&access_type=offline&approval_prompt=force&client_id=...&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar&response_type=code"
}
```

**Response 400 (`redirectUri` ausente):**
```json
"redirectUri é obrigatório"
```

---

### POST `/api/CalendarioGoogle/Autenticar/Callback`

Troca o `code` retornado pelo Google (após o consentimento) por `access_token`/`refresh_token` e salva (ou atualiza) o vínculo da conta Google com o usuário logado.

**Body:**
```json
{
  "code": "4/0AfH6SMDx...",
  "redirectUri": "https://app.lemeia.com/integracoes/google/callback"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `code` | `string` | sim | Código de autorização retornado pelo Google na query string do `redirectUri` |
| `redirectUri` | `string` | sim | Deve ser **idêntico** ao usado na chamada de `Autenticar/Google` |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Tokens salvos com sucesso",
  "dados": null
}
```

**Response 400 (`code`/`redirectUri` ausentes):**
```json
"Code e RedirectUri são obrigatórios."
```

**Response 400 (código inválido/expirado):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao obter tokens da Google",
  "dados": null
}
```

---

### DELETE `/api/CalendarioGoogle/Desconectar`

Revoga o `refresh_token` no Google e remove o registro local (`UsuarioGoogleToken`) do usuário logado. Idempotente — se o usuário já não tiver token salvo, retorna sucesso sem erro. Não altera nenhum registro da Agenda: compromissos com `googleEventId` já preenchido permanecem como estão e só voltam a sincronizar se o usuário reconectar a conta.

**Request:** sem body.

```http
DELETE /api/CalendarioGoogle/Desconectar
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Conta Google desconectada com sucesso.",
  "dados": null
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao desconectar a conta Google, tente novamente!",
  "dados": null
}
```

---

### POST `/api/CalendarioGoogle/Criar`

Cria um evento diretamente no Google Calendar do usuário. Opcionalmente cria um registro espelho na Agenda interna, vinculado a um contato do CRM.

**Pré-requisito:** o usuário precisa ter conectado a conta Google (`Autenticar/Google` → `Autenticar/Callback`). Caso contrário, retorna erro.

**Body:**
```json
{
  "titulo": "Call de fechamento - Lead Beta",
  "descricao": "Confirmar valores e fechar contrato",
  "inicio": "2026-06-26T10:00:00",
  "fim": "2026-06-26T10:30:00",
  "emailsConvidados": ["contato@beta.com"],
  "criarLinkMeet": true,
  "contatoId": 510,
  "sincronizarComAgenda": true
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `titulo` | `string` | sim | Título do evento |
| `descricao` | `string` | não | Descrição/observações do evento |
| `inicio` | `datetime` | sim | Data/hora de início |
| `fim` | `datetime` | sim | Data/hora de término |
| `emailsConvidados` | `string[]` | não | E-mails que receberão convite no Google |
| `criarLinkMeet` | `bool` | não | Se `true`, gera um link do Google Meet no evento |
| `contatoId` | `int?` | não | ID do contato do CRM a vincular. Se informado **e** `sincronizarComAgenda = true`, cria um registro espelho na Agenda interna |
| `sincronizarComAgenda` | `bool` | não (padrão `true`) | Controla se o espelho na Agenda deve ser criado quando `contatoId` é informado |

**Response 200** (evento criado, com espelho na Agenda):
```json
{
  "sucesso": true,
  "mensagem": "Evento criado com sucesso",
  "dados": {
    "id": "9q2h3k4l5m6n7o8p8f3kfh2j",
    "titulo": "Call de fechamento - Lead Beta",
    "descricao": "Confirmar valores e fechar contrato",
    "inicio": "2026-06-26T10:00:00",
    "fim": "2026-06-26T10:30:00",
    "emailsConvidados": ["contato@beta.com"],
    "linkMeet": "https://meet.google.com/abc-defg-hij",
    "criarLinkMeet": true,
    "agendaId": 932,
    "atualizadoEm": "2026-06-20T18:40:02.500Z",
    "cancelado": false
  }
}
```

> Se `contatoId` não for informado (ou `sincronizarComAgenda = false`), o evento é criado normalmente no Google, mas `agendaId` retorna `null` — nenhum espelho é criado na Agenda.

**Response 400 (usuário sem Google conectado, ou erro na API do Google):**
```json
{
  "sucesso": false,
  "mensagem": "Ocorreu um erro ao criar evento no Google Calendar, tente novamente!",
  "dados": null
}
```

---

### GET `/api/CalendarioGoogle/BuscarTodas`

Lista os eventos do Google Calendar do usuário logado em um período. Usado junto com `GET /api/Agenda/BuscarTodos` pelo front-end para montar a visão combinada dos dois calendários.

**Query params:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `dataInicio` | `datetime?` | não | Início do período (se omitido, não filtra por início) |
| `dataFim` | `datetime?` | não | Fim do período (se omitido, não filtra por fim) |
| `incluirCancelados` | `bool` | não (padrão `false`) | Se `true`, inclui eventos cancelados (`status: "cancelled"`) no resultado — usado pela reconciliação |

```http
GET /api/CalendarioGoogle/BuscarTodas?dataInicio=2026-06-01T00:00:00&dataFim=2026-06-30T23:59:59
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Eventos listados com sucesso",
  "dados": [
    {
      "id": "8f3kfh2j9c9q2h3k4l5m6n7o8p",
      "titulo": "Reunião de apresentação - Cliente Acme",
      "descricao": "Apresentar proposta comercial",
      "inicio": "2026-06-25T14:00:00",
      "fim": "2026-06-25T15:00:00",
      "emailsConvidados": [],
      "linkMeet": null,
      "criarLinkMeet": false,
      "agendaId": 931,
      "atualizadoEm": "2026-06-20T18:32:11.123Z",
      "cancelado": false
    }
  ]
}
```

`agendaId` vem preenchido quando existe uma `Agenda` local vinculada a esse evento (via `googleEventId`); caso contrário vem `null`.

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Ocorreu um erro ao tentar listar eventos, tente novamente!",
  "dados": null
}
```

---

### GET `/api/CalendarioGoogle/BuscarPorId/{eventId}`

Consulta um evento específico do Google Calendar pelo seu `id`.

**Path param:** `eventId` (string) — id do evento no Google.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento consultado com sucesso",
  "dados": {
    "id": "8f3kfh2j9c9q2h3k4l5m6n7o8p",
    "titulo": "Reunião de apresentação - Cliente Acme",
    "descricao": "Apresentar proposta comercial",
    "inicio": "2026-06-25T14:00:00",
    "fim": "2026-06-25T15:00:00",
    "emailsConvidados": [],
    "linkMeet": null,
    "criarLinkMeet": false,
    "agendaId": 931,
    "atualizadoEm": "2026-06-20T18:32:11.123Z",
    "cancelado": false
  }
}
```

**Response 400 (evento não encontrado ou erro na API):**
```json
{
  "sucesso": false,
  "mensagem": "Ocorreu um erro ao consulta evento do Google Calendar",
  "dados": null
}
```

---

### PUT `/api/CalendarioGoogle/Atualizar/{eventId}`

Atualiza um evento existente no Google Calendar. Se houver uma `Agenda` local vinculada a esse `eventId` (via `googleEventId`), os campos espelhados nela (descrição, datas, detalhes) também são atualizados.

**Path param:** `eventId` (string).

**Body:**
```json
{
  "titulo": "Reunião de apresentação - Cliente Acme (remarcada)",
  "descricao": "Apresentar proposta comercial — nova data",
  "inicio": "2026-06-26T15:00:00",
  "fim": "2026-06-26T16:00:00",
  "emailsConvidados": [],
  "criarLinkMeet": false
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `titulo` | `string` | sim | Novo título do evento |
| `descricao` | `string` | não | Nova descrição |
| `inicio` | `datetime` | sim | Nova data/hora de início |
| `fim` | `datetime` | sim | Nova data/hora de término |
| `emailsConvidados` | `string[]` | não | Lista de convidados (substitui a lista anterior) |
| `criarLinkMeet` | `bool` | não | Se `false` e o evento já tinha link do Meet, o link é removido na atualização |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento atualizado com sucesso",
  "dados": null
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Ocorreu um erro ao atualizar evento, tente novamente!",
  "dados": null
}
```

---

### DELETE `/api/CalendarioGoogle/Deletar/{eventId}`

Remove um evento do Google Calendar. Se houver uma `Agenda` local vinculada a esse `eventId`, ela é removida (soft delete) também.

**Path param:** `eventId` (string).

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento deletado com sucesso",
  "dados": null
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Ocorreu um erro ao deletar evento, tente novamente!",
  "dados": null
}
```

---

## AgendaController — `/api/Agenda`

### GET `/api/Agenda/BuscarTodos`

Lista todos os compromissos da Agenda interna da empresa (não-deletados).

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Eventos encontrados.",
  "dados": [
    {
      "agendaId": 931,
      "descricao": "Reunião de apresentação - Cliente Acme",
      "dataInicio": "2026-06-25T14:00:00",
      "dataFim": "2026-06-25T15:00:00",
      "contatoId": 482,
      "detalhes": "Apresentar proposta comercial",
      "dataCriacao": "2026-06-20T18:32:10Z",
      "googleEventId": "8f3kfh2j9c9q2h3k4l5m6n7o8p",
      "sincronizadoGoogle": true
    }
  ]
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao buscar eventos.",
  "dados": null
}
```

---

### GET `/api/Agenda/BuscarPorId/{id}`

Busca um compromisso específico pelo `id`. Retorna erro se o compromisso pertencer a outra empresa.

**Path param:** `id` (int).

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento encontrado.",
  "dados": {
    "agendaId": 931,
    "descricao": "Reunião de apresentação - Cliente Acme",
    "dataInicio": "2026-06-25T14:00:00",
    "dataFim": "2026-06-25T15:00:00",
    "contatoId": 482,
    "detalhes": "Apresentar proposta comercial",
    "dataCriacao": "2026-06-20T18:32:10Z",
    "googleEventId": "8f3kfh2j9c9q2h3k4l5m6n7o8p",
    "sincronizadoGoogle": true
  }
}
```

**Response 400 (não encontrado ou de outra empresa):**
```json
{
  "sucesso": false,
  "mensagem": "Evento não encontrado.",
  "dados": null
}
```

---

### GET `/api/Agenda/EventosDoDia`

Retorna os compromissos de hoje que ainda não aconteceram (hora de início `>=` agora).

**Response 200:** mesmo formato de `BuscarTodos`, filtrado para o dia atual.

---

### GET `/api/Agenda/EventosProximoDia`

Retorna até 3 compromissos agendados para o dia seguinte (amanhã inteiro).

**Response 200:** mesmo formato de `BuscarTodos`, filtrado para amanhã.

---

### POST `/api/Agenda/Criar`

Cria um compromisso na Agenda interna. O responsável (`AgendaUsuarioId`) é sempre o usuário do token — nunca é enviado pelo front-end. Se `sincronizarGoogle: true` e o usuário tiver o Google Calendar conectado, o evento também é criado no Google e o `googleEventId` retornado é salvo no compromisso.

**Body:**
```json
{
  "descricao": "Reunião de apresentação - Cliente Acme",
  "dataInicio": "2026-06-25T14:00:00",
  "dataFim": "2026-06-25T15:00:00",
  "contatoId": 482,
  "detalhes": "Apresentar proposta comercial",
  "sincronizarGoogle": true
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `descricao` | `string` | sim | Título/descrição do compromisso |
| `dataInicio` | `datetime` | sim | Data/hora de início |
| `dataFim` | `datetime` | sim | Data/hora de término |
| `contatoId` | `int?` | não | Contato do CRM vinculado |
| `detalhes` | `string?` | não | Observações adicionais |
| `sincronizarGoogle` | `bool` | não (padrão `false`) | Se `true`, tenta propagar o compromisso para o Google Calendar do usuário |

**Response 200 (sincronizado com sucesso):**
```json
{
  "sucesso": true,
  "mensagem": "Evento criado com sucesso.",
  "dados": {
    "agendaId": 931,
    "descricao": "Reunião de apresentação - Cliente Acme",
    "dataInicio": "2026-06-25T14:00:00",
    "dataFim": "2026-06-25T15:00:00",
    "contatoId": 482,
    "detalhes": "Apresentar proposta comercial",
    "dataCriacao": "2026-06-20T18:32:10Z",
    "googleEventId": "8f3kfh2j9c9q2h3k4l5m6n7o8p",
    "sincronizadoGoogle": true
  }
}
```

> Se o usuário **não** tiver o Google Calendar conectado (mesmo enviando `sincronizarGoogle: true`), o backend **não retorna erro** — o compromisso é salvo normalmente apenas na Agenda interna, com `googleEventId: null` e `sincronizadoGoogle: false`. Isso evita que a falta de uma integração opcional bloqueie o fluxo principal de criação.

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao criar evento.",
  "dados": null
}
```

---

### PUT `/api/Agenda/Atualizar`

Atualiza um compromisso existente. Se o compromisso já tiver um `googleEventId` vinculado, o evento correspondente no Google também é atualizado automaticamente.

**Body:**
```json
{
  "agendaId": 931,
  "descricao": "Reunião de apresentação - Cliente Acme (remarcada)",
  "dataInicio": "2026-06-26T15:00:00",
  "dataFim": "2026-06-26T16:00:00",
  "contatoId": 482,
  "detalhes": "Nova data combinada com o cliente"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `agendaId` | `int` | sim | ID do compromisso a atualizar |
| `descricao` | `string` | sim | Título/descrição atualizado |
| `dataInicio` | `datetime` | sim | Nova data/hora de início |
| `dataFim` | `datetime` | sim | Nova data/hora de término |
| `contatoId` | `int?` | não | Contato vinculado |
| `detalhes` | `string?` | não | Observações adicionais |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento atualizado com sucesso.",
  "dados": null
}
```

**Response 400 (não encontrado, de outra empresa, ou erro):**
```json
{
  "sucesso": false,
  "mensagem": "Evento não encontrado.",
  "dados": null
}
```

---

### DELETE `/api/Agenda/Remover/{id}`

Remove (soft delete) um compromisso da Agenda interna. Se houver `googleEventId` vinculado, o evento correspondente também é removido do Google Calendar.

**Path param:** `id` (int).

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Evento removido com sucesso.",
  "dados": null
}
```

**Response 400:**
```json
{
  "sucesso": false,
  "mensagem": "Evento não encontrado.",
  "dados": null
}
```

---

### POST `/api/Agenda/Sincronizar`

Botão **"Sincronizar"** — reconcilia a Agenda interna com o Google Calendar do usuário em um período, cobrindo mudanças feitas **direto no Google** (fora da nossa UI): eventos criados, movidos ou cancelados pelo app do Google/Gmail.

**Pré-requisito:** o usuário precisa ter o Google Calendar conectado. Caso contrário, retorna erro.

**Algoritmo aplicado:**
1. Compromissos da Agenda sem `googleEventId` → são criados no Google.
2. Eventos do Google sem `Agenda` correspondente → criam um registro novo na Agenda (sem `contatoId`, pois o Google não tem esse dado).
3. Eventos com `status: "cancelled"` no Google que possuem `Agenda` vinculada → a `Agenda` é removida (soft delete).
4. Quando existe nos dois lados com dados diferentes (título/horário), **a alteração mais recente vence** — comparando `dataCriacao`/`updatedAt` da Agenda com o campo `updated` do Google.

**Body:**
```json
{
  "dataInicio": "2026-06-01T00:00:00",
  "dataFim": "2026-06-30T23:59:59"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `dataInicio` | `datetime` | sim | Início do período a reconciliar |
| `dataFim` | `datetime` | sim | Fim do período a reconciliar |

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Sincronização concluída.",
  "dados": {
    "eventosCriadosNoGoogle": 0,
    "eventosCriadosNaAgenda": 1,
    "eventosAtualizados": 0,
    "eventosRemovidos": 1
  }
}
```

Após a resposta, o front-end deve recarregar `GET /api/Agenda/BuscarTodos` e `GET /api/CalendarioGoogle/BuscarTodas` para refletir o resultado na tela.

**Response 400 (usuário sem Google conectado, ou erro durante a reconciliação):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao sincronizar a agenda, tente novamente!",
  "dados": null
}
```

---

## Resumo dos Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/CalendarioGoogle/Autenticar/Google` | Gera a URL de consentimento OAuth2 do Google |
| `POST` | `/api/CalendarioGoogle/Autenticar/Callback` | Troca o `code` por tokens e conecta a conta |
| `DELETE` | `/api/CalendarioGoogle/Desconectar` | Revoga o token e desconecta a conta Google |
| `POST` | `/api/CalendarioGoogle/Criar` | Cria evento no Google; espelha na Agenda se `contatoId` + `sincronizarComAgenda` |
| `GET` | `/api/CalendarioGoogle/BuscarTodas` | Lista eventos do Google em um período |
| `GET` | `/api/CalendarioGoogle/BuscarPorId/{eventId}` | Consulta um evento do Google |
| `PUT` | `/api/CalendarioGoogle/Atualizar/{eventId}` | Atualiza evento no Google; propaga para a Agenda vinculada |
| `DELETE` | `/api/CalendarioGoogle/Deletar/{eventId}` | Remove evento do Google; remove (soft delete) a Agenda vinculada |
| `GET` | `/api/Agenda/BuscarTodos` | Lista a Agenda interna |
| `GET` | `/api/Agenda/BuscarPorId/{id}` | Busca um compromisso da Agenda |
| `GET` | `/api/Agenda/EventosDoDia` | Compromissos de hoje que ainda não aconteceram |
| `GET` | `/api/Agenda/EventosProximoDia` | Até 3 compromissos de amanhã |
| `POST` | `/api/Agenda/Criar` | Cria compromisso; propaga para o Google se `sincronizarGoogle=true` |
| `PUT` | `/api/Agenda/Atualizar` | Atualiza compromisso; propaga para o Google se houver `googleEventId` |
| `DELETE` | `/api/Agenda/Remover/{id}` | Remove (soft delete) compromisso; remove o evento no Google se vinculado |
| `POST` | `/api/Agenda/Sincronizar` | Botão "Sincronizar" — reconciliação por período |
