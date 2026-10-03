-- harness/scripts/migrations/021_extend_product_identification_and_composition.sql
-- Expansão de identificação, composição, origem comercial e suporte a rascunho de produtos

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS net_content NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ean VARCHAR(14),
  ADD COLUMN IF NOT EXISTS commercial_origin VARCHAR(50) NOT NULL DEFAULT 'OWN_MANUFACTURE',
  ADD COLUMN IF NOT EXISTS may_contain_traces TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS composition_notes TEXT,
  ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED';

CREATE INDEX IF NOT EXISTS idx_products_publication_status ON products(publication_status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
CREATE INDEX IF NOT EXISTS idx_products_commercial_origin ON products(commercial_origin);
