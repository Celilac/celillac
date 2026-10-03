-- Migration 024: Create Password Resets Table
-- Tabela para armazenamento de códigos OTP temporários de recuperação de senha

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_code ON password_resets(user_id, code);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
