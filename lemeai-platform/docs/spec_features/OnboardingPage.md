# Onboarding (Página de Cadastro)

## 1. Visão Geral e Escopo de Negócios (Business Scope)
A página de **Onboarding** (Cadastro) é o formulário público onde novos clientes criam suas contas e provisionam um novo "Tenant" (Empresa) no sistema. O fluxo é desenhado para reduzir fricção, dividido em dois passos simples, e já inclui uma validação de segurança crítica de identidade (Autenticação de 2 Fatores via OTP no e-mail) antes mesmo da criação da conta. A promessa comercial na tela é a liberação de "7 dias de avaliação gratuita com recursos liberados".

## 2. Escopo Técnico (Technical Scope)
- **Localização do Arquivo:** `src/pages/OnboardingPage.tsx`
- **Rotas:** `/cadastro`
- **Fluxo em Duas Etapas (Wizard):**
  - **Passo 1 (Dados do Usuário):** Coleta de Nome, E-mail, Senha e Validação de OTP. 
    - **Regras Dinâmicas**: Os campos de Nome e E-mail tornam-se inativos (`disabled`) após a validação com sucesso do OTP.
    - **Validação de Senha**: Validação inline em tempo real contendo exigências de tamanho (8-16 caracteres), uma letra maiúscula, uma minúscula e um caractere especial, bloqueando o avanço ao Passo 2 caso não seja atendido. A mensagem de sucesso do OTP some automaticamente após 3 segundos.
  - **Passo 2 (Dados da Empresa):** Coleta Nome da Empresa e CNPJ (com máscara automática baseada em Regex).
- **Validação OTP (One-Time Password):**
  - Chamada a `POST /api/Auth/SendOtp`: Envia um código de 6 dígitos para o e-mail preenchido. Possui cooldown de reenvio de 60 segundos gerenciado localmente via timer de estado (`otpCooldown`).
  - Chamada a `POST /api/Auth/ValidateOtp`: Valida o código digitado contra o e-mail. Só libera os campos de senha se validado com sucesso.
- **Registro do Tenant:**
  - Chamada a `POST /api/Auth/Register`: Envia todos os dados agregados (`nomeUsuario`, `email`, `senha`, `nomeEmpresa`, `cnpj`, `codigoOtp`).
- **Estados Visuais Complexos:** Controle minucioso de botões desabilitados (`isValidatingOtp`, `isSendingOtp`, cooldown timer), toggle de visualização de senha (`FaEye`, `FaEyeSlash`) e exibição de alertas globais usando componentes injetados na DOM.

## 3. Componentes e Estrutura
- Formulário autônomo sem componentes reutilizáveis de `src/components`, similar ao `Login.tsx`. Utiliza CSS próprio em `OnboardingPage.css`.
- Usa amplamente ícones do `react-icons/fa` para UI (`FaBuilding`, `FaIdCard`, `FaCheckCircle`, etc).

## 4. Interdependências (Relacionamentos)
- **APIs consumidas:**
  - `POST /api/Auth/SendOtp`
  - `POST /api/Auth/ValidateOtp`
  - `POST /api/Auth/Register`
- **Outras Páginas:** 
  - Link recíproco com a página de [Login.tsx](file:///c:/git/lemeai.platform/lemeai-platform/src/pages/Login.tsx).
  - Após sucesso de registro, engatilha `setTimeout` redirecionando fisicamente o usuário via rota de React Router DOM (`/login`) para forçá-lo a fazer o login oficial no sistema com as novas credenciais.
