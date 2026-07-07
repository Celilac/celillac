# CeLiLac 🛡️

> **Plataforma de Segurança Alimentar para Celíacos**
> Detecta alérgenos em produtos — incluindo traços de contaminação cruzada — e avisa antes de você consumir.

[![Backend](https://img.shields.io/badge/Backend-Node.js%2FTypeScript-green)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%20%2B%20DDD-blue)](#)
[![Mobile](https://img.shields.io/badge/Mobile-React%20Native%20%2B%20Expo-9cf)](#-mobile)
[![Tests](https://img.shields.io/badge/Tests-20%20suites%20%7C%2089%20passing-brightgreen)](#-testes)

---

## Índice

- [Estrutura do Monorepo](#-estrutura-do-monorepo)
- [Como Começar](#-como-começar)
- [Funcionalidades](#-funcionalidades)
- [Testes](#-testes)
- [Arquitetura](#️-arquitetura)
- [Documentação](#-documentação)
- [Segurança & Governança](#-segurança--governança)

---

## 📦 Estrutura do Monorepo

```
celillac/
├── backend/                 # API Node.js/TypeScript (Clean Architecture + DDD)
│   ├── src/
│   │   ├── domain/          # Coração: entidades, VOs, interfaces (zero dependências)
│   │   ├── application/     # Casos de uso
│   │   ├── infrastructure/  # PostgreSQL (pg), repositórios
│   │   └── interfaces/      # Controllers HTTP (Express)
│   └── tests/unit/          # 13 suítes | 68 testes
├── frontend/
│   ├── web-app/             # Aplicação principal (Next.js 14, porta 3001)
│   ├── landing-page/        # Landing page estática (Next.js 14, porta 3002)
│   └── mobile-app/          # App React Native + Expo (Android/iOS)
│       ├── src/lib/         # api.ts (HTTP) + auth.ts (decode JWT)
│       ├── src/context/     # AuthContext (estado global + SecureStore)
│       ├── src/screens/     # Login, Cadastro, Onboarding, Perfil, Busca, Scanner
│       └── src/components/  # AlertBanner, RestrictionChip, LoadingSpinner
├── docs/                    # Documentação de arquitetura e contratos
├── harness/                 # Regras de governança da IA
└── infra/docker/            # docker-compose.yml (PostgreSQL)
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

### 5. App Mobile (Android/iOS via Expo)
```bash
cd frontend/mobile-app
npm install
npm run android     # Emulador Android (requer Android Studio)
npm run ios         # Simulador iOS (requer macOS + Xcode)
npm start           # Expo Go (scan QR code no celular)
```

> **Android Emulator:** A URL da API usa `http://10.0.2.2:3000` (localhost do emulador Android).  
> **Dispositivo físico:** Altere `BASE_URL` em `src/lib/api.ts` para o IP da sua máquina.

---

## ✅ Funcionalidades

Cada contexto tem seu próprio doc em [`docs/features/`](docs/features/) com endpoints, entidades e regras. Contratos completos de API em [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md).

| Contexto | Status | Doc |
|:---------|:-------|:----|
| 🔐 IAM | ✅ Implementado | [`docs/features/iam.md`](docs/features/iam.md) |
| 🥗 Perfil Alimentar | ✅ Implementado | [`docs/features/food-profile.md`](docs/features/food-profile.md) |
| ⚠️ Motor de Alérgenos (Core Domain) | ✅ Implementado | [`docs/features/allergen-engine.md`](docs/features/allergen-engine.md) |
| 🛒 Catálogo de Produtos | ✅ Implementado | [`docs/features/catalog.md`](docs/features/catalog.md) |
| 🌐 Frontend (Web App + Landing Page) | ✅ Implementado | [`docs/features/frontend.md`](docs/features/frontend.md) |
| 🛡️ Administração | ✅ Implementado | [`docs/features/admin.md`](docs/features/admin.md) |
| ⭐ Avaliações e Confiança | ✅ Implementado | [`docs/features/reviews.md`](docs/features/reviews.md) |
| 📱 App Mobile | ✅ Implementado | [`frontend/mobile-app/`](frontend/mobile-app/) |

---

## 🧪 Testes

```bash
cd backend
npm test
```

**20 suítes de teste | 89 casos**, cobrindo domínio, casos de uso e o Motor de Alérgenos:

| Suíte | Cobertura |
|:------|:----------|
| `domain/Result.spec.ts` | 100% |
| `domain/iam/Email`, `PasswordHash`, `User` | 100% |
| `domain/food-profile/SeverityLevel`, `Restriction`, `FoodProfile` | 100% |
| `domain/allergen-engine/AllergenEngine` ← 9 casos críticos | ~94% |
| `domain/catalog/Product` | 100% |
| `domain/reviews/Review` | ~82% |
| `application/food-profile/UpdateFoodProfileUseCase` | ~95% |
| `application/allergen-engine/CheckCompatibilityUseCase` | 100% |
| `application/catalog/CreateProductUseCase`, `SearchProductsUseCase` | 100% |
| `application/reviews/SubmitReviewUseCase`, `GetProductReviewsUseCase` | ~93% |
| `application/admin/CreateReportUseCase`, `ListReportsUseCase`, `ReviewReportUseCase` | ~94% |

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
| `users` | IAM — id, email, password_hash, role |
| `food_profiles` | Perfil — user_id (FK), restrictions (JSONB) |
| `products` | Catálogo — nome, marca, ingredientes, status de análise |

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
- Token JWT armazenado em **Keychain (iOS) / Keystore (Android)** via `expo-secure-store`
- Compatibilidade calculada **exclusivamente no backend** — nunca no dispositivo
- Alertas visuais: ✅ SAFE · 🟡 WARNING · ⚠️ DANGER · ⛔ BLOCKED

---

## 🔒 Segurança & Governança

- **`.env` nunca commitado** — apenas `.env.example` no repositório
- **Motor de Alérgenos:** 100% das alterações exigem aprovação humana
- **JWT mobile:** armazenado em Keychain/Keystore via `expo-secure-store` (não em AsyncStorage)
- **JWT web:** em memória — não armazenado em `localStorage`
- **Seeds apenas** em ambiente local — nunca dados reais de usuários
- **Agente de IA** segue `AGENTS.md` + `harness/guardrails.md` a cada tarefa
