-- harness/scripts/migrations/014_cleanup_and_unify_reports.sql
-- 1. Remove tabelas de interações de parceiro duplicadas e órfãs
DROP TABLE IF EXISTS partner_favorites, partner_reviews, partner_reports CASCADE;

-- 2. Permite denúncia polimórfica em product_reports (produto ou parceiro)
ALTER TABLE product_reports ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE product_reports ADD COLUMN IF NOT EXISTS partner_id UUID NULL REFERENCES partners(id) ON DELETE CASCADE;

-- 3. Adiciona índice para pesquisas rápidas por parceiro
CREATE INDEX IF NOT EXISTS idx_product_reports_partner_id ON product_reports(partner_id);

-- 4. Garante que a denúncia esteja associada a pelo menos um alvo (produto ou parceiro)
ALTER TABLE product_reports DROP CONSTRAINT IF EXISTS check_product_or_partner_report;
ALTER TABLE product_reports ADD CONSTRAINT check_product_or_partner_report CHECK (
  product_id IS NOT NULL OR partner_id IS NOT NULL
);
