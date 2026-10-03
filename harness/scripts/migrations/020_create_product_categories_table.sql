-- harness/scripts/migrations/020_create_product_categories_table.sql
-- Criação da tabela de categorias de produtos e suporte a moderação (pública vs restrita)

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  normalized_name VARCHAR(100) NOT NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'
  visibility VARCHAR(50) NOT NULL DEFAULT 'RESTRICTED',   -- 'GLOBAL', 'RESTRICTED'
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_categories_partner_id ON product_categories(partner_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_status ON product_categories(status);
CREATE INDEX IF NOT EXISTS idx_product_categories_visibility ON product_categories(visibility);
CREATE INDEX IF NOT EXISTS idx_product_categories_normalized_name ON product_categories(normalized_name);

-- Adiciona category_id opcional na tabela de produtos para integridade referencial
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

-- Seed das 10 categorias padrão do CeLiLac como globais aprovadas
INSERT INTO product_categories (name, normalized_name, status, visibility)
VALUES 
  ('Padaria & Confeitaria', 'PADARIA & CONFEITARIA', 'APPROVED', 'GLOBAL'),
  ('Pães & Torradas', 'PAES & TORRADAS', 'APPROVED', 'GLOBAL'),
  ('Massas & Farinhas', 'MASSAS & FARINHAS', 'APPROVED', 'GLOBAL'),
  ('Biscoitos & Snacks', 'BISCOITOS & SNACKS', 'APPROVED', 'GLOBAL'),
  ('Lanches & Salgados', 'LANCHES & SALGADOS', 'APPROVED', 'GLOBAL'),
  ('Doces & Sobremesas', 'DOCES & SOBREMESAS', 'APPROVED', 'GLOBAL'),
  ('Laticínios & Derivados', 'LATICINIOS & DERIVADOS', 'APPROVED', 'GLOBAL'),
  ('Bebidas & Cafés', 'BEBIDAS & CAFES', 'APPROVED', 'GLOBAL'),
  ('Pratos Prontos / Congelados', 'PRATOS PRONTOS / CONGELADOS', 'APPROVED', 'GLOBAL'),
  ('Outros', 'OUTROS', 'APPROVED', 'GLOBAL')
ON CONFLICT DO NOTHING;
