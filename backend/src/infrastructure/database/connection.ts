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
 * Executa uma instrução SQL DDL de forma tolerante a falhas.
 * Se falhar (ex: coluna/constraint já existente), registra aviso e não aborta a inicialização.
 */
async function executeSafeDdl(client: any, sql: string, description: string): Promise<void> {
  try {
    await client.query(sql);
  } catch (err: any) {
    console.warn(`[Database Sync] Aviso ao executar "${description}": ${err?.message || err}`);
  }
}

/**
 * Conecta ao pool com retry exponencial para suportar o tempo de inicialização do PostgreSQL em ambientes Docker/VPS.
 */
async function acquireClientWithRetry(maxRetries = 5, delayMs = 2000): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      return client;
    } catch (err: any) {
      console.warn(`[Database] Tentativa ${attempt}/${maxRetries} de conexão falhou: ${err?.message}. Aguardando ${delayMs}ms...`);
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Testa a conexão com o banco ao inicializar e sincroniza o esquema essencial.
 * Garante que todas as tabelas e colunas do sistema existam de forma resiliente e idempotente.
 */
export async function testDatabaseConnection(): Promise<void> {
  const client = await acquireClientWithRetry();
  try {
    // 1. Tabela users e colunas derivadas
    await executeSafeDdl(client, `
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
    `, 'Tabela users e colunas adicionais');

    // 2. Perfis alimentares e tokens revogados
    await executeSafeDdl(client, `
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
    `, 'Tabelas food_profiles e blacklisted_tokens');

    // 3. Verificação de e-mail e redefinição de senha
    await executeSafeDdl(client, `
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

      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_password_resets_user_code ON password_resets(user_id, code);
      CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
    `, 'Tabelas email_verifications e password_resets');

    // 4. Consumidores e Parceiros
    await executeSafeDdl(client, `
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
    `, 'Tabelas consumers e partners');

    // 5. Categorias de Produtos
    await executeSafeDdl(client, `
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
    `, 'Tabela product_categories');

    // 6. Produtos e Imagens
    await executeSafeDdl(client, `
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
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS declared_allergens JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cross_contamination_details JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_features TEXT[] DEFAULT ARRAY[]::TEXT[];
      ALTER TABLE products ADD COLUMN IF NOT EXISTS information_origin VARCHAR(50) DEFAULT 'PARTNER_DECLARED';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS nutritional_info JSONB DEFAULT NULL;

      CREATE INDEX IF NOT EXISTS idx_products_dietary_features ON products USING GIN(dietary_features);
      CREATE INDEX IF NOT EXISTS idx_products_information_origin ON products(information_origin);

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
    `, 'Tabela products e product_images');

    // 6.1 Sincronização de Preços do Catálogo / Seed (FEAT-095 / Resiliência de Catálogo)
    await executeSafeDdl(client, `
      UPDATE products SET price = 18.90 WHERE id = 'b0000001-0000-0000-0000-000000000001' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 12.50 WHERE id = 'b0000001-0000-0000-0000-000000000002' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 42.00 WHERE id = 'b0000001-0000-0000-0000-000000000003' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 16.90 WHERE id = 'b0000002-0000-0000-0000-000000000001' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 24.50 WHERE id = 'b0000002-0000-0000-0000-000000000002' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 26.90 WHERE id = 'b0000002-0000-0000-0000-000000000003' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 19.90 WHERE id = 'b0000003-0000-0000-0000-000000000001' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 14.90 WHERE id = 'b0000003-0000-0000-0000-000000000002' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 8.50  WHERE id = 'b0000003-0000-0000-0000-000000000003' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 32.00 WHERE id = 'b0000003-0000-0000-0000-000000000004' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 11.90 WHERE id = 'b0000004-0000-0000-0000-000000000001' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 15.00 WHERE id = 'b0000004-0000-0000-0000-000000000002' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 13.50 WHERE id = 'b0000004-0000-0000-0000-000000000003' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 21.00 WHERE id = 'b0000004-0000-0000-0000-000000000004' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 23.00 WHERE id = 'b0000004-0000-0000-0000-000000000005' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 35.00 WHERE id = 'b0000005-0000-0000-0000-000000000001' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 49.90 WHERE id = 'b0000006-0000-0000-0000-000000000001' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 38.00 WHERE id = 'b0000007-0000-0000-0000-000000000001' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 29.90 WHERE id = 'b0000008-0000-0000-0000-000000000001' AND (price IS NULL OR price = 0);
      UPDATE products SET price = 35.00 WHERE id = 'b0000008-0000-0000-0000-000000000002' AND (price IS NULL OR price = 0);
      UPDATE products SET partner_id = 'c0000001-0000-0000-0000-000000000003' WHERE id = 'b0000002-0000-0000-0000-000000000001' AND partner_id IS NULL;
      UPDATE products SET partner_id = 'c0000001-0000-0000-0000-000000000003' WHERE id = 'b0000004-0000-0000-0000-000000000001' AND partner_id IS NULL;
    `, 'Sincronização de Preços do Catálogo');

    // 7. Certificações de Produtos
    await executeSafeDdl(client, `
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
    `, 'Tabela product_certifications');

    // 8. Pedidos e Itens (Migration 025)
    await executeSafeDdl(client, `
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        consumer_id UUID NOT NULL REFERENCES users(id),
        partner_id UUID NOT NULL REFERENCES partners(id),
        status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
        subtotal_amount NUMERIC(10,2) NOT NULL,
        delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        total_amount NUMERIC(10,2) NOT NULL,
        allergen_check_verdict VARCHAR(50) NOT NULL DEFAULT 'SAFE',
        notes TEXT,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        cancel_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_orders_consumer_id ON orders(consumer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON orders(partner_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL,
        quantity INT NOT NULL,
        total_price NUMERIC(10,2) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `, 'Tabelas orders e order_items');

    // 9. Pagamentos, Subcontas e Reembolsos (Migrations 026 e 027)
    await executeSafeDdl(client, `
      CREATE TABLE IF NOT EXISTS partner_financial_accounts (
        id UUID PRIMARY KEY,
        partner_id UUID NOT NULL UNIQUE REFERENCES partners(id),
        gateway_subaccount_id VARCHAR(255),
        pix_key VARCHAR(150) NOT NULL,
        pix_key_type VARCHAR(20) NOT NULL,
        bank_code VARCHAR(10),
        agency_number VARCHAR(10),
        account_number VARCHAR(20),
        account_type VARCHAR(20),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_partner_financial_accounts_partner_id ON partner_financial_accounts(partner_id);
      CREATE INDEX IF NOT EXISTS idx_partner_financial_accounts_subaccount ON partner_financial_accounts(gateway_subaccount_id);

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders(id),
        consumer_id UUID NOT NULL REFERENCES users(id),
        partner_id UUID NOT NULL REFERENCES partners(id),
        gateway VARCHAR(50) NOT NULL DEFAULT 'ASAAS',
        gateway_transaction_id VARCHAR(255),
        method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        gross_amount NUMERIC(10,2) NOT NULL,
        net_partner_amount NUMERIC(10,2) NOT NULL,
        platform_fee_amount NUMERIC(10,2) NOT NULL,
        pix_qr_code TEXT,
        pix_copy_paste TEXT,
        pix_expires_at TIMESTAMP WITH TIME ZONE,
        paid_at TIMESTAMP WITH TIME ZONE,
        failure_reason TEXT,
        idempotency_key VARCHAR(100),
        change_for NUMERIC(10, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS change_for NUMERIC(10, 2);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_partner_id ON payments(partner_id);
      CREATE INDEX IF NOT EXISTS idx_payments_consumer_id ON payments(consumer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

      CREATE TABLE IF NOT EXISTS payment_refunds (
        id UUID PRIMARY KEY,
        payment_id UUID NOT NULL REFERENCES payments(id),
        gateway_refund_id VARCHAR(255),
        refund_amount NUMERIC(10,2) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON payment_refunds(payment_id);
    `, 'Tabelas partner_financial_accounts, payments e payment_refunds');

    // 10. Denúncias e Auditoria (Migrations 014, 017 e 028)
    await executeSafeDdl(client, `
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE product_reports ALTER COLUMN product_id DROP NOT NULL;
      ALTER TABLE product_reports ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE CASCADE;
      ALTER TABLE product_reports ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE product_reports ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
      ALTER TABLE product_reports DROP CONSTRAINT IF EXISTS check_product_or_partner_report;
      ALTER TABLE product_reports DROP CONSTRAINT IF EXISTS check_report_target;
      ALTER TABLE product_reports ADD CONSTRAINT check_report_target CHECK (
        product_id IS NOT NULL OR partner_id IS NOT NULL OR target_user_id IS NOT NULL OR order_id IS NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_product_reports_partner ON product_reports(partner_id);
      CREATE INDEX IF NOT EXISTS idx_product_reports_product ON product_reports(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_reports_target_user_id ON product_reports(target_user_id);
      CREATE INDEX IF NOT EXISTS idx_product_reports_order_id ON product_reports(order_id);
      CREATE INDEX IF NOT EXISTS idx_product_reports_food_safety ON product_reports(is_food_safety_risk);

      ALTER TABLE consumers ADD COLUMN IF NOT EXISTS can_pay_on_delivery BOOLEAN NOT NULL DEFAULT TRUE;
      CREATE INDEX IF NOT EXISTS idx_consumers_can_pay_on_delivery ON consumers(can_pay_on_delivery);
    `, 'Tabela product_reports com suporte polimórfico e delivery payment');

    // 11. Logs de Auditoria
    await executeSafeDdl(client, `
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
    `, 'Tabela audit_logs');
    // 12. Seed de Categorias Globais
    await executeSafeDdl(client, `
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
    `, 'Seed de categorias padrão');

    // 13. Sincronização e Vínculo de Produtos do Catálogo a Parceiros Homologados
    await executeSafeDdl(client, `
      UPDATE products 
      SET partner_id = 'c0000001-0000-0000-0000-000000000002' 
      WHERE partner_id IS NULL AND id IN (
        'b0000001-0000-0000-0000-000000000003',
        'b0000002-0000-0000-0000-000000000002',
        'b0000007-0000-0000-0000-000000000001',
        'b0000003-0000-0000-0000-000000000002',
        'b0000004-0000-0000-0000-000000000002',
        'b0000004-0000-0000-0000-000000000003',
        'b0000003-0000-0000-0000-000000000003',
        'b0000005-0000-0000-0000-000000000001'
      );

      UPDATE products 
      SET partner_id = 'c0000001-0000-0000-0000-000000000001' 
      WHERE partner_id IS NULL AND id IN (
        'b0000003-0000-0000-0000-000000000001',
        'b0000006-0000-0000-0000-000000000001'
      );
    `, 'Vínculo de produtos comerciais a parceiros homologados');

    console.log('[Database]: Conexão e sincronização de esquema com PostgreSQL concluídas com sucesso.');
  } finally {
    client.release();
  }
}
