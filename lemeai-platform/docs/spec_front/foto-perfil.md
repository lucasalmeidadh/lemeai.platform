# Foto de Perfil do Usuário

Documentação dos endpoints para upload, remoção e exibição da foto de perfil de cada usuário.

---

## Como funciona

- O arquivo é salvo no servidor em `{BasePath}/PerfilUsuario/user-{id}-{guid}.jpg`
- O banco armazena apenas o caminho relativo (`PerfilUsuario/user-42-abc.jpg`)
- A API retorna uma URL completa pronta para uso no `<img src>`
- A URL é servida pelo endpoint público `GET /api/media/{*path}` (já existente)
- Formatos aceitos: **JPG, JPEG, PNG, WebP**
- Tamanho máximo: **5MB**

---

## Endpoints

### 1. Upload / Atualização da foto

```
PUT /api/usuario/FotoPerfil
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `foto` | File | Arquivo de imagem (JPG, PNG ou WebP, máx 5MB) |

O usuário dono da foto é identificado automaticamente pelo token JWT — não é necessário enviar o `userId`.

Se o usuário já tiver uma foto, a anterior é deletada do servidor antes de salvar a nova.

**Resposta de sucesso (200):**

```json
{
  "sucesso": true,
  "mensagem": "Foto de perfil atualizada com sucesso.",
  "dados": {
    "photoUrl": "https://api.gbcode.com.br/api/media/PerfilUsuario/user-42-3f7a9c1b-e4d2-4f8a-b1c3-9e2d5f6a7b8c.jpg"
  }
}
```

**Erros possíveis:**

```json
{ "sucesso": false, "mensagem": "Nenhum arquivo enviado." }
{ "sucesso": false, "mensagem": "Formato inválido. Use JPG, PNG ou WebP." }
{ "sucesso": false, "mensagem": "A imagem deve ter no máximo 5MB." }
```

---

### 2. Remoção da foto

```
DELETE /api/usuario/FotoPerfil
Authorization: Bearer {token}
```

Remove a foto do servidor e limpa o campo no banco de dados.

**Resposta de sucesso (200):**

```json
{
  "sucesso": true,
  "mensagem": "Foto de perfil removida com sucesso.",
  "dados": null
}
```

**Erro:**

```json
{ "sucesso": false, "mensagem": "Usuário não possui foto de perfil." }
```

---

### 3. Obter dados do usuário logado (com photoUrl)

```
GET /api/auth/Me
Authorization: Bearer {token}
```

**Resposta (200):**

```json
{
  "id": "42",
  "email": "usuario@empresa.com",
  "nome": "João Silva",
  "role": "1",
  "tipoUsuarioDescricao": "Vendedor",
  "empresaDescricao": "Empresa XYZ",
  "permissoes": ["chat", "produto"],
  "photoUrl": "https://api.gbcode.com.br/api/media/PerfilUsuario/user-42-3f7a9c1b-e4d2-4f8a-b1c3-9e2d5f6a7b8c.jpg"
}
```

> `photoUrl` é `null` quando o usuário não possui foto de perfil.

---

## Como o front deve usar

### Upload da foto (React — exemplo com fetch)

```tsx
async function uploadFotoPerfil(arquivo: File) {
  const formData = new FormData();
  formData.append('foto', arquivo);

  const response = await fetch('/api/usuario/FotoPerfil', {
    method: 'PUT',
    credentials: 'include', // envia o cookie jwt-token
    body: formData,
    // NÃO definir Content-Type aqui — o browser define automaticamente com boundary
  });

  const data = await response.json();
  if (data.sucesso) {
    // data.dados.photoUrl é a URL da nova foto
    setPhotoUrl(data.dados.photoUrl);
  }
}
```

### Exibir a foto no componente

```tsx
function Avatar({ photoUrl }: { photoUrl: string | null }) {
  return (
    <img
      src={photoUrl ?? '/default-avatar.png'}
      alt="Foto de perfil"
      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
    />
  );
}
```

> A URL já é pública e pode ser usada diretamente no `src` — sem headers de autenticação necessários.

### Remover a foto

```tsx
async function removerFotoPerfil() {
  const response = await fetch('/api/usuario/FotoPerfil', {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await response.json();
  if (data.sucesso) {
    setPhotoUrl(null);
  }
}
```

### Carregar a foto ao entrar na plataforma

No login ou ao carregar o contexto do usuário, chame `GET /api/auth/Me` e salve `photoUrl` no estado global:

```tsx
async function carregarUsuario() {
  const response = await fetch('/api/auth/Me', { credentials: 'include' });
  const usuario = await response.json();

  setUsuario({
    nome: usuario.nome,
    email: usuario.email,
    photoUrl: usuario.photoUrl ?? null,
    permissoes: usuario.permissoes,
  });
}
```

---

## Migration necessária

O desenvolvedor deve gerar uma migration para:

1. **Renomear** a coluna `path_user_logo` para `path_user_photo` na tabela `users`
2. **Alterar** o tipo da coluna de `integer` para `text`

```bash
dotnet ef migrations add RenameAndFixPathUserPhoto \
  --project LemeIA.Infraestrutura \
  --startup-project LemeIA.WebAPI
```

> Como a coluna anterior era do tipo `int?` e nunca armazenou dados válidos (todos nulos), não há perda de dados.
