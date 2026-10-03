-- harness/scripts/migrations/022_create_product_images_table.sql
-- Criação da tabela de galeria de imagens funcionais e evidências de produtos

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  image_type VARCHAR(50) NOT NULL DEFAULT 'PRODUCT', -- 'PRODUCT', 'PACKAGING', 'LABEL', 'INGREDIENTS', 'NUTRITIONAL_INFO', 'CERTIFICATION'
  caption VARCHAR(255),
  display_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_type ON product_images(image_type);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, display_order);
