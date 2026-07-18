-- =============================================================
-- Migration: 006_add_fields_to_products_and_partners.sql
-- Criado em: 2026-07-18
-- Contexto: Gaps da Parte 2 do PRD
-- =============================================================

-- Adicionar tipo ao parceiro (Enum comercial: RESTAURANT, MARKET, INDEPENDENT_PRODUCER)
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'RESTAURANT';

-- Adicionar dados comerciais básicos ao catálogo de produtos
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'Geral',
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Adicionar índice para categoria para otimizar buscas futuras
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
