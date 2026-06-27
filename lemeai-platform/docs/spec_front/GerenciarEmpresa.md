# GerenciarEmpresa — Documentação de Endpoints

Base URL: `/api/gerenciarempresa`

Todos os endpoints requerem autenticação via Bearer Token (`Authorization: Bearer <token>`).
`empresaId` é extraído automaticamente do token JWT (`ObterEmpresaId()`) — nunca enviado pelo client.

---

## GET `/api/gerenciarempresa/DadosGerais`

Retorna os dados gerais (nome, ramo de atividade, CNPJ e logo) da empresa do usuário autenticado.

**Request:** sem body.

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Dados encontrado com sucesso",
  "dados": {
    "nomeEmpresa": "Clínica Saúde Plena",
    "ramoAtividade": "Saúde e Bem-estar",
    "cnpj": "12345678000199",
    "pathLogo": "logos-empresa/2026-06-20/logo-clinica.png"
  }
}
```

**Response 400 (erro inesperado / empresa não encontrada):**
```json
{
  "sucesso": false,
  "mensagem": "Empresa não encontrada.",
  "dados": null
}
```

> `pathLogo` é o caminho relativo do arquivo salvo no servidor. Quando a empresa ainda não possui logo, o campo retorna string vazia (`""`).

---

## PUT `/api/gerenciarempresa/AtualizarDadosGerais`

Atualiza os dados gerais (nome, ramo de atividade e CNPJ) da empresa do usuário autenticado. Não altera a logo — use `PUT /api/gerenciarempresa/Logo` para isso.

**Request Body:**
```json
{
  "nomeEmpresa": "Clínica Saúde Plena",
  "ramoAtividade": "Saúde e Bem-estar",
  "cnpj": "12345678000199"
}
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Dados atualizados com sucesso",
  "dados": null
}
```

**Response 400 (empresa não encontrada / erro inesperado):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao atualizar dados gerais da empresa.",
  "dados": null
}
```

---

## GET `/api/gerenciarempresa/DiasUteis`

Retorna a configuração de dias úteis (quais dias da semana a empresa atende) usada para cálculo de SLA/agendamentos.

**Request:** sem body.

**Response 200 (configuração já cadastrada):**
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

**Response 200 (sem configuração cadastrada ainda — retorna padrão Seg–Sex):**
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

**Response 400 (erro inesperado):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao buscar configuração de dias úteis.",
  "dados": null
}
```

---

## PUT `/api/gerenciarempresa/DiasUteis`

Cria ou atualiza a configuração de dias úteis da empresa.

**Request Body:**
```json
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

**Response 200:**
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

**Response 400 (erro inesperado):**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao atualizar configuração de dias úteis.",
  "dados": null
}
```

---

## PUT `/api/gerenciarempresa/Logo`

Atualiza a logo da empresa. Recebe a imagem via `multipart/form-data`, salva o arquivo no servidor (pasta `logos-empresa/`) e atualiza o campo `PathLogo` da empresa (`Branch`). Caso já exista uma logo anterior, o arquivo físico antigo é removido do servidor.

**Regras:**
- Formatos aceitos: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Tamanho máximo: 5MB.

**Request:** `multipart/form-data`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|--------------|-----------|
| `logo` | `file` | Sim | Arquivo de imagem da logo |

Exemplo (`curl`):
```bash
curl -X PUT "https://api.lemeia.com.br/api/gerenciarempresa/Logo" \
  -H "Authorization: Bearer <token>" \
  -F "logo=@/caminho/local/nova-logo.png"
```

**Response 200:**
```json
{
  "sucesso": true,
  "mensagem": "Logo atualizada com sucesso.",
  "dados": {
    "caminhoRelativo": "logos-empresa/2026-06-20/nova-logo.png"
  }
}
```

**Response 400 — nenhum arquivo enviado:**
```json
{
  "sucesso": false,
  "mensagem": "Nenhum arquivo enviado.",
  "dados": null
}
```

**Response 400 — formato inválido:**
```json
{
  "sucesso": false,
  "mensagem": "Formato inválido. Use JPG, PNG ou WebP.",
  "dados": null
}
```

**Response 400 — arquivo maior que 5MB:**
```json
{
  "sucesso": false,
  "mensagem": "A imagem deve ter no máximo 5MB.",
  "dados": null
}
```

**Response 400 — empresa não encontrada / erro inesperado:**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao atualizar logo da empresa.",
  "dados": null
}
```
