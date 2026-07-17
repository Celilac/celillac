# ARCHITECTURE.md — Clean Architecture no CeLiLac Backend

> **Quem deve consultar:** Agentes de IA, Desenvolvedores Backend
> **Decisões que controla:** Estrutura de pastas, separação de responsabilidades, direção das dependências
> **Alterações que exigem validação humana:** Mudanças na direção das dependências ou adição de novas camadas

---

## 1. Visão Geral das Camadas

O backend segue **Clean Architecture** (Robert C. Martin). As dependências apontam **sempre para dentro** — em direção ao domínio.

```
┌─────────────────────────────────────────────┐
│          interfaces/  (HTTP Controllers)     │  ← Camada mais externa
├─────────────────────────────────────────────┤
│          infrastructure/  (PostgreSQL, pg)   │
├─────────────────────────────────────────────┤
│          application/  (Use Cases)           │
├─────────────────────────────────────────────┤
│          domain/  (Entities, VOs, Services)  │  ← Camada mais interna (núcleo puro)
└─────────────────────────────────────────────┘

Direção das dependências: interfaces → infrastructure → application → domain
O domain NÃO importa nada das camadas externas.
```

---

## 2. Detalhamento das Camadas no CeLiLac

### 2.1 Domain (`backend/src/domain/`)
O núcleo do sistema. **Zero dependências externas** (nem Express, nem pg, nem bcrypt).

| O que contém | Exemplos no CeLiLac |
|:-------------|:--------------------|
| **Entidades** | `User`, `Product`, `FoodProfile`, `Review`, `Report` |
| **Value Objects** | `Email`, `PasswordHash`, `SeverityLevel`, `RiskLevel`, `AllergenType` |
| **Services de Domínio** | `AllergenEngine` — lógica pura sem estado nem I/O |
| **Interfaces de Repositório (Ports)** | `IUserRepository`, `IProductRepository`, `IFoodProfileRepository` |
| **Regras de negócio** | "FATAL + traços = BLOCKED", "Perfil sem restrições = SAFE" |

> ℹ️ **Services de Domínio** são usados quando a lógica de negócio não pertence a uma única entidade. O `AllergenEngine` é o exemplo principal: ele coordena `FoodProfile` e `ProductSnapshot` sem ser dono de nenhum dos dois.

### 2.2 Application (`backend/src/application/`)
Casos de uso — orquestram operações entre domínio e infraestrutura.

| O que contém | Exemplos no CeLiLac |
|:-------------|:--------------------|
| **Use Cases** | `CheckCompatibilityUseCase`, `CreateProductUseCase`, `SubmitReviewUseCase` |
| **DTOs de entrada/saída** | `CheckCompatibilityInput`, `CreateProductOutput` |
| **Orquestração** | Chama repositórios (via interface), chama `AllergenEngine`, retorna resultado |

> ℹ️ Use Cases **não contêm regra de negócio** — eles coordenam. A regra fica no domínio.

### 2.3 Infrastructure (`backend/src/infrastructure/`)
Implementações técnicas que satisfazem os contratos definidos no domínio.

| O que contém | Exemplos no CeLiLac |
|:-------------|:--------------------|
| **Repositórios (Adapters)** | `PgUserRepository implements IUserRepository` |
| **Acesso ao banco** | Queries SQL via `pg.Pool` |
| **Serviços externos** | Clientes de e-mail, storage (futuros) |

> ℹ️ A infraestrutura **implementa** as interfaces (Ports) definidas no domínio. Nunca o contrário.

### 2.4 Interfaces (`backend/src/interfaces/`)
Ponto de entrada do sistema. Converte dados externos para o formato interno e vice-versa.

| O que contém | Exemplos no CeLiLac |
|:-------------|:--------------------|
| **Controllers HTTP** | `CompatibilityController`, `CatalogController`, `IAMController` |
| **Middlewares** | `AuthMiddleware` (JWT), `SecurityMiddleware` (CORS, headers) |
| **Rotas Express** | `compatibility.routes.ts`, `catalog.routes.ts` |
| **Validação de entrada** | Parse e validação de `req.body` antes de chamar Use Case |

---

## 3. Regras Obrigatórias para o Agente

Estas são as **6 regras de ouro** que o agente DEVE seguir em qualquer implementação no backend:

