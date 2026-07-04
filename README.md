# CeLiLac 🛡️

> **Plataforma de Segurança Alimentar para Celíacos**
> Detecta alérgenos em produtos — incluindo traços de contaminação cruzada — e avisa antes de você consumir.

[![Backend](https://img.shields.io/badge/Backend-Node.js%2FTypeScript-green)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%20%2B%20DDD-blue)](#)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black)](#)
[![Tests](https://img.shields.io/badge/Tests-13%20suites%20%7C%2068%20passing-brightgreen)](#-testes)

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
│   └── landing-page/        # Landing page estática (Next.js 14, porta 3002)
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
docker-compose -f infra/docker/docker-compose.yml up -d
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
| 🛡️ Administração | 🔜 Futuro | — |

---

## 🧪 Testes

```bash
cd backend
npm test
```

13 suítes de teste (68 casos), cobrindo domínio, casos de uso e o Motor de Alérgenos:

- `domain/Result.spec.ts`
- `domain/iam/Email.spec.ts`, `PasswordHash.spec.ts`, `User.spec.ts`
- `domain/food-profile/SeverityLevel.spec.ts`, `Restriction.spec.ts`, `FoodProfile.spec.ts`
- `domain/allergen-engine/AllergenEngine.spec.ts` ← 9 casos críticos de segurança alimentar
- `domain/catalog/Product.spec.ts`
- `application/food-profile/UpdateFoodProfileUseCase.spec.ts`
- `application/allergen-engine/CheckCompatibilityUseCase.spec.ts`
- `application/catalog/CreateProductUseCase.spec.ts`, `SearchProductsUseCase.spec.ts`

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

## 🔒 Segurança & Governança

- **`.env` nunca commitado** — apenas `.env.example` no repositório
- **Motor de Alérgenos:** 100% das alterações exigem aprovação humana
- **JWT em memória** no frontend — não armazenado em `localStorage`
- **Seeds apenas** em ambiente local — nunca dados reais de usuários
- **Agente de IA** segue `AGENTS.md` + `harness/guardrails.md` a cada tarefa
