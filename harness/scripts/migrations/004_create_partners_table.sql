-- =============================================================
-- Migration: 004_create_partners_table.sql
-- Criado em: 2026-07-17
-- Contexto: Catálogo de Parceiros (DOMAIN_MODEL.md)
-- =============================================================

CREATE TABLE IF NOT EXISTS partners (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    cnpj        VARCHAR(20) UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    address     VARCHAR(255) NOT NULL DEFAULT '',
    phone       VARCHAR(50) NOT NULL DEFAULT '',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
