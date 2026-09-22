# PLAN.md - Rate Limiting nos Endpoints Transacionais de E-mail / OTP (IAM)

**Status:** Aprovado e em Execução  
**Escopo:** Backend (Middlewares HTTP, Express, Rotas IAM, Testes Automatizados)

---

## 1. Objetivo
Implementar middleware de limitação de taxa (*Rate Limiting*) nativo em TypeScript (sem dependências externas) para proteger os endpoints públicos/sensíveis que disparam e-mails e geram códigos OTP:
1. `POST /iam/password-reset/request` (limite: 5 requisições por IP a cada 15 minutos).
2. `POST /iam/email-verification/resend` (limite: 5 requisições por IP a cada 15 minutos).

O middleware deve responder com `429 Too Many Requests` caso o limite seja excedido, retornando headers padrão de controle (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` e `Retry-After`) e mensagem amigável no formato `{ error: string }`.

---

## 2. Etapas de Execução

### Fase 1: Middleware de Rate Limit (`backend/src/interfaces/http/middlewares/RateLimitMiddleware.ts`)
- Criar a factory `createRateLimiter(options: RateLimitOptions)`:
  - `windowMs`: Janela de tempo em ms (padrão: 15 minutos = 900.000 ms).
  - `max`: Número máximo de requisições permitidas (padrão: 5).
  - `message`: Mensagem descritiva de bloqueio.
  - `keyGenerator`: Identificação do cliente por IP (respeitando `x-forwarded-for` de proxies reversos e fallback para `req.ip` ou `socket.remoteAddress`).
- Armazenamento em memória com limpeza periódica (para evitar acúmulo de memória).
- Inclusão dos headers RFC/IETF no response (`X-RateLimit-*` e `Retry-After`).

### Fase 2: Configuração do Servidor e Rotas
- Em `backend/src/index.ts`:
  - Adicionar `app.set('trust proxy', 1);` para resolução fidedigna de IPs atrás de proxies.
- Em `backend/src/interfaces/http/routes/iam.routes.ts`:
  - Instanciar `passwordResetRateLimiter` (5 req / 15 min).
  - Instanciar `emailVerificationRateLimiter` (5 req / 15 min).
  - Aplicar nas rotas `POST /password-reset/request` e `POST /email-verification/resend`.

### Fase 3: Testes Automatizados
- Criar suíte de testes unitários: `backend/tests/unit/interfaces/http/middlewares/RateLimitMiddleware.spec.ts`:
  - Permitir requisições dentro da cota (1..5).
  - Validar cabeçalhos `X-RateLimit-*`.
  - Bloquear a 6ª requisição com status 429 e `Retry-After`.
  - Resetar a cota após expiração da janela.
  - Isolar requisições entre IPs distintos.
  - Suportar múltiplos IPs em `x-forwarded-for`.

### Fase 4: Validação, Build e Documentação
- Executar `npm test` no backend.
- Executar `npm run build` no backend.
- Atualizar `docs/API_CONTRACTS.md`.
- Atualizar `CHANGELOG.md` e `walkthrough.md`.
