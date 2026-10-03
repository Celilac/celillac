-- Migration 019: Adiciona coluna logo_url para a marca do estabelecimento na tabela partners
ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url TEXT;
