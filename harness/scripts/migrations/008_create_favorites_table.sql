-- =============================================================
-- Migration: 008_create_favorites_table.sql
-- Criado em: 2026-07-18
-- Contexto: Gaps da Parte 3 do PRD (RF19 Favoritos)
-- =============================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  partner_id  UUID REFERENCES partners(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_favorite_product UNIQUE (user_id, product_id),
  CONSTRAINT uq_user_favorite_partner UNIQUE (user_id, partner_id),
  CONSTRAINT chk_favorite_target CHECK (product_id IS NOT NULL OR partner_id IS NOT NULL)
);
