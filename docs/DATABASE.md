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

## Migrações
As migrações devem ser criadas via `TypeORM/Sequelize` e nunca editadas manualmente após o commit. O agente de IA só pode aplicar migrações após aprovação do plano de dados.
