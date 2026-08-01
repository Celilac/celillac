
---
| Atributo | Descrição |
| :--- | :--- |
| **Objetivo** | Definir a persistência e segurança dos dados. |
| **Quem consulta** | Agentes de IA e Desenvolvedores Backend/Mobile |
| **Decisões que controla** | Schema, Migrations e Seeds. |
| **Validação Humana** | Alterações de Schema (Migrations). |
---
# DATABASE.md — Estratégia de Persistência CeLiLac

---

## 1. Separação de Ambientes

O sistema usa **3 ambientes isolados** de banco de dados. O agente tem acesso apenas ao ambiente **local de desenvolvimento**.

| Ambiente | Banco | Host | Uso | Agente pode acessar? |
|:---------|:------|:-----|:----|:--------------------:|
| **Local (Dev)** | `celilac_db` | localhost:5432 | Desenvolvimento e testes manuais | ✅ Sim |
| **Teste (CI)** | `celilac_test_db` | localhost:5432 (ou CI service) | Testes automatizados (`npm test`) | ✅ Sim (somente leitura de config) |
| **Produção** | `celilac_db` (remoto) | Host remoto (confidencial) | Dados reais de usuários | ❌ **NUNCA** |

> ⚠️ **O agente não tem e nunca deve ter credenciais de produção.** Qualquer tentativa de acesso a dados de produção é uma violação grave dos guardrails.

---

## 2. Ambiente Local (Docker)

Executado via `docker-compose up -d` na raiz do projeto.

```bash
Host:     localhost
Porta:    5432
Usuário:  celilac_user
Senha:    celilac_password
Banco:    celilac_db
```

**Inicialização automática:**
- `harness/scripts/init_db.sql` — cria tabelas base (users, food_profiles)
- `harness/scripts/migrations/001_create_products_table.sql`
- `harness/scripts/migrations/002_create_product_reports_table.sql`
- `harness/scripts/migrations/003_create_product_reviews_table.sql`

---

## 3. Ambiente de Teste (CI/Local)

Usado quando `NODE_ENV=test`. Banco separado para evitar contaminação de dados entre testes e desenvolvimento.

```bash
Host:     localhost
Porta:    5432
Banco:    celilac_test_db   ← banco separado do dev!
Usuário:  celilac_user
Senha:    celilac_password
```

O banco de teste é recriado a cada execução do CI (`ci-develop.yml`). Testes unitários **não** usam banco (domínio puro com mocks). Apenas testes de integração usam este banco.

---

## 4. Estrutura de Tabelas (Schema Atual)

### Tabela: `users` (IAM)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `email` | VARCHAR | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR | NOT NULL |
| `role` | ENUM | `CELIACO`, `PARCEIRO`, `ADMIN` |
| `whatsapp_phone` | VARCHAR(20) | Opcional. Formato E.164 com DDI do Brasil obrigatório (`+55DDDNNNNNNNNN`) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

> Nota: `full_name`, `birth_date`, `gender`, `avatar_url`, `account_status`, `profile_evaluation_status`
> e `is_email_verified` também existem na tabela (migration 013) mas ainda não foram
> documentados aqui — fora do escopo desta atualização.

### Tabela: `consumers` (Consumidores)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users.id, UNIQUE, NOT NULL |
| `general_preferences` | JSONB | Preferências gerais do consumidor |
| `is_food_profile_complete` | BOOLEAN | DEFAULT false |
| `is_food_profile_critical` | BOOLEAN | DEFAULT false |
| `status` | VARCHAR | `CONTA_CRIADA`, `PERFIL_INCOMPLETO`, `PERFIL_CONFIGURADO`, `PERFIL_CRITICO`, `ATIVO`, `INATIVO` |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `food_profiles` (Perfil Alimentar)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users.id, NOT NULL |
| `restrictions` | JSONB | Armazena lista de `{ allergen, severity, type, notes }` |
| `accepts_cross_contamination` | BOOLEAN | DEFAULT false |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `partner_favorites` (Favoritos de Parceiros)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `consumer_id` | UUID | FK → users.id |
| `partner_id` | UUID | FK → partners.id |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `partner_reviews` (Avaliações de Parceiros)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `consumer_id` | UUID | FK → users.id |
| `partner_id` | UUID | FK → partners.id |
| `rating` | INTEGER | 1–5, NOT NULL |
| `comment` | TEXT | Opcional |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `partner_reports` (Denúncias de Parceiros)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `reporter_id` | UUID | FK → users.id |
| `partner_id` | UUID | FK → partners.id |
| `reason` | VARCHAR | Motivo da denúncia |
| `details` | TEXT | Opcional |
| `is_food_safety_risk` | BOOLEAN | DEFAULT false (Colocado no topo da fila de moderação se true) |
| `status` | VARCHAR | DEFAULT `PENDING` |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `products` (Catálogo)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `name` | VARCHAR | NOT NULL |
| `brand` | VARCHAR | |
| `ingredients` | TEXT | |
| `has_gluten` | BOOLEAN | DEFAULT false |
| `cross_contamination` | TEXT | NOT NULL (campo obrigatório) |
| `status` | VARCHAR | DEFAULT `PENDING_ANALYSIS` |
| `created_by` | UUID | FK → users.id |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `product_reviews` (Avaliações)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users.id |
| `product_id` | UUID | FK → products.id |
| `rating` | INTEGER | 1–5, NOT NULL |
| `comment` | TEXT | Opcional |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| *(constraint)* | UNIQUE | `(user_id, product_id)` — 1 avaliação por produto por usuário |

