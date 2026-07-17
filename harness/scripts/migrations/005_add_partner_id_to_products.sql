-- =============================================================
-- Migration: 005_add_partner_id_to_products.sql
-- Criado em: 2026-07-17
-- Contexto: Catálogo de Produtos e Parceiros (DOMAIN_MODEL.md)
-- =============================================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_partner_id ON products(partner_id);
