-- Migration 014: Email Verifications (OTP) & Zoho Email Integration
-- Adiciona coluna is_email_verified em users e cria a tabela email_verifications

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_code ON email_verifications(user_id, code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);
