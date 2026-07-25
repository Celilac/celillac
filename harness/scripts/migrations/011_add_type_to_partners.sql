-- =============================================================
-- Migration: 011_add_type_to_partners.sql
-- Criado em: 2026-07-24
-- Contexto: Adicionar coluna type (PartnerType) na tabela partners
-- Necessária para suportar o campo 'type' introduzido no domínio Partner.
-- =============================================================

-- 1. Adicionar a coluna type com valor padrão RESTAURANT (retrocompatível)
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS type VARCHAR(100) NOT NULL DEFAULT 'RESTAURANT';

-- 2. Adicionar CHECK constraint para garantir valores válidos
ALTER TABLE partners DROP CONSTRAINT IF EXISTS chk_partners_type;
ALTER TABLE partners ADD CONSTRAINT chk_partners_type
  CHECK (type IN ('RESTAURANT', 'MARKET', 'INDEPENDENT_PRODUCER'));
