# PLAN.md - Recuperação de Senha ("Esqueceu a senha?") via OTP por E-mail

**Status:** Aprovado e em Execução  
**Escopo:** Backend (Clean Architecture, DDD, PostgreSQL, Zoho Email/Fake Email) e Frontend Web (Next.js)  
*(Nota: Suporte Mobile Flutter postergado conforme alinhamento com o usuário)*

---

## 1. Objetivo
Implementar o fluxo completo de auto-atendimento para recuperação de senha esquecida ("Esqueceu a senha?"):
1. O usuário clica em "Esqueceu a senha?" na tela de Login (`/auth/login`).
2. Na página `/auth/forgot-password`, informa seu e-mail e solicita a recuperação.
3. O backend gera um código OTP numérico de 6 dígitos (válido por 15 minutos), salva na tabela `password_resets` e despacha o e-mail via `IEmailService` (com layout visual CeLiLac no Zoho e log no `FakeEmailService`). Proteção contra enumeração: sempre retorna 200 OK genérico.
4. O usuário é redirecionado para `/auth/reset-password?email={email}` onde digita o código OTP de 6 dígitos, nova senha e confirmação de nova senha (com validação forte e alternância de visibilidade de senha).
5. O backend valida o código, atualiza o hash da senha do usuário no banco e invalida o código OTP.
6. A página exibe toast de confirmação e redireciona para `/auth/login`.

---

## 2. Etapas de Execução

### Fase 1: Banco de Dados e Migração
- Criar migration `harness/scripts/migrations/024_create_password_resets_table.sql`.
- Atualizar `harness/scripts/init_db.sql`.

### Fase 2: Domínio do Backend (`backend/src/domain/iam` e `services`)
- Criar entidade `PasswordReset.ts` com métodos `isExpired()`, `markAsUsed()`, `generateCode()`, `create()`.
- Criar interface `IPasswordResetRepository.ts`.
- Adicionar método `changePassword(newPasswordHash: PasswordHash): void` na entidade `User.ts`.
- Adicionar método `sendPasswordResetCode(recipientEmail: string, code: string, recipientName?: string): Promise<void>` em `IEmailService.ts`.
- Implementar testes unitários do domínio:
  - `backend/tests/unit/domain/iam/PasswordReset.spec.ts`
  - `backend/tests/unit/domain/iam/UserChangePassword.spec.ts`

### Fase 3: Infraestrutura do Backend (`backend/src/infrastructure`)
- Implementar repositório `PgPasswordResetRepository.ts`.
- Atualizar `FakeEmailService.ts` com `sendPasswordResetCode`.
- Atualizar `ZohoEmailService.ts` com `sendPasswordResetCode` (layout HTML responsivo CeLiLac).

### Fase 4: Aplicação e Casos de Uso (`backend/src/application/iam`)
- Criar `RequestPasswordResetUseCase.ts` (busca usuário, invalida pendentes, gera OTP, salva reset, despacha e-mail).
- Criar `ResetPasswordUseCase.ts` (valida senha forte, valida OTP, altera senha, salva usuário, marca OTP usado).
- Implementar testes unitários dos use cases:
  - `backend/tests/unit/application/iam/RequestPasswordResetUseCase.spec.ts`
  - `backend/tests/unit/application/iam/ResetPasswordUseCase.spec.ts`

### Fase 5: Controllers, Rotas HTTP e Contratos
- Criar `RequestPasswordResetController.ts` (`POST /iam/password-reset/request`).
- Criar `ResetPasswordController.ts` (`POST /iam/password-reset/confirm`).
- Configurar rotas em `backend/src/interfaces/http/routes/iam.routes.ts`.
- Testes de controller em `backend/tests/unit/interfaces/http/controllers/iam/PasswordResetControllers.spec.ts`.
- Atualizar documentação de contratos em `docs/API_CONTRACTS.md`.

### Fase 6: Frontend Web App (`frontend/web-app`)
- Atualizar `src/api/iam.ts` com `requestPasswordReset` e `resetPassword`.
- Atualizar `src/app/auth/login/page.tsx` com link "Esqueceu a senha?".
- Criar página `src/app/auth/forgot-password/page.tsx`.
- Criar página `src/app/auth/reset-password/page.tsx` (com campos de OTP, nova senha, confirmação, medidor de força, `PasswordEyeIcon` e reenvio de código).

### Fase 7: Validação e Finalização
- Rodar `npm test` no backend.
- Rodar `npm run build` no backend e no frontend web.
- Atualizar `CHANGELOG.md` e gerar `walkthrough.md`.
