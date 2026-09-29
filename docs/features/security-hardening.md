# Segurança e Proteção Anti-DDoS / Anti-Bot (Security Hardening)

**Status:** ✅ Implementado  
**Entregue em:** 2026-09-29 (FEAT-091 / Hardening 3-Camadas - ver [CHANGELOG.md](../../CHANGELOG.md))  
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md)  
**Arquitetura:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)  

---

## 1. Visão Geral

Implementação da arquitetura de proteção em profundidade (**Defense-in-Depth**) em 3 camadas complementares contra ataques hackers, DDoS em camada de aplicação (L7), explorações de força bruta e tráfego predatório de web scrapers e agentes de inteligência artificial.

```
[ Internet / Requisição ]
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 1: Traefik (Edge Proxy / Reverse Proxy)               │
│ - Buffer anti-Slowloris (memRequestBodyBytes: 2MB, max 25MB) │
│ - InFlight concurrency limit (50 conn/IP)                   │
│ - Rate Limit de borda (100 req/s, burst 150)                │
│ - Headers de segurança HTTP (HSTS, nosniff, frame-deny)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 2: Backend Express (Aplicação)                       │
│ - BotBlockerMiddleware (403 p/ GPTBot, ClaudeBot, Scrapy...)│
│ - Bloqueio de requisições com User-Agent vazio/nulo         │
│ - Global API Rate Limiter (120 req/min por IP)              │
│ - Dedicated Rate Limiters por rota sensível:                │
│     * /iam/login: 10 req / 5 min                            │
│     * /iam/register: 5 req / 15 min                         │
│     * /iam/password-reset/request: 3 req / 15 min           │
│     * /iam/password-reset/confirm (OTP): 5 req / 15 min     │
│     * /iam/email-verification/verify (OTP): 5 req / 15 min  │
│     * /catalog/products (busca): 60 req / min               │
│     * /compatibility/check: 60 req / min                    │
│ - Payload limit: 2MB padrão; 25MB restrito a upload de foto │
│ - Remoção de headers discriminatórios (x-powered-by)        │
│ - CORS restritivo sem reflexão de origem coringa            │
│ - Validação estrita de JWT_SECRET em produção               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 3: Frontend Web & SEO/Robots                         │
│ - robots.txt com bloqueio explícito de AI Crawlers          │
│ - Disallow para rotas privadas (/dashboard, /partner, etc)  │
│ - poweredByHeader: false no Next.js (sem X-Powered-By)      │
│ - Security headers nosniff, DENY, strict-origin-when-cross  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Regras e Componentes Implementados

### 2.1. Bloqueador de Agentes e Scrapers (`BotBlockerMiddleware`)
- **Arquivo:** `backend/src/interfaces/http/middlewares/BotBlockerMiddleware.ts`
- **Assinaturas Bloqueadas:** `GPTBot`, `ChatGPT-User`, `ClaudeBot`, `anthropic-ai`, `CCBot`, `Bytespider`, `PerplexityBot`, `cohere-ai`, `Diffbot`, `FacebookBot`, `Amazonbot`, `Omgilibot`, `Scrapy`, `python-requests`, `aiohttp`, `Go-http-client`, `curl`, `Wget`, `httpx`, `PostmanRuntime` (em produção).
- **Tratamento:** Retorna `HTTP 403 Forbidden` com `{ "error": "Acesso não autorizado para bots automatizados ou agentes de IA." }`.
- **Cobertura de Testes:** 100% em `backend/tests/unit/interfaces/http/middlewares/BotBlockerMiddleware.spec.ts`.

### 2.2. Rate Limiters Dedicados

| Escopo / Rota | Janela | Limite Máximo | Motivo de Segurança |
|:--------------|:-------|:--------------|:--------------------|
| **Global API** (`/`) | 1 minuto | 120 reqs | Prevenção contra flood L7 e exaustão do event-loop Node.js |
| `POST /iam/login` | 5 minutos | 10 reqs | Prevenção de exaustão de CPU via bcrypt e força-bruta |
| `POST /iam/register` | 15 minutos | 5 reqs | Prevenção contra spam de contas e esgotamento de e-mails |
| `POST /iam/password-reset/request` | 15 minutos | 3 reqs | Prevenção de abuso de envio de OTP via provedor de e-mail |
| `POST /iam/password-reset/confirm` | 15 minutos | 5 reqs | Prevenção de enumeração e ataque de força bruta no OTP (6 dígitos) |
| `POST /iam/email-verification/verify` | 15 minutos | 5 reqs | Prevenção de força bruta no código de ativação de conta |
| `GET /catalog/products` | 1 minuto | 60 buscas | Prevenção contra raspagem automatizada do catálogo |
| `POST /compatibility/check` | 1 minuto | 60 checagens | Prevenção de sobrecarga do motor de alérgenos |

### 2.3. Controle Estrito de Payload (Anti-Memory Exhaustion)
- **Global:** `2MB` (`express.json({ limit: '2mb' })`).
- **Rotas de Upload:** `25MB` apenas para `POST /catalog/products`, `PUT /catalog/products/:id` e rotas de logo/perfil do parceiro que enviam fotos em base64.

### 2.4. Hardening de Frontend e Borda
- **Robots.txt:** `frontend/web-app/public/robots.txt` orientando bots amigáveis e bloqueando explicitamente agentes de IA.
- **Next.js:** `next.config.mjs` com `poweredByHeader: false` e headers de segurança HTTP.
- **Traefik:** `docker-compose.yml` com buffering anti-Slowloris e limite de 50 conexões simultâneas por IP.

---

## 3. Blindagem de Aplicação (AppSec) aderente ao OWASP Top 10

| Vulnerabilidade / Categoria | Mecanismo Implementado | Camada & Arquivos |
|:---|:---|:---|
| **A01: BOLA / IDOR** | Validação de posse do recurso (`actorId === userId \|\| actorRole === 'ADMIN'`) diretamente no Use Case. | `GetFoodProfileUseCase.ts`, `UpdateFoodProfileUseCase.ts`, `UpdateUserProfileUseCase.ts`, `UpdateProductUseCase.ts` |
| **A02: Roubo de Sessão** | Tokens de autenticação via cookies `httpOnly`, `Secure` (produção), `SameSite=Lax`. Fallback automático para `Authorization: Bearer` (mobile e API). | `LoginUserController.ts`, `LogoutUserController.ts`, `AuthMiddleware.ts`, `client.ts` |
| **A03: Injection** | Validação estrita e sanitização de DTOs via Zod antes da camada de aplicação (`validateBody(schema)`). | `ValidationMiddleware.ts`, `AuthSchemas.ts`, `FoodProfileSchemas.ts` |
| **A05: XSS Defense** | Cabeçalho `Content-Security-Policy` (CSP) restritivo configurado no Next.js. | `frontend/web-app/next.config.mjs` |
| **A08: Upload Seguro** | Validação de cabeçalhos binários (Magic Bytes: PNG, JPEG, WebP, GIF) e sanitização/rejeição de scripts/XXE em SVG. | `FileSecurityValidator.ts`, `CreateProductUseCase.ts`, `UpdateProductUseCase.ts` |
| **A09: Auditoria & Observabilidade** | Logs estruturados em formato JSON (SIEM) para login inválido, OTP incorreto, violações de BOLA, 403 e 429. | `SecurityLogger.ts` |

---

## 4. Testes e Validação

- `backend/tests/unit/interfaces/http/middlewares/BotBlockerMiddleware.spec.ts` (7 testes, 100% cobertura)
- `backend/tests/unit/interfaces/http/middlewares/RateLimitMiddleware.spec.ts` (6 testes)
- `backend/tests/unit/interfaces/http/middlewares/SecurityMiddleware.spec.ts` (4 testes)
- `backend/tests/unit/interfaces/http/middlewares/ValidationMiddleware.spec.ts` (3 testes)
- `backend/tests/unit/infrastructure/services/FileSecurityValidator.spec.ts` (9 testes)
- `backend/tests/unit/infrastructure/logging/SecurityLogger.spec.ts` (4 testes)
- `backend/tests/unit/application/food-profile/FoodProfileBola.spec.ts` (5 testes)
- Suíte total do backend: **474 testes passando (77 suítes)**
- Build do frontend: **21/21 páginas estáticas/dinâmicas geradas com sucesso** com validação de tipos e CSP ativo.
