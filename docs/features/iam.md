# IAM — Identity & Access Management

**Status:** ✅ Implementado
**Entregue em:** 2026-06-29 (Cadastro/Login), 2026-07-24 (Logout), 2026-07-28 (Perfil Estendido, OTP e Moderação) e 2026-08-13 (Onboarding Flow & Dev OTP Logging)
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#2-iam--autenticação)

## Endpoints

| Método | Rota | Autenticação | Descrição |
|:-------|:-----|:-------------|:----------|
| `POST` | `/iam/register` | Não | Cadastro de usuário |
| `POST` | `/iam/login` | Não | Autenticação com JWT |
| `POST` | `/iam/logout` | Sim (Bearer JWT) | Revoga o token atual inserindo-o na blacklist |
| `GET`  | `/iam/me` | Sim (Bearer JWT) | Retorna os dados do usuário autenticado |
| `PUT`  | `/iam/profile` | Sim (Bearer JWT) | Atualiza dados pessoais (Nome, Nascimento, Gênero, Avatar) |
| `POST` | `/iam/email-verification/verify` | Sim (Bearer JWT) | Confirma o código OTP de verificação de e-mail |
| `POST` | `/iam/email-verification/resend` | Sim (Bearer JWT) | Reenvia o código OTP para o e-mail cadastrado |
| `GET`  | `/health` | Não | Status do servidor |

## Domínio

- `User` entity (UUID v4) com suporte a perfil estendido (`fullName`, `birthDate`, `gender`, `avatarUrl`)
- Status de conta (`accountStatus`) e avaliação de perfil (`profileEvaluationStatus`: `APPROVED`, `PENDING_EVALUATION`, `REJECTED`)
- Value Objects: `Email` (validação RFC 5322), `PasswordHash` (bcrypt), `UserRole`
- Padrão `Result<T>` — erros de domínio sem exceções
- JWT com expiração de 7 dias (configurável via `JWT_EXPIRES_IN`)

## Verificação de E-mail por OTP (Zoho Email / FakeEmailService)

- Código numérico de 6 dígitos persistido na tabela `email_verifications` com validade de 15 minutos.
- Envio transacional via Zoho Mail ou driver de desenvolvimento/testes FakeEmailService (`EMAIL_DRIVER=fake` ou `USE_FAKE_EMAIL=true`).
- Em ambiente de desenvolvimento local, o código OTP gerado é impresso no console do servidor backend para facilitar testes.

## Revogação de Tokens (Logout)

- **Mecanismo:** Blacklist server-side persistida na tabela `blacklisted_tokens` no PostgreSQL.
- **Caso de Uso:** `LogoutUserUseCase` decodifica o token, descobre a expiração e o insere na blacklist.
- **Middleware:** `AuthMiddleware` rejeita requisições com tokens revogados (`401 Unauthorized`).

## Proteção de Ações para E-mails Verificados (`verifiedEmailOnlyMiddleware`)

- **Objetivo:** Impedir fraudes, spam, avaliações maliciosas ou denúncias falsas a partir de contas não verificadas.
- **Funcionamento:** O middleware `verifiedEmailOnlyMiddleware` intercepta rotas de mutação/interação e checa `users.is_email_verified`. Se `false`, bloqueia a operação retornando `403 Forbidden` (`code: 'EMAIL_NOT_VERIFIED'`).
- **Rotas Protegidas:**
  - `POST /reviews` (Envio de avaliação de produtos/parceiros)
  - `POST /favorites` e `DELETE /favorites/:targetId` (Adição e remoção de favoritos)
  - `POST /reports` (Envio de denúncias de segurança alimentar)
  - `POST /partners` (Cadastro de estabelecimentos/parceiros)
  - `POST /products` (Cadastro de produtos no catálogo)

