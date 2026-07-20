-- =============================================================
-- Migration: 007_add_product_status_and_partner_reviews.sql
-- Criado em: 2026-07-18
-- Contexto: Gaps da Parte 3 do PRD
-- =============================================================

-- Adicionar status de atividade (is_active) à tabela de produtos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Alterar a tabela de avaliações (product_reviews) para suportar parceiros
ALTER TABLE product_reviews
ALTER COLUMN product_id DROP NOT NULL;

-- Adicionar FK de parceiro
ALTER TABLE product_reviews
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE CASCADE;

-- Adicionar constraint de unicidade de avaliação por parceiro por usuário
ALTER TABLE product_reviews
ADD CONSTRAINT uq_user_partner UNIQUE (user_id, partner_id);

-- Adicionar check constraint garantindo que pelo menos um dos IDs é preenchido
ALTER TABLE product_reviews
ADD CONSTRAINT chk_review_target CHECK (product_id IS NOT NULL OR partner_id IS NOT NULL);
