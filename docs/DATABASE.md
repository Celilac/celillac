
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
| `can_pay_on_delivery` | BOOLEAN | NOT NULL DEFAULT true (Migration 028: elegibilidade para pagamento presencial) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `partners` (Catálogo de Parceiros)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users.id, NOT NULL |
| `name` | VARCHAR(255) | Nome comercial / Razão social, NOT NULL |
| `cnpj` | VARCHAR(20) | Opcional. Se informado, validado via Módulo 11 da Receita Federal e formatado (99.999.999/9999-99) |
| `description` | TEXT | Descrição do negócio |
| `address` | TEXT | Endereço completo georreferenciado via Google Maps, NOT NULL |
| `phone` | VARCHAR(50) | Telefone / WhatsApp de contato no padrão internacional E.164 (ex: +5511999998888) |
| `type` | VARCHAR(50) | `RESTAURANT`, `MARKET`, `INDEPENDENT_PRODUCER` |
| `approval_status` | VARCHAR(50) | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED` |
| `operational_status` | VARCHAR(50) | `ACTIVE`, `INACTIVE`, `TEMPORARILY_CLOSED` |
| `rejection_reason` | TEXT | Motivo em caso de rejeição |
| `suspension_reason` | TEXT | Motivo em caso de suspensão |
| `city` | VARCHAR(100) | Cidade do estabelecimento |
| `state` | VARCHAR(50) | UF / Estado |
| `delivery_region` | TEXT | Região de atendimento / entrega |
| `logo_url` | TEXT | DataURL / URL da marca do estabelecimento (logotipo) |
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

### Tabela: `product_reports` (Denúncias Unificadas — Produtos, Parceiros, Usuários e Pedidos)
> Unificada via Migration 014 e expandida na Migration 028 com suporte a denúncia de não-pagamento / pedido.

| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `reporter_id` | UUID | FK → users.id, NOT NULL |
| `product_id` | UUID | FK → products.id, ON DELETE CASCADE (Opcional) |
| `partner_id` | UUID | FK → partners.id, ON DELETE CASCADE (Opcional) |
| `target_user_id` | UUID | FK → users.id, ON DELETE SET NULL (Opcional - Migration 028) |
| `order_id` | UUID | FK → orders.id, ON DELETE SET NULL (Opcional - Migration 028) |
| `reason` | VARCHAR(100) | Motivo da denúncia |
| `details` | TEXT | Detalhamento da ocorrência |
| `is_food_safety_risk` | BOOLEAN | DEFAULT false (Prioridade máxima se true) |
| `status` | VARCHAR(50) | DEFAULT `PENDING` (`PENDING`, `INVESTIGATING`, `RESOLVED`, `DISMISSED`) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |
| *(índices e check)* | CONSTRAINT | `check_report_target`: Exige ao menos 1 alvo (`product_id`, `partner_id`, `target_user_id` ou `order_id`) |

### Tabela: `products` (Catálogo)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `name` | VARCHAR | NOT NULL |
| `brand` | VARCHAR | |
| `ingredients` | TEXT | |
| `has_gluten` | BOOLEAN | DEFAULT false |
| `cross_contamination` | TEXT | NOT NULL (campo obrigatório) |
| `category` | VARCHAR(100) | Nome textual da categoria |
| `category_id` | UUID | FK → product_categories.id (Opcional) |
| `status` | VARCHAR | DEFAULT `PENDING_ANALYSIS` |
| `partner_id` | UUID | FK → partners.id |
| `price` | NUMERIC(10,2) | Preço unitário |
| `image_url` | TEXT | Imagem do produto |
| `is_active` | BOOLEAN | DEFAULT true |
| `short_description` | TEXT | Breve descrição comercial do produto |
| `net_content` | NUMERIC(10,2) | Peso líquido ou volume numérico (ex: 500, 1.5) |
| `unit_of_measure` | VARCHAR(20) | Unidade de medida (g, kg, ml, L, un) |
| `sku` | VARCHAR(100) | Código de referência/estoque interno |
| `ean` | VARCHAR(14) | Código de barras / EAN (8 a 14 dígitos) |
| `commercial_origin` | VARCHAR(50) | `OWN_MANUFACTURE` (Fabricação Própria) ou `THIRD_PARTY_RESELL` (Revenda) |
| `may_contain_traces`| TEXT | Declaração de traços ("Pode Conter") RDC 727/2022 |
| `composition_notes` | TEXT | Observações técnicas sobre a composição |
| `publication_status`| VARCHAR(50) | `DRAFT`, `PUBLISHED`, `INACTIVE` |
| `declared_allergens`| JSONB | Mapa de 10 alérgenos e situações (`FREE`, `CONTAINS`, `TRACES`, `NOT_INFORMED`) |
| `cross_contamination_details` | JSONB | Risco de ambiente discriminado por restrição e protocolos |
| `dietary_features` | TEXT[] | Tags de estilo de vida (`VEGAN`, `VEGETARIAN`, `NO_ADDED_SUGAR`, `SUGAR_FREE`, `ORGANIC`, `KOSHER`, `HALAL`) |
| `information_origin`| VARCHAR(50) | `PARTNER_DECLARED`, `LABEL_EXTRACTED`, `MANUFACTURER_PROVIDED`, `VERIFIED_BY_CELILAC` |
| `nutritional_info`  | JSONB | Informações nutricionais (porção, calorias, macros, sódio) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `product_images` (Galeria de Imagens e Evidências)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `product_id` | UUID | FK → products.id (ON DELETE CASCADE) |
| `url` | TEXT | URL ou Data URL da imagem comprimida (NOT NULL) |
| `image_type` | VARCHAR(50) | `PRODUCT`, `PACKAGING`, `LABEL`, `INGREDIENTS`, `NUTRITIONAL_INFO`, `CERTIFICATION` |
| `caption` | VARCHAR(255) | Legenda opcional da foto |
| `display_order` | INT | Ordem de exibição na galeria (DEFAULT 0) |
| `is_cover` | BOOLEAN | Indica se é a imagem de capa principal (DEFAULT false) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `product_certifications` (Selos, Certificações e Evidências Auditáveis)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `product_id` | UUID | FK → products.id (ON DELETE CASCADE) |
| `certification_type` | VARCHAR(60) | Tipo do selo (ex: `GLUTEN_FREE_ACELBRA`, `VEGAN_SVB`, `ORGANIC_BRASIL`, `KOSHER`, `HALAL`, `OTHER`) |
| `certifying_entity` | VARCHAR(150) | Nome da entidade certificadora oficial |
| `certificate_code` | VARCHAR(100) | Código de registro ou número da certificação |
| `valid_until` | DATE | Data de validade da certificação (opcional) |
| `image_id` | UUID | FK → product_images.id (vínculo opcional com foto do laudo na galeria) |
| `verification_status` | VARCHAR(30) | `DECLARED_BY_PARTNER`, `VERIFIED_BY_CELILAC`, `REJECTED` |
| `verification_notes` | TEXT | Parecer da equipe de auditoria CeLiLac |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

### Tabela: `product_categories` (Categorias e Moderação)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `name` | VARCHAR(100) | Nome da categoria, NOT NULL |
| `normalized_name` | VARCHAR(100) | Identificador normalizado para controle de duplicidade |
| `partner_id` | UUID | FK → partners.id (Opcional, preenchido se criada por parceiro) |
| `created_by_user_id` | UUID | FK → users.id |
| `status` | VARCHAR(50) | `PENDING_APPROVAL`, `APPROVED`, `REJECTED` |
| `visibility` | VARCHAR(50) | `GLOBAL` (pública para todos), `RESTRICTED` (restrita ao parceiro) |
| `rejection_reason` | TEXT | Motivo em caso de rejeição |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

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

### Tabela: `product_reports` (Denúncias Polimórficas — Produto ou Parceiro)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `reporter_id` | UUID | FK → users.id |
| `product_id` | UUID | FK → products.id (Opcional se `partner_id` preenchido) |
| `partner_id` | UUID | FK → partners.id (Opcional se `product_id` preenchido) |
| `reason` | VARCHAR | `INCORRECT_INGREDIENTS`, `MISSING_ALLERGEN`, `WRONG_CROSS_CONTAMINATION`, `OTHER` |
| `details` | TEXT | Opcional |
| `is_food_safety_risk` | BOOLEAN | DEFAULT false (Priorizado no topo da fila de moderação se true) |
| `status` | VARCHAR | DEFAULT `PENDING` (`PENDING`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |
| *(constraint)* | CHECK | `(product_id IS NOT NULL OR partner_id IS NOT NULL)` |


### Tabela: `blacklisted_tokens` (Tokens Revogados - Blacklist)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `token` | TEXT | PK |
| `expires_at` | TIMESTAMP | NOT NULL |
| *(índice)* | INDEX | `idx_blacklisted_tokens_expires_at` — otimiza queries de limpeza/expiração |

### Tabela: `orders` (Pedidos do Consumidor aos Parceiros)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `consumer_id` | UUID | FK → users.id, NOT NULL |
| `partner_id` | UUID | FK → partners.id, NOT NULL |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT `'CREATED'` (`CREATED`, `AWAITING_PAYMENT`, `PAID`, `CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`) |
| `subtotal_amount` | NUMERIC(10,2) | NOT NULL |
| `delivery_fee` | NUMERIC(10,2) | NOT NULL, DEFAULT 0.00 |
| `total_amount` | NUMERIC(10,2) | NOT NULL |
| `allergen_check_verdict`| VARCHAR(50) | NOT NULL, DEFAULT `'SAFE'` |
| `notes` | TEXT | Instruções adicionais do consumidor |
| `cancelled_at` | TIMESTAMP WITH TIME ZONE | Data de cancelamento (se houver) |
| `cancel_reason` | TEXT | Justificativa do cancelamento |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| *(índices)* | INDEX | `idx_orders_consumer_id`, `idx_orders_partner_id`, `idx_orders_status`, `idx_orders_created_at` |

### Tabela: `order_items` (Itens de Pedidos)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `order_id` | UUID | FK → orders.id (ON DELETE CASCADE), NOT NULL |
| `product_id` | UUID | FK → products.id, NOT NULL |
| `product_name` | VARCHAR(255) | Snapshot do nome do produto no momento da compra |
| `unit_price` | NUMERIC(10,2) | Snapshot do preço unitário do item |
| `quantity` | INT | Quantidade comprada (> 0) |
| `total_price` | NUMERIC(10,2) | Subtotal do item (`unit_price * quantity`) |
| *(índice)* | INDEX | `idx_order_items_order_id` |

### Tabela: `partner_financial_accounts` (Subcontas de Pagamento e Chaves PIX do Parceiro)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `partner_id` | UUID | FK → partners.id, UNIQUE, NOT NULL |
| `gateway_subaccount_id` | VARCHAR(255) | Identificador da subconta no gateway Asaas |
| `pix_key` | VARCHAR(150) | Chave PIX cadastrada para recebimento |
| `pix_key_type` | VARCHAR(20) | `CNPJ`, `CPF`, `EMAIL`, `PHONE`, `RANDOM` |
| `bank_code` | VARCHAR(10) | Código COMPE do banco (ex: 260) |
| `agency_number` | VARCHAR(10) | Agência bancária |
| `account_number` | VARCHAR(20) | Número da conta bancária |
| `account_type` | VARCHAR(20) | `CHECKING`, `SAVINGS` |
| `is_verified` | BOOLEAN | DEFAULT FALSE |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| *(índices)* | INDEX | `idx_partner_financial_accounts_partner_id`, `idx_partner_financial_accounts_subaccount` |

### Tabela: `payments` (Transações de Pagamento e Split)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `order_id` | UUID | FK → orders.id, NOT NULL |
| `consumer_id` | UUID | FK → users.id, NOT NULL |
| `partner_id` | UUID | FK → partners.id, NOT NULL |
| `gateway` | VARCHAR(50) | DEFAULT `'ASAAS'` |
| `gateway_transaction_id` | VARCHAR(255) | ID da cobrança gerada na Asaas |
| `method` | VARCHAR(50) | `PIX`, `CREDIT_CARD` |
| `status` | VARCHAR(50) | DEFAULT `'PENDING'` (`PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED`) |
| `gross_amount` | NUMERIC(10,2) | Valor bruto total cobrado |
| `net_partner_amount` | NUMERIC(10,2) | Valor líquido repassado ao parceiro comercial |
| `platform_fee_amount` | NUMERIC(10,2) | Comissão de marketplace da plataforma CeLiLac (12%) |
| `pix_qr_code` | TEXT | URL / Imagem base64 do QR Code PIX gerado |
| `pix_copy_paste` | TEXT | Linha digitável / Payload Copia-e-Cola PIX (EMVCo) |
| `pix_expires_at` | TIMESTAMP WITH TIME ZONE | Data e hora de expiração da chave dinâmica PIX |
| `paid_at` | TIMESTAMP WITH TIME ZONE | Timestamp de confirmação do pagamento |
| `failure_reason` | TEXT | Motivo de falha caso rejeitado |
| `idempotency_key` | VARCHAR(100) | Chave única de idempotência anti-duplicidade (Migration 027) |
| `change_for` | NUMERIC(10,2) | Valor para troco em dinheiro (Migration 028) |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| *(índices)* | INDEX | `idx_payments_order_id`, `idx_payments_gateway_transaction_id`, `idx_payments_partner_id`, `idx_payments_consumer_id`, `idx_payments_status`, `idx_payments_idempotency_key` |

### Tabela: `payment_refunds` (Estornos e Reembolsos de Pagamento)
| Coluna | Tipo | Restrições |
|:-------|:-----|:-----------|
| `id` | UUID | PK |
| `payment_id` | UUID | FK → payments.id, NOT NULL |
| `gateway_refund_id` | VARCHAR(255) | ID do estorno registrado no gateway Asaas |
| `refund_amount` | NUMERIC(10,2) | Valor estornado |
| `reason` | TEXT | Motivo do cancelamento / reembolso |
| `status` | VARCHAR(50) | DEFAULT `'PENDING'` (`PENDING`, `COMPLETED`, `FAILED`) |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| *(índice)* | INDEX | `idx_payment_refunds_payment_id` |

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

