-- =============================================================
-- Migration: 001_create_products_table.sql
-- Criado em: 2026-07-01
-- Contexto: Catálogo de Produtos e Parceiros (DOMAIN_MODEL.md)
-- Aprovação: Requerida para qualquer alteração futura (DATABASE.md)
-- =============================================================

CREATE TABLE IF NOT EXISTS products (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(255) NOT NULL,
    brand              VARCHAR(255),
    ingredients        TEXT NOT NULL DEFAULT '',
    has_gluten         BOOLEAN NOT NULL DEFAULT FALSE,
    cross_contamination TEXT NOT NULL DEFAULT '',
    -- Um produto sem ingredientes é marcado como PENDENTE DE ANÁLISE
    -- Regra: DOMAIN_MODEL.md seção 2
    analysis_status    VARCHAR(50) NOT NULL DEFAULT 'PENDENTE_DE_ANALISE',
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name         ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_has_gluten   ON products(has_gluten);
CREATE INDEX IF NOT EXISTS idx_products_status       ON products(analysis_status);
