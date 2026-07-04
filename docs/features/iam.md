# IAM — Identity & Access Management

**Status:** ✅ Implementado
**Entregue em:** 2026-06-29 (ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#2-iam--autenticação)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/iam/register` | Cadastro de usuário |
| `POST` | `/iam/login` | Autenticação com JWT |
| `GET`  | `/health` | Status do servidor |

## Domínio

- `User` entity (UUID v4)
- Value Objects: `Email` (validação RFC 5322), `PasswordHash` (bcrypt), `UserRole`
- Padrão `Result<T>` — erros de domínio sem exceções
- JWT com expiração de 7 dias (configurável via `JWT_EXPIRES_IN`)

## Testes

`backend/tests/unit/domain/iam/Email.spec.ts`, `PasswordHash.spec.ts`, `User.spec.ts`