| # | Regra | Exemplo de violação (PROIBIDO) |
|:--|:------|:-------------------------------|
| **R1** | **Controller não pode conter regra de negócio** | `if (product.hasGluten && profile.isActive()) { ... }` no controller |
| **R2** | **Regra de compatibilidade alimentar pertence ao domínio** | Calcular `riskLevel` no Use Case sem chamar `AllergenEngine` |
| **R3** | **Acesso ao banco não fica dentro de entidade** | `User.findById(id)` onde `findById` faz query SQL |
| **R4** | **Use Cases coordenam — não decidem** | Use Case com `if/else` de regra de negócio alimentar |
| **R5** | **Infraestrutura implementa contratos do domínio** | Repositório que não implementa a interface definida em `domain/` |
| **R6** | **Dependências apontam para dentro** | `domain/` importando qualquer coisa de `infrastructure/` |

---

## 4. Padrão Ports & Adapters

O CeLiLac usa o padrão Ports & Adapters para desacoplar domínio da infraestrutura:

```typescript
// PORT — definido no domínio (domain/iam/repositories/IUserRepository.ts)
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// ADAPTER — implementado na infraestrutura (infrastructure/repositories/PgUserRepository.ts)
export class PgUserRepository implements IUserRepository {
  constructor(private pool: pg.Pool) {}
  async findByEmail(email: string): Promise<User | null> { /* SQL */ }
  async save(user: User): Promise<void> { /* SQL */ }
}
```

O Use Case recebe `IUserRepository` (port), não `PgUserRepository` (adapter). Isso permite testar o domínio com mocks sem banco de dados.

---

## 5. Diagrama de Dependências (Fluxo de uma Requisição)

```
HTTP Request
     │
     ▼
[Controller] → valida entrada → chama Use Case
     │
     ▼
[Use Case] → busca dados via IRepository (port)
     │        → chama AllergenEngine (domain service)
     │
     ├── [IRepository] ← implementado por [PgRepository] (infrastructure)
     │                         └── pg.Pool → PostgreSQL
     │
     └── [AllergenEngine] ← pure domain, sem I/O
              └── retorna CompatibilityReport
     │
     ▼
[Controller] → formata resposta HTTP → retorna JSON
```

---

## 6. Estrutura de Pastas de Referência

```
backend/src/
├── domain/
│   ├── Entity.ts                          # Classe base de entidade (id)
│   ├── Result.ts                          # Resultado tipado (sucesso/erro)
│   ├── allergen-engine/
│   │   ├── AllergenEngine.ts              # ⚠️ Serviço de domínio crítico
│   │   ├── CompatibilityReport.ts         # Interface de saída do motor
│   │   ├── ProductSnapshot.ts             # Interface de entrada do motor
│   │   └── RiskLevel.ts                   # Enum de risco
│   ├── food-profile/
│   │   ├── FoodProfile.ts                 # Entidade
│   │   ├── Restriction.ts                 # Value Object
│   │   ├── value-objects/
│   │   │   ├── AllergenType.ts            # Enum + termos de busca
│   │   │   └── SeverityLevel.ts           # Enum + ordenação
│   │   └── repositories/
│   │       └── IFoodProfileRepository.ts  # Port (interface)
│   ├── iam/
│   │   ├── User.ts
│   │   ├── value-objects/
│   │   │   ├── Email.ts
│   │   │   └── PasswordHash.ts
│   │   └── repositories/
│   │       └── IUserRepository.ts
│   ├── catalog/
│   │   ├── Product.ts
│   │   └── repositories/
│   │       └── IProductRepository.ts
│   └── reviews/
│       └── Review.ts
├── application/
│   ├── allergen-engine/
│   │   └── CheckCompatibilityUseCase.ts
│   ├── food-profile/
│   │   └── UpdateFoodProfileUseCase.ts
│   ├── catalog/
│   │   ├── CreateProductUseCase.ts
│   │   └── SearchProductsUseCase.ts
│   └── reviews/
│       ├── SubmitReviewUseCase.ts
│       └── GetProductReviewsUseCase.ts
├── infrastructure/
│   └── database/
│       ├── PgUserRepository.ts
│       ├── PgFoodProfileRepository.ts
│       ├── PgProductRepository.ts
│       └── PgReviewRepository.ts
└── interfaces/
    └── http/
        ├── controllers/
        │   ├── CompatibilityController.ts
        │   ├── CatalogController.ts
        │   └── IAMController.ts
        ├── middlewares/
        │   ├── AuthMiddleware.ts
        │   └── SecurityMiddleware.ts
        └── routes/
            ├── compatibility.routes.ts
            ├── catalog.routes.ts
            └── iam.routes.ts
```

