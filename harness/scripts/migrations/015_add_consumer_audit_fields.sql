-- Migration 015: Add Consumer Audit Fields
-- Rastreabilidade de estado do Consumidor (ATIVO / INATIVO) com auditoria

ALTER TABLE consumers
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status_change_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_consumers_status ON consumers(status);
