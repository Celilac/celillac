# CeLiLac 🛡️

> **Plataforma de Segurança Alimentar para Celíacos**
> Detecta alérgenos em produtos — incluindo traços de contaminação cruzada — e avisa antes de você consumir.

[![Backend](https://img.shields.io/badge/Backend-Node.js%2FTypeScript-green)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%20%2B%20DDD-blue)](#)
[![Mobile](https://img.shields.io/badge/Mobile-Flutter-blue)](#-mobile)
[![Tests](https://img.shields.io/badge/Tests-63%20suites%20%7C%20379%20passing-brightgreen)](#-testes)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions%20%2B%20Oracle%20Cloud-orange)](#-segurança--governança)

---

## Índice

- [Ambiente de Produção (VPS)](#-ambiente-de-produção-vps-oracle-cloud)
- [Estrutura do Monorepo](#-estrutura-do-monorepo)
- [Como Começar](#-como-começar)
- [Funcionalidades](#-funcionalidades)
- [Testes](#-testes)
- [Arquitetura](#️-arquitetura)
- [Documentação](#-documentação)
- [Segurança & Governança](#-segurança--governança)

---

## 🌐 Ambiente de Produção (VPS Oracle Cloud)

- 💻 **Web App**: [https://www.celilac.com.br/](https://www.celilac.com.br/) (ou [https://celilac.com.br/](https://celilac.com.br/))
- ⚙️ **Backend API**: [https://api.celilac.com.br/](https://api.celilac.com.br/)
- 🔒 **Reverse Proxy & SSL**: Traefik com renovação automática Let's Encrypt

---

## 📦 Estrutura do Monorepo

```
celillac/
├── .github/
│   └── workflows/           # CI/CD: ci-tests.yml (testes & build) e cd-deploy.yml (VPS SSH)
├── backend/                 # API Node.js/TypeScript (Clean Architecture + DDD)
│   ├── src/
│   │   ├── domain/          # Coração: entidades, VOs, interfaces (zero dependências)
│   │   ├── application/     # Casos de uso
│   │   ├── infrastructure/  # PostgreSQL (pg), repositórios
│   │   └── interfaces/      # Controllers HTTP (Express)
│   └── tests/unit/          # 63 suítes | 379 testes
├── frontend/
│   ├── web-app/             # Aplicação principal (Next.js 14, porta 3001)
│   ├── landing-page/        # Landing page estática (Next.js 14, porta 3002)
│   └── mobile-app/          # App Mobile (Flutter)
│       ├── lib/             # Código-fonte Dart
│       │   ├── api/         # Chamadas HTTP/Cliente API
│       │   ├── core/        # Temas, constantes e utilitários
│       │   └── features/    # Features de negócio (Auth, Perfil, Scanner)
│       └── test/            # Testes unitários e de widget
├── docs/                    # Documentação de arquitetura e contratos
├── harness/                 # Regras de governança da IA
└── infra/docker/            # docker-compose.yml (PostgreSQL + Full Stack Container)
```

---

## 🚀 Como Começar

### Pré-requisitos
- Node.js 18+
- Docker Desktop

### 1. Banco de Dados
```bash
docker-compose up -d
```

### 2. Backend (porta 3000)
```bash
cd backend
cp .env.example .env        # Configure as variáveis
npm install
npm run dev
```

### 3. Web App (porta 3001)
```bash
cd frontend/web-app
cp .env.local.example .env.local
npm install
npm run dev
```

### 4. Landing Page (porta 3002)
```bash
cd frontend/landing-page
npm install
npm run dev
```

### 5. App Mobile (Flutter)
```bash
cd frontend/mobile-app
flutter pub get
flutter run
```

> **Android Emulator:** A URL da API usa `http://10.0.2.2:3000` (localhost do emulador Android).  

---

## ✅ Funcionalidades

Cada contexto tem seu próprio doc em [`docs/features/`](docs/features/) com endpoints, entidades e regras. Contratos completos de API em [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md).

| Contexto | Status | Doc |
|:---------|:-------|:----|
| 🔐 IAM & Autenticação | ✅ Implementado | [`docs/features/iam.md`](docs/features/iam.md) |
| 👤 Consumidor | ✅ Implementado | [`docs/features/consumer.md`](docs/features/consumer.md) |
| 🥗 Perfil Alimentar | ✅ Implementado | [`docs/features/food-profile.md`](docs/features/food-profile.md) |
| ⚠️ Motor de Alérgenos (Core Domain) | ✅ Implementado | [`docs/features/allergen-engine.md`](docs/features/allergen-engine.md) |
| 🛒 Catálogo de Produtos | ✅ Implementado | [`docs/features/catalog.md`](docs/features/catalog.md) |
| 🏷️ Categorias de Produtos & Moderação | ✅ Implementado | [`docs/features/categories.md`](docs/features/categories.md) |
| 🏪 Gestão de Parceiros Comerciais | ✅ Implementado | [`docs/features/partner.md`](docs/features/partner.md) |
| 🌐 Frontend (Web App + Landing Page) | ✅ Implementado | [`docs/features/frontend.md`](docs/features/frontend.md) |
| 🛡️ Administração & Moderação | ✅ Implementado | [`docs/features/admin.md`](docs/features/admin.md) |
| ⭐ Avaliações e Confiança | ✅ Implementado | [`docs/features/reviews.md`](docs/features/reviews.md) |
| ❤️ Favoritos | ✅ Implementado | [`docs/features/favorites.md`](docs/features/favorites.md) |
| 📜 Auditoria & Rastreabilidade do Domínio | ✅ Implementado | [`docs/features/audit.md`](docs/features/audit.md) |
| 📱 App Mobile (Flutter) | ✅ Implementado | [`docs/features/mobile-app.md`](docs/features/mobile-app.md) |

---

## 🧪 Testes

```bash
cd backend
npm test
```

**63 suítes de teste | 379 casos**, cobrindo domínio, casos de uso, middlewares de segurança e o Motor de Alérgenos:

| Suíte | Cobertura |
|:------|:----------|
| `domain/Result.spec.ts` | 100% |
| `domain/iam/Email`, `PasswordHash`, `User` | 100% |
| `domain/food-profile/SeverityLevel`, `Restriction`, `FoodProfile` | 100% |
| `domain/allergen-engine/AllergenEngine` ← 9 casos críticos | ~98% |
| `domain/catalog/Product`, `Category` | ~98.5% |
| `domain/partner/Partner` | ~97.8% |
| `domain/reviews/Review` | 95% |
| `domain/audit/AuditLog`, `PgAuditLogRepository` | 100% |
| `application/food-profile/UpdateFoodProfileUseCase` | 100% |
| `application/consumer/ToggleConsumerStatusUseCase` | ~95.8% |
| `application/allergen-engine/CheckCompatibilityUseCase` | 100% |
| `application/catalog/CreateProductUseCase`, `CreateCategoryUseCase`, `SearchProductsUseCase` | 100% |
| `application/reviews/SubmitReviewUseCase`, `GetProductReviewsUseCase` | ~94% |
| `application/admin/CreateReportUseCase`, `ListReportsUseCase`, `ReviewReportUseCase`, `ReviewCategoryUseCase` | ~94% |
| `application/iam/LogoutUserUseCase` | ~92.8% |
| `interfaces/http/middlewares/AuthMiddleware` | 100% |
| `interfaces/http/middlewares/SecurityMiddleware` | 100% |

Para relatório de cobertura: `npm test -- --coverage`.

---

## 🏗️ Arquitetura

### Clean Architecture + DDD

```
Interfaces (HTTP)
     │
Application (Use Cases)
     │
Domain ← Núcleo puro, zero dependências externas
     │
Infrastructure (PostgreSQL, pg.Pool)
```

Status de cada bounded context na tabela de [Funcionalidades](#-funcionalidades), acima.

### Banco de Dados (PostgreSQL via Docker)

```
Host: localhost:5432
Banco: celilac_db
Usuário: celilac_user
```

| Tabela | Descrição |
|:-------|:----------|
| `users` | IAM — id, email, password_hash, role, full_name, avatar_url, account_status |
| `food_profiles` | Perfil — user_id (FK), restrictions (JSONB), accepts_cross_contamination |
| `partners` | Parceiros — name, cnpj, address, phone, type, approval_status, operational_status, logo_url, updated_at |
| `product_categories` | Categorias — name, normalized_name, partner_id (FK), status, visibility, rejection_reason |
| `products` | Catálogo — nome, marca, ingredientes, categoria, category_id (FK), status de análise, partner_id (FK) |
| `product_reviews` | Avaliações — user_id (FK), product_id (FK), rating, comment |
| `product_reports` | Denúncias — reporter_id (FK), product_id (FK), reason, details, status |
| `user_favorites` | Favoritos — user_id (FK), product_id (FK), partner_id (FK) |
| `email_verifications` | Verificação de e-mail OTP — user_id (FK), code, expires_at, is_used |
| `blacklisted_tokens` | Tokens JWT revogados — token (PK), expires_at |
| `audit_logs` | Auditoria & Rastreabilidade do Domínio — id (PK), entity_type, entity_id, action, actor_id, actor_role, changes (JSONB), reason, created_at |

Detalhes de schema e estratégia de persistência em [`docs/DATABASE.md`](docs/DATABASE.md).

---

## 📚 Documentação

| Arquivo | Conteúdo |
|:--------|:---------|
| [`docs/PRD.md`](docs/PRD.md) | Requisitos do produto |
| [`docs/features/`](docs/features/) | Status, endpoints e regras por bounded context |
| [`docs/DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md) | Bounded contexts e regras |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema e estratégia de persistência |
| [`docs/FRONTEND_STRATEGY.md`](docs/FRONTEND_STRATEGY.md) | Regras de interface |
| [`docs/ALLERGEN_ENGINE.md`](docs/ALLERGEN_ENGINE.md) | Especificação do motor ⚠️ |
| [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) | Contratos de API completos |
| [`CHANGELOG.md`](CHANGELOG.md) | Histórico de entregas |
| [`AGENTS.md`](AGENTS.md) | Regras de governança para IAs |
| [`harness/guardrails.md`](harness/guardrails.md) | Restrições de segurança |

---

## 📱 Mobile

O app mobile cobre o fluxo completo do consumidor no campo:

| Tela | Descrição |
|:-----|:----------|
| **Login / Cadastro** | Autenticação via `POST /iam/login` e `POST /iam/register` |
| **Onboarding de Perfil** | Seleção de alérgenos e severidade (`POST /food-profile`) |
| **Scanner** | Câmera EAN-13/EAN-8 → busca no catálogo → compatibilidade |
| **Busca** | Busca por nome/marca + verificação instantânea |
| **Perfil** | Restrições ativas, aviso de revalidação e logout |

**Segurança Mobile:**
- Token JWT armazenado em **Keychain (iOS) / Keystore (Android)** via `flutter_secure_storage`
- Compatibilidade calculada **exclusivamente no backend** — nunca no dispositivo
- Alertas visuais: ✅ SAFE · 🟡 WARNING · ⚠️ DANGER · ⛔ BLOCKED

---

## 🔒 Segurança & Governança

- **Pipelines CI/CD no GitHub Actions:** `.github/workflows/ci-tests.yml` executa 100% das 35 suítes de teste e builds em cada PR/push; `.github/workflows/cd-deploy.yml` realiza o deploy automatizado via SSH no Docker da VPS Oracle Cloud ao aprovar o merge na `main`.
- **Middleware JWT no Backend:** validação do cabeçalho `Authorization: Bearer <token>` em todas as rotas de domínio privadas (perfil, avaliações, compatibilidade).
- **Proteção contra IDOR/BOLA:** checagem estrita de identidade em nível de controller. Um usuário comum só pode ler/escrever em dados vinculados ao seu próprio id.
- **Tratamento de Erro Global:** Express configurado para ocultar logs detalhados e stack traces internos, retornando um status `500` genérico e limpo.
- **CORS & Headers de Segurança:** CORS seguro para origens controladas e headers OWASP recomendados (`nosniff`, `DENY` clickjacking, etc.).
- **`.env` nunca commitado** — apenas `.env.example` no repositório
- **Motor de Alérgenos:** 100% das alterações exigem aprovação humana
- **JWT mobile:** armazenado em Keychain/Keystore via `flutter_secure_storage` (não em AsyncStorage)
- **JWT web:** em `sessionStorage` e em memória — não armazenado em `localStorage`
- **Seeds apenas** em ambiente local — nunca dados reais de usuários
- **Agente de IA** segue `AGENTS.md` + `harness/guardrails.md` a cada tarefa
