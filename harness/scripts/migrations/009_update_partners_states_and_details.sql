-- =============================================================
-- Migration: 009_update_partners_states_and_details.sql
-- Criado em: 2026-07-24
-- Contexto: Ciclo de Vida, Governança e Transições de Partners (PRD)
-- =============================================================

-- 1. Remover a restrição UNIQUE de user_id na tabela partners para suportar múltiplos estabelecimentos por usuário
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_user_id_key;
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_user_id_unique;

-- 2. Adicionar as novas colunas para controle de status, governança e localização
ALTER TABLE partners 
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50) NOT NULL DEFAULT 'INACTIVE',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS delivery_region VARCHAR(255);

-- 3. Mapear o dado legado is_active para os novos status de aprovação e operacional
-- Se is_active for TRUE, o parceiro é considerado APPROVED e ACTIVE por padrão.
-- Se is_active for FALSE, ele é considerado DRAFT e INACTIVE por padrão.
UPDATE partners 
  SET approval_status = CASE WHEN is_active = TRUE THEN 'APPROVED' ELSE 'DRAFT' END,
      operational_status = CASE WHEN is_active = TRUE THEN 'ACTIVE' ELSE 'INACTIVE' END;

-- 4. Remover a coluna legada is_active
ALTER TABLE partners DROP COLUMN IF EXISTS is_active;

-- 5. Adicionar CHECK constraints para garantir integridade dos status nas inserções/edições
ALTER TABLE partners ADD CONSTRAINT chk_partners_approval_status 
  CHECK (approval_status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'));

ALTER TABLE partners ADD CONSTRAINT chk_partners_operational_status 
  CHECK (operational_status IN ('ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED'));
