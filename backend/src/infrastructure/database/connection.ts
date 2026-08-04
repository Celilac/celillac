// backend/src/infrastructure/database/connection.ts
import { Pool } from 'pg';

/**
 * Singleton de conexão com o PostgreSQL.
 * Variáveis carregadas do .env via dotenv (inicializado em index.ts).
 * Credenciais do docker-compose.yml (DATABASE.md).
 */
export const pool = new Pool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME     ?? 'celilac_db',
  user:     process.env.DB_USER     ?? 'celilac_user',
  password: process.env.DB_PASSWORD ?? 'celilac_password',
});

/**
 * Testa a conexão com o banco ao inicializar e sincroniza o esquema essencial.
 * Garante que todas as tabelas e colunas do sistema existam de forma resiliente.
 */
export async function testDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        full_name VARCHAR(255),
        birth_date DATE,
        gender VARCHAR(50),
        avatar_url TEXT,
        account_status VARCHAR(50) DEFAULT 'ACTIVE',
        profile_evaluation_status VARCHAR(50) DEFAULT 'PENDING_EVALUATION',
        is_email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'ACTIVE';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_evaluation_status VARCHAR(50) DEFAULT 'PENDING_EVALUATION';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;

      CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
      CREATE INDEX IF NOT EXISTS idx_users_profile_evaluation ON users(profile_evaluation_status);

      CREATE TABLE IF NOT EXISTS food_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        restrictions JSONB NOT NULL,
        accepts_cross_contamination BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS food_profiles_user_id_idx ON food_profiles (user_id);

      CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        token TEXT PRIMARY KEY,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_email_verifications_user_code ON email_verifications(user_id, code);
      CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

      CREATE TABLE IF NOT EXISTS consumers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        general_preferences JSONB DEFAULT '{}'::jsonb,
        is_food_profile_complete BOOLEAN DEFAULT false,
        is_food_profile_critical BOOLEAN DEFAULT false,
        status VARCHAR(50) NOT NULL DEFAULT 'CONTA_CRIADA',
        status_changed_at TIMESTAMP,
        status_changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        status_change_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE consumers ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP;
      ALTER TABLE consumers ADD COLUMN IF NOT EXISTS status_changed_by UUID;
      ALTER TABLE consumers ADD COLUMN IF NOT EXISTS status_change_reason TEXT;

      CREATE TABLE IF NOT EXISTS partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20),
        description TEXT,
        address TEXT NOT NULL,
        phone VARCHAR(50),
        type VARCHAR(50) DEFAULT 'RESTAURANT',
        approval_status VARCHAR(50) DEFAULT 'DRAFT',
        operational_status VARCHAR(50) DEFAULT 'INACTIVE',
        rejection_reason TEXT,
        suspension_reason TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        delivery_region TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE partners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        ingredients TEXT NOT NULL,
        allergens JSONB NOT NULL,
        cross_contamination VARCHAR(255),
        category VARCHAR(100),
        price NUMERIC(10,2),
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        analysis_status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS product_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
        reason VARCHAR(100) NOT NULL,
        details TEXT,
        is_food_safety_risk BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_product_or_partner_report CHECK (product_id IS NOT NULL OR partner_id IS NOT NULL)
      );

      ALTER TABLE product_reports ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_product_reports_partner ON product_reports(partner_id);
      CREATE INDEX IF NOT EXISTS idx_product_reports_product ON product_reports(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_reports_food_safety ON product_reports(is_food_safety_risk);

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        actor_id UUID,
        actor_role VARCHAR(50),
        changes JSONB NOT NULL DEFAULT '{}'::jsonb,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `);
    console.log('[Database]: Conexão e sincronização de esquema com PostgreSQL estabelecida com sucesso.');
  } finally {
    client.release();
  }
}
