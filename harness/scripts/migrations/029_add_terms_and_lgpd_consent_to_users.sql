-- Migration 029: Add Terms of Use and LGPD Sensitive Health Consent to Users
-- Registra consentimento explícito (LGPD Art. 11) para restrições alimentares e versão dos termos

ALTER TABLE users
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20) DEFAULT '1.0';

CREATE INDEX IF NOT EXISTS idx_users_terms_accepted_at ON users(terms_accepted_at);
