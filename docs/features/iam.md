# IAM — Identity & Access Management

**Status:** ✅ Implementado
**Entregue em:** 2026-06-29 (Cadastro/Login) e 2026-07-24 (Logout com Blacklist)
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#2-iam--autenticação)

## Endpoints

| Método | Rota | Autenticação | Descrição |
|:-------|:-----|:-------------|:----------|
| `POST` | `/iam/register` | Não | Cadastro de usuário |
| `POST` | `/iam/login` | Não | Autenticação com JWT |
| `POST` | `/iam/logout` | Sim (Bearer JWT) | Revoga o token atual inserindo-o na blacklist |
| `GET`  | `/health` | Não | Status do servidor |

## Domínio

- `User` entity (UUID v4)
- Value Objects: `Email` (validação RFC 5322), `PasswordHash` (bcrypt), `UserRole`
- Padrão `Result<T>` — erros de domínio sem exceções
- JWT com expiração de 7 dias (configurável via `JWT_EXPIRES_IN`)

## Revogação de Tokens (Logout)

- **Mecanismo:** Blacklist server-side persistida na tabela `blacklisted_tokens` no PostgreSQL.
- **Caso de Uso:** `LogoutUserUseCase` decodifica o token, descobre o tempo de expiração (`exp`) e persiste o token na lista negra até que ele expire naturalmente.
- **Middleware:** `AuthMiddleware` consulta o repositório de blacklist (`PgBlacklistTokenRepository`) a cada requisição autenticada, rejeitando tokens revogados com `401 Unauthorized (Token revogado.)`.

## Testes

- `backend/tests/unit/domain/iam/Email.spec.ts`, `PasswordHash.spec.ts`, `User.spec.ts`
- `backend/tests/unit/application/iam/LogoutUserUseCase.spec.ts` (Novos testes do Caso de Uso)
- `backend/tests/unit/interfaces/http/middlewares/AuthMiddleware.spec.ts` (Modificado para testar bloqueio na blacklist)
