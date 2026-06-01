# Conexão Instagram/Facebook pelo Cliente — OAuth Flow

> Descreve como o cliente (empresa usando o CRM) conecta sua conta Instagram/Facebook de forma autônoma pelo painel, sem precisar de suporte manual.

---

## Visão Geral do Fluxo

```
Cliente clica "Conectar Instagram"
        ↓
Popup do Facebook abre (SDK da Meta)
        ↓
Cliente autoriza as permissões
        ↓
Frontend recebe authorization code
        ↓
POST /api/instagram/conectar → backend
        ↓
Backend troca code por token de longa duração (60 dias)
        ↓
Backend busca as Páginas e contas Instagram do cliente
        ↓
Backend subscreve os webhooks automaticamente
        ↓
Backend salva IGID, PageId e token na Empresa
        ↓
Frontend exibe "Conectado: @conta_do_cliente ✓"
```

---

## Parte 1 — Frontend

### 1.1 Inicializar o SDK do Facebook

Carregar uma única vez na aplicação (ex: `index.html` ou no `App.tsx`):

```html
<script>
  window.fbAsyncInit = function () {
    FB.init({
      appId: 'SEU_APP_ID_AQUI',   // vem do backend via /api/config ou hardcoded
      version: 'v22.0',
      xfbml: true,
      status: true
    });
  };
</script>
<script async defer src="https://connect.facebook.net/pt_BR/sdk.js"></script>
```

> O `appId` é o ID do app Meta que já existe no projeto (mesmo do WhatsApp). Pode ser exposto via endpoint público `GET /api/config/meta-app-id`.

---

### 1.2 Botão "Conectar com Facebook/Instagram"

