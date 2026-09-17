-- harness/scripts/migrations/023_add_product_safety_matrix_and_certifications.sql
-- Fase 3: Matriz de Alérgenos Declarados, Risco de Contaminação Cruzada por Ambiente,
-- Características Alimentares (Estilo de Vida) e Tabela de Certificações/Selos Auditáveis.

-- 1. Colunas estruturadas na tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS declared_allergens JSONB DEFAULT '{}'::jsonb;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS cross_contamination_details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS dietary_features TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE products
ADD COLUMN IF NOT EXISTS information_origin VARCHAR(50) DEFAULT 'PARTNER_DECLARED';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS nutritional_info JSONB DEFAULT NULL;

-- 2. Índices de performance na tabela products
CREATE INDEX IF NOT EXISTS idx_products_dietary_features ON products USING GIN(dietary_features);
CREATE INDEX IF NOT EXISTS idx_products_information_origin ON products(information_origin);

-- 3. Tabela relacional product_certifications
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices para product_certifications
CREATE INDEX IF NOT EXISTS idx_product_certifications_product_id ON product_certifications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_certifications_status ON product_certifications(verification_status);