### Tabela: `product_reports` (Denúncias)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `reporter_id` | UUID | FK → users.id |
| `product_id` | UUID | FK → products.id |
| `reason` | VARCHAR | `INCORRECT_INGREDIENTS`, `MISSING_ALLERGEN`, etc. |
| `details` | TEXT | |
| `is_food_safety_risk` | BOOLEAN | DEFAULT false (Priorizado no topo da fila de moderação) |
| `status` | VARCHAR | DEFAULT `PENDING` |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `blacklisted_tokens` (Tokens Revogados - Blacklist)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `token` | TEXT | PK |
| `expires_at` | TIMESTAMP | NOT NULL |
| *(índice)* | INDEX | `idx_blacklisted_tokens_expires_at` — otimiza queries de limpeza/expiração |

---

## 5. Estratégia de Migrations

- Migrations criadas em `harness/scripts/migrations/` com numeração sequencial (`001_`, `002_`...).
- Nomeadas de forma descritiva: `001_create_products_table.sql`.
- **Migrations aplicadas nunca devem ser editadas** — crie uma nova migration para alterar.
- O agente de IA **só pode criar** migrations após aprovação do plano de dados pelo humano.
- O agente **nunca pode executar** migrations em produção.

| Ação | Agente pode? |
|:-----|:------------:|
| Criar nova migration local | ✅ (com aprovação) |
| Editar migration já aplicada | ❌ |
| Aplicar migration em produção | ❌ |
| Reverter migration aplicada | ❌ |

---

## 6. Estratégia de Seed

Seeds populam o banco **local** com dados fictícios para desenvolvimento e testes manuais.

- **Script principal:** `harness/scripts/seed.ts` — executa via `npx ts-node harness/scripts/seed.ts`
- **Script de init:** `harness/scripts/init_db.sql` — executado automaticamente pelo Docker na criação do container

### Dados que NUNCA devem aparecer no ambiente do agente:
- Nomes reais de pessoas (CPF, endereços, telefones)
- E-mails reais de usuários de produção
- Senhas, tokens ou chaves de API reais
- Dados de saúde vinculados a identidades reais
- Dados financeiros (cartões, extratos)

O seed usa sempre dados fictícios gerados (ex: `ana.teste@celilac.dev`, `carlos.parceiro@celilac.dev`).

---

## 7. Comandos Permitidos e Proibidos para o Agente

| Comando | Contexto | Permitido? |
|:--------|:---------|:----------:|
| `docker-compose up -d` | Subir banco local | ✅ |
| `docker-compose down` | Derrubar banco local | ✅ |
| `npx ts-node harness/scripts/seed.ts` | Popular banco local | ✅ |
| `psql -h localhost -U celilac_user -d celilac_db` | Consultar banco local | ✅ |
| Criar nova migration em `harness/scripts/migrations/` | Com aprovação | ✅ (com aprovação) |
| Editar migration já aplicada | Qualquer ambiente | ❌ |
| Acessar banco de produção | Qualquer ferramenta | ❌ |
| `DROP TABLE` sem plano aprovado | Qualquer ambiente | ❌ |
| `DELETE FROM` sem plano aprovado | Qualquer ambiente | ❌ |

