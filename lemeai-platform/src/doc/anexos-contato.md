# Anexos de Contato

Documentação dos endpoints para gerenciamento de anexos vinculados a contatos.

O sistema é **multi-tenant**: o `branchId` é extraído automaticamente do token JWT em todos os endpoints. Nenhum campo de tenant precisa ser enviado pelo cliente.

---

## Endpoints

### 1. Adicionar anexo a um contato via conversa

**`POST /api/Chat/Conversas/{idConversa}/AdicionarAnexoContato`**

Faz upload de um arquivo e o vincula ao contato da conversa informada. O `ContactId` é resolvido internamente a partir da conversa.

**Autenticação:** Bearer token obrigatório.

**Content-Type:** `multipart/form-data`

#### Parâmetros de rota

| Campo       | Tipo  | Descrição          |
|-------------|-------|--------------------|
| idConversa  | `int` | ID da conversa     |

#### Body (form-data)

| Campo     | Tipo     | Obrigatório | Descrição                                                                 |
|-----------|----------|-------------|---------------------------------------------------------------------------|
| Arquivo   | `file`   | Sim         | Arquivo a ser salvo                                                       |
| TipoAnexo | `string` | Sim         | Tipo do arquivo. Valores: `image`, `audio`, `video`, `documento`, `outros` |

#### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Anexo adicionado com sucesso.",
  "dados": {
    "id": 1,
    "caminho": "Imagem/2025-04-25/a1b2c3d4.jpg"
  }
}
```

#### Respostas de erro

| Status | Mensagem |
|--------|----------|
| `400`  | `"Arquivo não enviado."` |
| `400`  | `"Conversa não encontrada."` |
| `400`  | `"A conversa não possui um contato vinculado."` |
| `400`  | `"Erro ao adicionar o anexo, tente novamente."` |

---

### 2. Listar anexos por conversa

**`GET /api/Chat/Conversas/{idConversa}/AnexosContato`**

Retorna todos os anexos do contato vinculado à conversa. Inclui anexos adicionados por qualquer outra conversa do mesmo contato.

**Autenticação:** Bearer token obrigatório.

#### Parâmetros de rota

| Campo       | Tipo  | Descrição      |
|-------------|-------|----------------|
| idConversa  | `int` | ID da conversa |

#### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Anexos encontrados com sucesso.",
  "dados": [
    {
      "id": 1,
      "conversaId": 42,
      "caminhoAnexo": "Imagem/2025-04-25/a1b2c3d4.jpg",
      "tipoAnexo": "image"
    },
    {
      "id": 2,
      "conversaId": 55,
      "caminhoAnexo": "Documento/2025-04-25/b5c6d7e8.pdf",
      "tipoAnexo": "documento"
    }
  ]
}
```

#### Respostas de erro

| Status | Mensagem |
|--------|----------|
| `400`  | `"Conversa não encontrada."` |
| `400`  | `"A conversa não possui um contato vinculado."` |
| `400`  | `"Erro ao buscar os anexos, tente novamente."` |

---

### 3. Listar anexos por contato

**`GET /api/Contato/{contatoId}/Anexos`**

Retorna todos os anexos de um contato, independentemente da conversa de origem.

**Autenticação:** Bearer token obrigatório.

#### Parâmetros de rota

| Campo      | Tipo  | Descrição     |
|------------|-------|---------------|
| contatoId  | `int` | ID do contato |

#### Resposta de sucesso `200`

```json
{
  "sucesso": true,
  "mensagem": "Anexos encontrados com sucesso.",
  "dados": [
    {
      "id": 1,
      "conversaId": 42,
      "caminhoAnexo": "Imagem/2025-04-25/a1b2c3d4.jpg",
      "tipoAnexo": "image"
    }
  ]
}
```

#### Respostas de erro

| Status | Mensagem |
|--------|----------|
| `400`  | `"Erro ao buscar os anexos, tente novamente."` |

---

### 4. Obter arquivo bruto por ID

**`GET /api/Chat/Anexos/{idAnexo}/Arquivo`**

**`GET /api/Contato/Anexos/{idAnexo}/Arquivo`**

Retorna o binário do arquivo para renderização direta no front-end (imagem, PDF, vídeo, etc.). O `Content-Type` da resposta é definido automaticamente pela extensão do arquivo.

**Autenticação:** Bearer token obrigatório.

#### Parâmetros de rota

| Campo    | Tipo  | Descrição    |
|----------|-------|--------------|
| idAnexo  | `int` | ID do anexo  |

#### Resposta de sucesso `200`

Binário do arquivo com `Content-Type` correspondente.

| Extensão           | Content-Type retornado                                                    |
|--------------------|---------------------------------------------------------------------------|
| `.jpg` / `.jpeg`   | `image/jpeg`                                                              |
| `.png`             | `image/png`                                                               |
| `.webp`            | `image/webp`                                                              |
| `.pdf`             | `application/pdf`                                                         |
| `.mp4`             | `video/mp4`                                                               |
| `.ogg`             | `audio/ogg`                                                               |
| `.mp3`             | `audio/mpeg`                                                              |
| `.doc`             | `application/msword`                                                      |
| `.docx`            | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| outros             | `application/octet-stream`                                                |

#### Respostas de erro

| Status | Mensagem |
|--------|----------|
| `404`  | `"Anexo não encontrado."` |
| `404`  | `"Arquivo não encontrado no servidor."` |
| `400`  | `"Erro ao obter o arquivo, tente novamente."` |

---

## Objetos de resposta

### `ContatoAnexoResponseDTO`

Retornado nos endpoints de listagem (itens do array `dados`).

| Campo        | Tipo     | Descrição                          |
|--------------|----------|------------------------------------|
| id           | `int`    | ID do anexo                        |
| conversaId   | `int`    | ID da conversa que gerou o upload  |
| caminhoAnexo | `string` | Caminho relativo do arquivo salvo  |
| tipoAnexo    | `string` | Tipo informado no upload           |

### `GenericResponseDTO`

Envelope padrão de todas as respostas da API.

| Campo    | Tipo      | Descrição                              |
|----------|-----------|----------------------------------------|
| sucesso  | `boolean` | `true` em caso de sucesso              |
| mensagem | `string`  | Descrição do resultado                 |
| dados    | `object`  | Payload da resposta (pode ser `null`)  |

---

## Armazenamento de arquivos

Os arquivos são salvos localmente no servidor sob o caminho configurado em `LocalMidias:BasePath` (ex: `LemeIA_Uploads`). A estrutura de pastas segue o padrão:

```
{BasePath}/{TipoAnexo}/{yyyy-MM-dd}/{guid}.{extensao}
```

Exemplo: `LemeIA_Uploads/Imagem/2025-04-25/a1b2c3d4-e5f6-....jpg`

O caminho relativo (`Imagem/2025-04-25/a1b2c3d4.jpg`) é o valor persistido no banco de dados no campo `PathAttachment`.
