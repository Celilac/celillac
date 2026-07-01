# CeLiLac 🛡️

> **Plataforma de Segurança Alimentar para Celíacos**  
> Detecta alérgenos em produtos — incluindo traços de contaminação cruzada — e avisa antes de você consumir.

[![Backend](https://img.shields.io/badge/Backend-Node.js%2FTypeScript-green)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%20%2B%20DDD-blue)](#)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black)](#)
[![Tests](https://img.shields.io/badge/Tests-53%20passing%20%7C%2098%25%20coverage-brightgreen)](#)

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
│   └── tests/unit/          # 53 testes | 98% cobertura
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

## ✅ Funcionalidades Implementadas

### 🔐 FEAT-001 — Módulo IAM (Identity & Access Management)

**Endpoints:**
| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/iam/register` | Cadastro de usuário |
| `POST` | `/iam/login` | Autenticação com JWT |
| `GET`  | `/health` | Status do servidor |

**Domínio:**
- `User` entity com UUID v4
- Value Objects: `Email` (validação RFC 5322), `PasswordHash` (bcrypt), `UserRole`
- Padrão `Result<T>` — erros de domínio sem exceções
- JWT com expiração de 7 dias

**Exemplo:**
```bash
# Cadastrar
curl -X POST http://localhost:3000/iam/register \
  -H "Content-Type: application/json" \
  -d '{"email":"celíaco@celilac.com","password":"Senha@123","role":"CELIACO"}'
# → 201 { "id": "uuid", "email": "...", "role": "CELIACO" }

# Login
curl -X POST http://localhost:3000/iam/login \
  -H "Content-Type: application/json" \
  -d '{"email":"celíaco@celilac.com","password":"Senha@123"}'
# → 200 { "token": "eyJ...", "expiresIn": "7d" }
```

---

### 🥗 FEAT-002 — Bounded Context: Perfil Alimentar

**Endpoints:**
| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/food-profile` | Criar perfil alimentar |
| `GET`  | `/food-profile/:userId` | Buscar perfil por usuário |

**Domínio:**
- `FoodProfile` aggregate root
- `Restriction` entity (alérgeno + severidade)
- `SeverityLevel`: `LOW` | `MEDIUM` | `HIGH` | `FATAL`
- `AllergenType`: Glúten, Lactose, Castanhas, Soja, Ovos, Frutos do Mar, Peixes, Gergelim, Outro
- **Regras críticas:** perfil ativo exige ≥1 restrição; restrições `FATAL` sinalizam revalidação histórica; anti-duplicidade de alérgenos

**Exemplo:**
```bash
curl -X POST http://localhost:3000/food-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "uuid-do-user",
    "restrictions": [
      { "allergen": "GLUTEN", "severity": "FATAL" },
      { "allergen": "LACTOSE", "severity": "MEDIUM" }
    ]
  }'
```

---

### ⚠️ FEAT-003 — Motor de Alérgenos (Core Domain)

> **Arquivo de máxima criticidade.** Qualquer alteração exige aprovação humana conforme `harness/guardrails.md`.

**O que faz:** Calcula a compatibilidade entre um `FoodProfile` e um produto, retornando um relatório completo de riscos.

**Regras implementadas (aprovadas em 2026-06-30):**

| Regra | Condição | Resultado |
|:------|:---------|:----------|
| R1 | Produto sem ingredientes declarados | `BLOCKED` (precaução) |
| R2 | Perfil sem restrições | `SAFE` |
| R3 | Celíaco (`FATAL`) + glúten nos ingredientes | `BLOCKED` |
| **R4** | **Celíaco (`FATAL`) + traços de glúten (`cross_contamination`)** | **`BLOCKED`** |
| R5 | `HIGH` + alérgeno presente | `DANGER` |
| R6 | `MEDIUM`/`LOW` + alérgeno presente | `WARNING` |
| R7 | Múltiplos conflitos | Risco mais alto prevalece |
| R8 | Múltiplos conflitos | **Todos retornados** (sem omissão) |

**Níveis de Risco:**
```
⛔ BLOCKED  — Celíaco ou produto sem ingredientes
⚠️ DANGER   — Alérgeno de alta severidade
🟡 WARNING  — Alérgeno de baixa/média severidade
✅ SAFE     — Nenhum conflito encontrado
```

**Endpoint previsto (próxima fase):**
```bash
POST /compatibility/check
Body: { "userId": "uuid", "productId": "uuid" }
Response: { "isCompatible": bool, "riskLevel": "BLOCKED", "conflicts": [...], "reasoning": "..." }
```

---

### 🌐 FEAT-004 — Frontend Web App + Landing Page

#### Web App (Next.js 14 — porta 3001)

| Rota | Descrição |
|:-----|:----------|
| `/` | Dashboard com verificações recentes |
| `/auth/register` | Cadastro de usuário |
| `/auth/login` | Login |
| `/profile` | Configuração do Perfil Alimentar |

**Arquitetura do frontend:**
```
src/api/                   ← ÚNICA camada autorizada a chamar o backend
├── client.ts              ← fetch base com regra arquitetural documentada
├── iam.ts                 ← POST /iam/register | POST /iam/login
├── food-profile.ts        ← POST/GET /food-profile
└── compatibility.ts       ← POST /compatibility/check
```

> ⚠️ **Regra Fundamental (`FRONTEND_STRATEGY.md`):** O `AllergenEngine` reside **exclusivamente no backend**. O frontend **nunca** recalcula compatibilidade — sempre consulta `POST /compatibility/check`.

#### Landing Page (Next.js 14 — porta 3002)

- Output estático (`next export`) — isolada da aplicação principal
- Seções: Hero, Stats, Como Funciona, Demo de Riscos, CTA, Footer
- SEO: title, meta description, Open Graph, heading hierarchy
- Zero chamadas de API

---

## 🧪 Testes

```bash
cd backend
npm test
```

```
Test Suites: 8 passed, 8 total
Tests:       53 passed, 53 total
Coverage:    98% statements | 96% branches | 100% functions
```

**Suítes:**
- `domain/Result.spec.ts`
- `domain/iam/Email.spec.ts`
- `domain/iam/PasswordHash.spec.ts`
- `domain/iam/User.spec.ts`
- `domain/food-profile/SeverityLevel.spec.ts`
- `domain/food-profile/Restriction.spec.ts`
- `domain/food-profile/FoodProfile.spec.ts`
- `domain/allergen-engine/AllergenEngine.spec.ts` ← 9 casos críticos de segurança alimentar

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

**Bounded Contexts:**
| Contexto | Status | Responsabilidade |
|:---------|:-------|:----------------|
| **IAM** | ✅ Implementado | Cadastro, autenticação, roles |
| **Perfil Alimentar** | ✅ Implementado | Restrições e severidades |
| **Compatibilidade Alimentar** | ✅ Motor implementado | Match perfil ↔ produto |
| **Catálogo de Produtos** | 🔜 Próximo | Produtos, ingredientes, parceiros |
| **Administração** | 🔜 Futuro | Moderação, denúncias |

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

---

## 📚 Documentação

| Arquivo | Conteúdo |
|:--------|:---------|
| [`docs/PRD.md`](docs/PRD.md) | Requisitos do produto |
| [`docs/DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md) | Bounded contexts e regras |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema e estratégia de persistência |
| [`docs/FRONTEND_STRATEGY.md`](docs/FRONTEND_STRATEGY.md) | Regras de interface |
| [`docs/ALLERGEN_ENGINE.md`](docs/ALLERGEN_ENGINE.md) | Especificação do motor ⚠️ |
| [`docs/api-contracts/OPENAPI.md`](docs/api-contracts/OPENAPI.md) | Contratos de API |
| [`AGENTS.md`](AGENTS.md) | Regras de governança para IAs |
| [`harness/guardrails.md`](harness/guardrails.md) | Restrições de segurança |

---

## 🔒 Segurança & Governança

- **`.env` nunca commitado** — apenas `.env.example` no repositório
- **Motor de Alérgenos:** 100% das alterações exigem aprovação humana
- **JWT em memória** no frontend — não armazenado em `localStorage`
- **Seeds apenas** em ambiente local — nunca dados reais de usuários
- **Agente de IA** segue `AGENTS.md` + `harness/guardrails.md` a cada tarefa

---

## 🗓️ Histórico de Entregas

| Data | Feature | Descrição |
|:-----|:--------|:----------|
| 2026-06-29 | FEAT-001 | Módulo IAM completo (22 testes) |
| 2026-06-30 | FEAT-002 | Perfil Alimentar (FoodProfile + Restriction) |
| 2026-06-30 | FEAT-003 | Motor de Alérgenos com 9 casos críticos |
| 2026-07-01 | FEAT-004 | Frontend Web App + Landing Page (Next.js 14) |
