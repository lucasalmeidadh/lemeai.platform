
Gerar Credenciais
curl --location 'https://painel.nvoip.com.br/developer'

Gerar Access token
curl --location 'https://api.nvoip.com.br/auth/oauth2/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'scope=call:make call:query sms:send whatsapp:send whatsapp:templates'

Gerar code
curl --location 'https://api.nvoip.com.br/auth/oauth2/authorize?response_type=code&client_id=&redirect_uri=https%3A%2F%2Fseu-dominio.com%2Fcallback&scope=openid%20call%3Amake%20call%3Aquery%20sms%3Asend%20whatsapp%3Asend%20whatsapp%3Atemplates&state=troque-por-um-valor-aleatorio'

Trocar code
Authorization
Basic Auth
Username
{{client_id}}
Password
{{client_secret}}
Body
urlencoded
grant_type
authorization_code
code
{{authorization_code}}
redirect_uri
{{redirect_uri}}
curl --location 'https://api.nvoip.com.br/auth/oauth2/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=authorization_code' \
--data-urlencode 'code=' \
--data-urlencode 'redirect_uri=https://seu-dominio.com/callback'

Atualizas access token
Authorization
Basic Auth
Username
{{client_id}}
Password
{{client_secret}}
Body
urlencoded
grant_type
refresh_token
refresh_token
{{refresh_token}}

curl --location 'https://api.nvoip.com.br/auth/oauth2/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=refresh_token' \
--data-urlencode 'refresh_token='

OpenID config
curl --location 'https://api.nvoip.com.br/auth/.well-known/openid-configuration'

JWKS
curl --location 'https://api.nvoip.com.br/auth/oauth2/jwks'

Ver escopos
curl --location 'https://painel.nvoip.com.br/developer'

Realizar chamada
Realizar chamada
View complete documentation
{{api_base_url}}/calls/
Escopo esperado: call:make.

Authorization
Bearer Token
This request is using an authorization helper from collection Nvoip API v3
Body
raw (json)
{
  "caller": "{{caller}}",
  "called": "{{called}}",
  "mailbox": false,
  "checkDDI": true,
  "transfer": false,
  "smartCallerId": null
}

curl --location 'https://api.nvoip.com.br/v3/calls/' \
--header 'Content-Type: application/json' \
--data '{
  "caller": "{{caller}}",
  "called": "{{called}}",
  "mailbox": false,
  "checkDDI": true,
  "transfer": false,
  "smartCallerId": null
}'


Historico de ligações
Histórico de ligações
View complete documentation
{{api_base_url}}/calls/history?date=2026-05-21&type=outbound
Escopo esperado: call:query.

Authorization
Bearer Token
This request is using an authorization helper from collection Nvoip API v3
Query Params
date
2026-05-21
type
outbound
curl --location 'https://api.nvoip.com.br/v3/calls/history?date=2026-05-21&type=outbound'

consultar saldo
Consultar saldo
View complete documentation
{{api_base_url}}/balance
Exemplo de chamada autenticada com Bearer Token.

Authorization
Bearer Token
This request is using an authorization helper from collection Nvoip API v3
Code Snippet
curl --location 'https://api.nvoip.com.br/v3/balance'