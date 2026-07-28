-- Migration 013: User Profile Fields & Admin Approval Workflow
-- Adiciona campos de perfil estendido (nome, nascimento, gênero, foto) e controle de status/aprovação

ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS profile_evaluation_status VARCHAR(50) DEFAULT 'PENDING_EVALUATION';

CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_evaluation ON users(profile_evaluation_status);
