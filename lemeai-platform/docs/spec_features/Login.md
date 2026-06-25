# Login (Página de Autenticação)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A página de **Login** é o ponto de entrada principal do sistema, destinada a autenticar os usuários corporativos (atendentes, vendedores e administradores) para acessar o CRM. 
Além de autenticação de segurança básica, ela apresenta um design com foco em experiência do usuário, incluindo branding da Brik CRM, um "efeito máquina de escrever" com slogans de motivação de vendas e links rápidos para cadastro de novas contas.

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/Login.tsx`
- **Rotas:** `/` e `/login`
- **Variáveis de Ambiente:** Utiliza `VITE_API_URL` e `VITE_ENDPOINT_LOGIN` para determinar o destino da API de autenticação.
- **Autenticação e Sessão:** 
  1. Envia as credenciais (`email`, `password`) via `POST` para a API de login.
  2. Recebendo sucesso, executa uma chamada secundária via `GET` em `/api/Auth/Me` para recuperar os detalhes do usuário recém-autenticado.
  3. Armazena o objeto retornado de forma síncrona no `localStorage` sob a chave `user`.
- **Remember Me (Lembrar-me):** Salva o e-mail no `localStorage` (`rememberedEmail`) se o checkbox estiver marcado.
- **Redirecionamento Inteligente:** Usa navegação responsiva baseada em `window.innerWidth`.
  - Dispositivos Móveis (<= 768px): Redireciona para `/pipeline`.
  - Desktop: Redireciona para `/monitoramento`.
- **Efeitos e UI:** Usa Refs (`useRef`) e `setTimeout` acoplados ao React Lifecycle para renderizar o efeito nativo de digitação (`brand-typewriter`). Força a renderização local sempre em `light` theme temporariamente alterando o atributo `data-theme` do documento.

## 3. Componentes e Estrutura
Não chama componentes React externos da pasta `src/components/`, toda a estrutura (inputs e botões) é feita diretamente no HTML e estilizada por `Login.css`. Utiliza `react-icons/fa` para os ícones de input.

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `POST {endpointLogin}` (Autenticação base, espera cookies ou tokens via response).
  - `GET /api/Auth/Me` (Perfil do usuário autenticado).
- **Outras Páginas:** 
  - Possui link direto para a criação de conta no sistema ([OnboardingPage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/OnboardingPage.tsx)).
  - Transfere a navegação para [PipelinePage.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/PipelinePage.tsx) ou [ChatDashboard.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/ChatDashboard.tsx) após o sucesso do login.
