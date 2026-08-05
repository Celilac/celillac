-- Migration 017: Tabela imutável de auditoria e rastreabilidade (audit_logs)
-- Registra eventos sensíveis do domínio (FoodProfile, Consumer, Partner, Report, User)

CREATE TABLE IF NOT EXISTS audit_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type         VARCHAR(50) NOT NULL,
  entity_id           UUID NOT NULL,
  action              VARCHAR(50) NOT NULL,
  actor_id            UUID,
  actor_role          VARCHAR(50),
  changes             JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason              TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
