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
      ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20);

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
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url TEXT;
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
      ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS net_content NUMERIC(10, 2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS ean VARCHAR(14);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS commercial_origin VARCHAR(50) DEFAULT 'OWN_MANUFACTURE';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS may_contain_traces TEXT DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS composition_notes TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) DEFAULT 'PUBLISHED';

      CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        image_type VARCHAR(50) NOT NULL DEFAULT 'PRODUCT',
        caption VARCHAR(255),
        display_order INT NOT NULL DEFAULT 0,
        is_cover BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_images_type ON product_images(image_type);
      CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, display_order);

      -- Fase 3: Matriz de Alérgenos Declarados, Risco de Ambiente, Estilos de Vida e Certificações
      ALTER TABLE products ADD COLUMN IF NOT EXISTS declared_allergens JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cross_contamination_details JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_features TEXT[] DEFAULT ARRAY[]::TEXT[];
      ALTER TABLE products ADD COLUMN IF NOT EXISTS information_origin VARCHAR(50) DEFAULT 'PARTNER_DECLARED';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS nutritional_info JSONB DEFAULT NULL;

      CREATE INDEX IF NOT EXISTS idx_products_dietary_features ON products USING GIN(dietary_features);
      CREATE INDEX IF NOT EXISTS idx_products_information_origin ON products(information_origin);

      CREATE TABLE IF NOT EXISTS product_certifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        certification_type VARCHAR(60) NOT NULL,
        certifying_entity VARCHAR(150) NOT NULL,
        certificate_code VARCHAR(100),
        valid_until DATE,
        image_id UUID REFERENCES product_images(id) ON DELETE SET NULL,
        verification_status VARCHAR(30) NOT NULL DEFAULT 'DECLARED_BY_PARTNER',
        verification_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_product_certifications_product_id ON product_certifications(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_certifications_status ON product_certifications(verification_status);

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

      CREATE TABLE IF NOT EXISTS product_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        normalized_name VARCHAR(100) NOT NULL,
        partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
        visibility VARCHAR(50) NOT NULL DEFAULT 'RESTRICTED',
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_product_categories_partner_id ON product_categories(partner_id);
      CREATE INDEX IF NOT EXISTS idx_product_categories_status ON product_categories(status);
      CREATE INDEX IF NOT EXISTS idx_product_categories_visibility ON product_categories(visibility);
      CREATE INDEX IF NOT EXISTS idx_product_categories_normalized_name ON product_categories(normalized_name);

      ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

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

      -- Seed de categorias padrão se a tabela estiver vazia
      INSERT INTO product_categories (name, normalized_name, status, visibility)
      SELECT name, normalized_name, 'APPROVED', 'GLOBAL'
      FROM (VALUES 
        ('Padaria & Confeitaria', 'PADARIA & CONFEITARIA'),
        ('Pães & Torradas', 'PAES & TORRADAS'),
        ('Massas & Farinhas', 'MASSAS & FARINHAS'),
        ('Biscoitos & Snacks', 'BISCOITOS & SNACKS'),
        ('Lanches & Salgados', 'LANCHES & SALGADOS'),
        ('Doces & Sobremesas', 'DOCES & SOBREMESAS'),
        ('Laticínios & Derivados', 'LATICINIOS & DERIVADOS'),
        ('Bebidas & Cafés', 'BEBIDAS & CAFES'),
        ('Pratos Prontos / Congelados', 'PRATOS PRONTOS / CONGELADOS'),
        ('Outros', 'OUTROS')
      ) AS default_cats(name, normalized_name)
      WHERE NOT EXISTS (SELECT 1 FROM product_categories LIMIT 1);
    `);
    console.log('[Database]: Conexão e sincronização de esquema com PostgreSQL estabelecida com sucesso.');
  } finally {
    client.release();
  }
}
