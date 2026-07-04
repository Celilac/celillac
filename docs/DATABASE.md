
---
| Atributo | Descrição |
| :--- | :--- |
| **Objetivo** | Definir a persistência e segurança dos dados. |
| **Quem consulta** | Agentes de IA e Desenvolvedores Backend/Mobile |
| **Decisões que controla** | Schema, Migrations e Seeds. |
| **Validação Humana** | Alterações de Schema (Migrations). |
---
# DATABASE.md - Estratégia de Persistência CeLiLac

## Ambiente Local (Docker)
- **Host:** localhost
- **Porta:** 5432
- **Usuário:** celilac_user
- **Senha:** celilac_password
- **Banco:** celilac_db

## Estrutura de Tabelas (Esquema Inicial)

### Tabela: users (IAM)
- `id` (UUID, PK)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (Enum: CELIACO, PARCEIRO, ADMIN)

### Tabela: food_profiles (Perfil Alimentar)
- `id` (UUID, PK)
- `user_id` (FK -> users.id)
- `restrictions` (JSONB) - Armazena a lista de alérgenos e níveis de sensibilidade.

### Tabela: products (Catálogo)
- `id` (UUID, PK)
- `name` (String)
- `ingredients` (Text)
- `has_gluten` (Boolean)
- `cross_contamination` (Text)

### Tabela: product_reviews (Avaliações)
- `id` (UUID, PK)
- `user_id` (FK -> users.id)
- `product_id` (FK -> products.id)
- `rating` (Integer 1-5)
- `comment` (Text, Opcional)
- `created_at` (Timestamp)
- *UNIQUE constraint no par (user_id, product_id)*

## Migrações
As migrações devem ser criadas via `TypeORM/Sequelize` e nunca editadas manualmente após o commit. O agente de IA só pode aplicar migrações após aprovação do plano de dados.