```jsx
function BotaoConectarInstagram({ empresaId, onSucesso }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  function conectar() {
    setErro(null);
    setCarregando(true);

    FB.login(
      async function (response) {
        if (!response.authResponse?.accessToken) {
          setErro('Conexão cancelada ou não autorizada.');
          setCarregando(false);
          return;
        }

        try {
          // Envia o token de curta duração para o backend trocar
          const resultado = await fetch('/api/instagram/conectar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${obterJWT()}`
            },
            body: JSON.stringify({
              tokenCurtaDuracao: response.authResponse.accessToken
            })
          });

          const dados = await resultado.json();

          if (dados.sucesso) {
            onSucesso(dados.dados); // passa as contas conectadas para o componente pai
          } else {
            setErro(dados.mensagem);
          }
        } catch (ex) {
          setErro('Erro ao conectar. Tente novamente.');
        } finally {
          setCarregando(false);
        }
      },
      {
        scope: [
          'instagram_basic',
          'instagram_manage_messages',
          'instagram_manage_comments',
          'pages_messaging',
          'pages_manage_metadata',
          'pages_show_list',
          'leads_retrieval',
          'ads_management'
        ].join(','),
        return_scopes: true
      }
    );
  }

  return (
    <div>
      <button onClick={conectar} disabled={carregando}>
        {carregando ? 'Conectando...' : 'Conectar com Facebook/Instagram'}
      </button>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
    </div>
  );
}
```

---

### 1.3 O que exibir após conectar

Quando o backend retornar sucesso, o `dados` conterá as páginas e contas conectadas:

```jsx
function ContasConectadas({ contas }) {
  return (
    <div>
      <h3>Contas conectadas</h3>
      {contas.map(conta => (
        <div key={conta.paginaId}>
          <p>📄 Página: <strong>{conta.paginaNome}</strong></p>
          {conta.instagramUsername && (
            <p>📸 Instagram: <strong>@{conta.instagramUsername}</strong></p>
          )}
          <p>✅ Webhooks ativos</p>
          <button onClick={() => desconectar(conta.paginaId)}>
            Desconectar
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

### 1.4 Verificar se já está conectado (ao carregar a tela)

```jsx
useEffect(() => {
  fetch(`/api/instagram/status`, {
    headers: { 'Authorization': `Bearer ${obterJWT()}` }
  })
    .then(r => r.json())
    .then(dados => {
      if (dados.sucesso && dados.dados?.conectado) {
        setContasConectadas(dados.dados.contas);
      }
    });
}, []);
```

---

## Parte 2 — Backend (o que criar)

### 2.1 Controller: `InstagramConexaoController`

Rota base: `/api/instagram`

```
POST /api/instagram/conectar     → recebe token, processa OAuth completo, salva na Empresa
GET  /api/instagram/status       → retorna se a empresa tem Instagram conectado e quais contas
DELETE /api/instagram/desconectar/{paginaId} → remove a página e cancela subscrição de webhook
```

---

### 2.2 Request/Response DTOs

```csharp
// Request
public class ConectarInstagramRequest
{
    public string TokenCurtaDuracao { get; set; } = null!;
}

// Response (dentro do GenericResponseDTO.Dados)
public class ContaConectadaResponse
{
    public string PaginaId { get; set; } = null!;
    public string PaginaNome { get; set; } = null!;
    public string? InstagramPageId { get; set; }    // IGID
    public string? InstagramUsername { get; set; }  // @handle
    public bool WebhooksAtivos { get; set; }
}
```

---

### 2.3 O que o backend faz no endpoint `POST /api/instagram/conectar`

Sequência completa de operações:

```
1. Receber tokenCurtaDuracao do frontend

2. Trocar por token de longa duração (60 dias)
   GET graph.facebook.com/v22.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={APP_ID}
     &client_secret={APP_SECRET}
     &fb_exchange_token={tokenCurtaDuracao}
   → retorna longLivedToken

3. Buscar todas as Páginas do Facebook do cliente
   GET graph.facebook.com/v22.0/me/accounts
     ?fields=id,name,access_token,instagram_business_account.fields(id,username)
   Authorization: Bearer {longLivedToken}
   → retorna lista de páginas com tokens individuais e IGID de cada uma

4. Para cada página:
   a. Subscrever página nos webhooks de mensagens
      POST graph.facebook.com/v22.0/{PAGE_ID}/subscribed_apps
        { "subscribed_fields": ["messages", "messaging_postbacks", "leadgen"] }
      Authorization: Bearer {pageAccessToken}

   b. Se tiver Instagram vinculado:
      Subscrever Instagram nos webhooks
      POST graph.facebook.com/v22.0/{IGID}/subscribed_apps
        { "subscribed_fields": ["messages", "messaging_referral", "comments"] }
      Authorization: Bearer {pageAccessToken}

5. Salvar na Empresa:
   - InstagramPageId = IGID (da primeira conta, ou a que o cliente escolheu)
   - TokenAPIInstagram = pageAccessToken
   - FacebookPageId = PAGE_ID
   - TokenAPIFacebook = pageAccessToken (pode ser o mesmo)
   - IsInstagramAPI = true

6. Retornar lista de contas conectadas para o frontend
```

---

### 2.4 Serviço de infraestrutura: `IConectarMetaContaService`

Seguindo o mesmo padrão do `CoexistenciaService` existente:

```csharp
// LemeIA.Domain/Services/IConectarMetaContaService.cs
public interface IConectarMetaContaService
{
    Task<string> TrocarTokenLongaDuracaoAsync(string tokenCurtaDuracao);
    Task<List<MetaPaginaDto>> BuscarPaginasDoUsuarioAsync(string longLivedToken);
    Task SubscreverPaginaWebhooksAsync(string paginaId, string paginaToken);
    Task SubscreverInstagramWebhooksAsync(string igid, string paginaToken);
}

public class MetaPaginaDto
{
    public string PaginaId { get; set; } = null!;
    public string PaginaNome { get; set; } = null!;
    public string PaginaToken { get; set; } = null!;
    public string? InstagramPageId { get; set; }   // IGID
    public string? InstagramUsername { get; set; }
}
```

```csharp
// LemeIA.Infraestrutura/Services/Meta/ConectarMetaContaService.cs
public class ConectarMetaContaService(
    HttpClient httpClient,
    IConfiguration config,
    ILogger<ConectarMetaContaService> logger) : IConectarMetaContaService
{
    public async Task<string> TrocarTokenLongaDuracaoAsync(string tokenCurto)
    {
        string appId = config["MetaApp:AppId"]!;
        string appSecret = config["MetaApp:AppSecret"]!;

        // Passo 1: curto → longo (60 dias)
        string url = $"https://graph.facebook.com/v22.0/oauth/access_token" +
                     $"?grant_type=fb_exchange_token" +
                     $"&client_id={appId}" +
                     $"&client_secret={appSecret}" +
                     $"&fb_exchange_token={tokenCurto}";

        var resp = await httpClient.GetAsync(url);

        if (!resp.IsSuccessStatusCode)
        {
            logger.LogError("Falha ao trocar token. Body: {Body}", await resp.Content.ReadAsStringAsync());
            throw new HttpRequestException("Falha ao obter token de longa duração da Meta.");
        }

        using var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("access_token").GetString()!;
    }

    public async Task<List<MetaPaginaDto>> BuscarPaginasDoUsuarioAsync(string longLivedToken)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get,
            "https://graph.facebook.com/v22.0/me/accounts" +
            "?fields=id,name,access_token,instagram_business_account.fields(id,username)");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", longLivedToken);

        var resp = await httpClient.SendAsync(req);
        resp.EnsureSuccessStatusCode();

        using var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var paginas = new List<MetaPaginaDto>();

        foreach (var el in json.RootElement.GetProperty("data").EnumerateArray())
        {
            var pagina = new MetaPaginaDto
            {
                PaginaId    = el.GetProperty("id").GetString()!,
                PaginaNome  = el.GetProperty("name").GetString()!,
                PaginaToken = el.GetProperty("access_token").GetString()!
            };

            if (el.TryGetProperty("instagram_business_account", out var ig))
            {
                pagina.InstagramPageId   = ig.TryGetProperty("id", out var igId) ? igId.GetString() : null;
                pagina.InstagramUsername = ig.TryGetProperty("username", out var igUser) ? igUser.GetString() : null;
            }

            paginas.Add(pagina);
        }

        return paginas;
    }

    public async Task SubscreverPaginaWebhooksAsync(string paginaId, string paginaToken)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://graph.facebook.com/v22.0/{paginaId}/subscribed_apps");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", paginaToken);
        req.Content = JsonContent.Create(new
        {
            subscribed_fields = new[] { "messages", "messaging_postbacks", "leadgen" }
        });

        var resp = await httpClient.SendAsync(req);
        if (!resp.IsSuccessStatusCode)
        {
            logger.LogError("Falha ao subscrever página {PaginaId}. Body: {Body}",
                paginaId, await resp.Content.ReadAsStringAsync());
            throw new HttpRequestException($"Falha ao subscrever página {paginaId} nos webhooks.");
        }
    }

    public async Task SubscreverInstagramWebhooksAsync(string igid, string paginaToken)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://graph.facebook.com/v22.0/{igid}/subscribed_apps");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", paginaToken);
        req.Content = JsonContent.Create(new
        {
            subscribed_fields = new[] { "messages", "messaging_referral", "comments" }
        });

        var resp = await httpClient.SendAsync(req);
        if (!resp.IsSuccessStatusCode)
        {
            logger.LogError("Falha ao subscrever Instagram {Igid}. Body: {Body}",
                igid, await resp.Content.ReadAsStringAsync());
            throw new HttpRequestException($"Falha ao subscrever Instagram {igid} nos webhooks.");
        }
    }
}
```

---

### 2.5 Application Service: `IInstagramConexaoService`

```csharp
// LemeIA.Application/Interfaces/Services/IInstagramConexaoService.cs
public interface IInstagramConexaoService
{
    Task<GenericResponseDTO> ConectarAsync(string tokenCurtaDuracao, int empresaId);
    GenericResponseDTO ObterStatus(int empresaId);
    Task<GenericResponseDTO> DesconectarAsync(string paginaId, int empresaId);
}
```

```csharp
// LemeIA.Application/Services/InstagramConexaoService.cs
public class InstagramConexaoService : IInstagramConexaoService
{
    private readonly IConectarMetaContaService _metaService;
    private readonly IEmpresaService _empresaService;
    private readonly IEmpresaRepositorio _empresaRepositorio;
    private readonly ILogger<InstagramConexaoService> _logger;

    public InstagramConexaoService(
        IConectarMetaContaService metaService,
        IEmpresaService empresaService,
        IEmpresaRepositorio empresaRepositorio,
        ILogger<InstagramConexaoService> logger)
    {
        _metaService = metaService;
        _empresaService = empresaService;
        _empresaRepositorio = empresaRepositorio;
        _logger = logger;
    }

    public async Task<GenericResponseDTO> ConectarAsync(string tokenCurtaDuracao, int empresaId)
    {
        try
        {
            var empresa = _empresaRepositorio.BuscarEmpresaPorId(empresaId);
            if (empresa == null)
                return GenericResponseDTO.Error("Empresa não encontrada.");

            // 1. Token de longa duração
            string longToken = await _metaService.TrocarTokenLongaDuracaoAsync(tokenCurtaDuracao);

            // 2. Páginas e contas Instagram
            var paginas = await _metaService.BuscarPaginasDoUsuarioAsync(longToken);
            if (!paginas.Any())
                return GenericResponseDTO.Error("Nenhuma Página do Facebook encontrada na conta.");

            var contasConectadas = new List<ContaConectadaResponse>();

            foreach (var pagina in paginas)
            {
                // 3. Subscrever webhooks da página
                await _metaService.SubscreverPaginaWebhooksAsync(pagina.PaginaId, pagina.PaginaToken);

                // 4. Subscrever webhooks do Instagram, se vinculado
                if (!string.IsNullOrEmpty(pagina.InstagramPageId))
                    await _metaService.SubscreverInstagramWebhooksAsync(pagina.InstagramPageId, pagina.PaginaToken);

                contasConectadas.Add(new ContaConectadaResponse
                {
                    PaginaId          = pagina.PaginaId,
                    PaginaNome        = pagina.PaginaNome,
                    InstagramPageId   = pagina.InstagramPageId,
                    InstagramUsername = pagina.InstagramUsername,
                    WebhooksAtivos    = true
                });
            }

            // 5. Salvar primeira conta na Empresa (ou a que tiver Instagram)
            var principalInstagram = paginas.FirstOrDefault(p => p.InstagramPageId != null) ?? paginas.First();

            empresa.InstagramPageId    = principalInstagram.InstagramPageId;
            empresa.TokenAPIInstagram  = principalInstagram.PaginaToken;
            empresa.IsInstagramAPI     = principalInstagram.InstagramPageId != null;
            empresa.FacebookPageId     = principalInstagram.PaginaId;
            empresa.TokenAPIFacebook   = principalInstagram.PaginaToken;
            empresa.BranchUpdatedAt    = DateTime.UtcNow;

            _empresaRepositorio.AtualizarEmpresa(empresa);
            _empresaService.AtualizarEmpresa(empresa); // invalida cache

            _logger.LogInformation("Instagram/Facebook conectado para EmpresaId {Id}. {N} conta(s).",
                empresaId, contasConectadas.Count);

            return GenericResponseDTO.Success("Conta(s) conectada(s) com sucesso.", contasConectadas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao conectar Instagram para EmpresaId {Id}", empresaId);
            return GenericResponseDTO.Error("Erro ao conectar. Verifique as permissões e tente novamente.");
        }
    }

    public GenericResponseDTO ObterStatus(int empresaId)
    {
        try
        {
            var empresa = _empresaService.BuscarEmpresaPorId(empresaId);
            if (empresa == null)
                return GenericResponseDTO.Error("Empresa não encontrada.");

            bool conectado = empresa.IsInstagramAPI == true && !string.IsNullOrEmpty(empresa.InstagramPageId);

            return GenericResponseDTO.Success("Status obtido.", new
            {
                conectado,
                contas = conectado ? new[]
                {
                    new ContaConectadaResponse
                    {
                        PaginaId        = empresa.FacebookPageId,
                        InstagramPageId = empresa.InstagramPageId,
                        WebhooksAtivos  = true
                    }
                } : Array.Empty<ContaConectadaResponse>()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter status Instagram para EmpresaId {Id}", empresaId);
            return GenericResponseDTO.Error("Erro ao obter status.");
        }
    }

    public async Task<GenericResponseDTO> DesconectarAsync(string paginaId, int empresaId)
    {
        try
        {
            var empresa = _empresaRepositorio.BuscarEmpresaPorId(empresaId);
            if (empresa == null)
                return GenericResponseDTO.Error("Empresa não encontrada.");

            // Limpar dados
            empresa.InstagramPageId   = null;
            empresa.TokenAPIInstagram = null;
            empresa.IsInstagramAPI    = false;
            empresa.FacebookPageId    = null;
            empresa.TokenAPIFacebook  = null;
            empresa.BranchUpdatedAt   = DateTime.UtcNow;

            _empresaRepositorio.AtualizarEmpresa(empresa);
            _empresaService.AtualizarEmpresa(empresa);

            return GenericResponseDTO.Success("Conta desconectada com sucesso.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao desconectar para EmpresaId {Id}", empresaId);
            return GenericResponseDTO.Error("Erro ao desconectar.");
        }
    }
}
```

---

### 2.6 Controller: `InstagramConexaoController`

```csharp
// LemeIA.WebAPI/Controllers/InstagramConexaoController.cs
[ApiController]
[Route("api/instagram")]
[Authorize]
public class InstagramConexaoController : BaseController
{
    private readonly IInstagramConexaoService _service;

    public InstagramConexaoController(IInstagramConexaoService service)
    {
        _service = service;
    }

    [HttpPost("conectar")]
    public async Task<IActionResult> Conectar([FromBody] ConectarInstagramRequest request)
    {
        int empresaId = ObterEmpresaId();
        var response = await _service.ConectarAsync(request.TokenCurtaDuracao, empresaId);
        return response.Sucesso ? Ok(response) : BadRequest(response);
    }

    [HttpGet("status")]
    public IActionResult ObterStatus()
    {
        int empresaId = ObterEmpresaId();
        var response = _service.ObterStatus(empresaId);
        return response.Sucesso ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("desconectar/{paginaId}")]
    public async Task<IActionResult> Desconectar(string paginaId)
    {
        int empresaId = ObterEmpresaId();
        var response = await _service.DesconectarAsync(paginaId, empresaId);
        return response.Sucesso ? Ok(response) : BadRequest(response);
    }
}
```

---

## Parte 3 — Validade do Token e Renovação

### 3.1 Problema: o token de longa duração expira em 60 dias

O token obtido via FB.login expira. Quando expirar, os webhooks param de funcionar (envio de resposta) mas o **recebimento continua** (a subscrição não expira). Só o envio de mensagens falha.

### 3.2 Solução: reautorização simples pelo painel

**Opção mais simples (recomendada para V1):** mostrar no painel do cliente um aviso quando o token estiver próximo de expirar.

```
Empresa.TokenAPIInstagramExpiresAt → salvar a data de expiração (DateTime.UtcNow.AddDays(60))
```

No frontend, ao carregar o status:
```jsx
// Se token expira em menos de 7 dias, mostrar alerta
if (dados.tokenExpiraEm && diasRestantes(dados.tokenExpiraEm) < 7) {
  mostrarAlerta('Sua conexão Instagram expira em breve. Clique aqui para renovar.');
}
```

O cliente clica no botão de renovar → mesmo fluxo de `FB.login()` → novo token → backend atualiza.

### 3.3 O que salvar no banco para controle

```sql
ALTER TABLE branch
  ADD COLUMN instagram_token_expires_at TIMESTAMP;  -- data de expiração do token
```

---

## Parte 4 — Campos novos na Empresa (resumo final)

```sql
ALTER TABLE branch
  ADD COLUMN instagram_page_id           VARCHAR(50),
  ADD COLUMN token_api_instagram         TEXT,
  ADD COLUMN is_instagram_api            BOOLEAN DEFAULT FALSE,
  ADD COLUMN facebook_page_id            VARCHAR(50),
  ADD COLUMN token_api_facebook          TEXT,
  ADD COLUMN is_lead_ads_active          BOOLEAN DEFAULT FALSE,
  ADD COLUMN instagram_token_expires_at  TIMESTAMP;
```

```csharp
// Empresa.cs — campos novos
public string? InstagramPageId { get; set; }
public string? TokenAPIInstagram { get; set; }
public bool? IsInstagramAPI { get; set; }
public string? FacebookPageId { get; set; }
public string? TokenAPIFacebook { get; set; }
public bool? IsLeadAdsActive { get; set; }
public DateTime? InstagramTokenExpiresAt { get; set; }
```

---

## Parte 5 — Arquivos novos para esta funcionalidade

| Arquivo | Camada |
|---------|--------|
| `Domain/Services/IConectarMetaContaService.cs` | Domain |
| `Domain/Model/MetaPaginaDto.cs` | Domain |
| `Application/DTO/Request/ConectarInstagramRequest.cs` | Application |
| `Application/DTO/Response/ContaConectadaResponse.cs` | Application |
| `Application/Interfaces/Services/IInstagramConexaoService.cs` | Application |
| `Application/Services/InstagramConexaoService.cs` | Application |
| `Infraestrutura/Services/Meta/ConectarMetaContaService.cs` | Infraestrutura |
| `WebAPI/Controllers/InstagramConexaoController.cs` | WebAPI |

Mais a extensão dos campos em `Empresa.cs`, `Branch.cs`, `AppDbContext.cs`, `BranchProfile.cs`.

---

## Parte 6 — Registro no Program.cs

```csharp
// Services
builder.Services.AddScoped<IInstagramConexaoService, InstagramConexaoService>();

// Infraestrutura (HttpClient tipado)
builder.Services.AddHttpClient<IConectarMetaContaService, ConectarMetaContaService>();
```

```json
// appsettings.json — já existem, confirmar que estão presentes
"MetaApp": {
  "AppId": "...",
  "AppSecret": "..."
}
```

---

## Fontes Consultadas

| Documento | URL |
|-----------|-----|
| Facebook JavaScript SDK — FB.login() | https://developers.facebook.com/docs/javascript/reference/FB.login/ |
| Facebook Login — Authorization Code Flow | https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/ |
| Trocar token de curta por longa duração | https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/ |
| GET /me/accounts — listar páginas do usuário | https://developers.facebook.com/docs/graph-api/reference/user/accounts/ |
| Subscrever página nos webhooks (`/subscribed_apps`) | https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps/ |
| Subscrever Instagram nos webhooks | https://developers.facebook.com/docs/instagram-platform/webhooks/ |
| Instagram Messaging API — enviar mensagem | https://developers.facebook.com/docs/instagram-messaging/ |
| Configurar webhook — Meta App Dashboard | https://developers.facebook.com/docs/graph-api/webhooks/getting-started/ |
| Setup Webhooks para Instagram Messaging (tutorial) | https://innocentanyaele.medium.com/setup-meta-webhooks-for-instagram-messaging-and-respond-to-message-4575bc95c7a2 |
| Coexistence WhatsApp (padrão base usado no projeto) | https://help.gohighlevel.com/support/solutions/articles/155000003417-whatsapp-coexistence-feature-for-dual-platform-messaging |
