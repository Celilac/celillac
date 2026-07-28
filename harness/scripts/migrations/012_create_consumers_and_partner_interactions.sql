-- Migration 012: Consumers & Partner Interactions
-- Implementação do modelo de domínio do Consumidor e interações com Parceiros

-- 1. Tabela: consumers
CREATE TABLE IF NOT EXISTS consumers (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  general_preferences JSONB DEFAULT '{}'::jsonb,
  is_food_profile_complete BOOLEAN DEFAULT false,
  is_food_profile_critical BOOLEAN DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'CONTA_CRIADA',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consumers_user_id ON consumers(user_id);

-- 2. Atualizar food_profiles
ALTER TABLE food_profiles
ADD COLUMN IF NOT EXISTS accepts_cross_contamination BOOLEAN DEFAULT false;

-- 3. Tabela: partner_favorites
CREATE TABLE IF NOT EXISTS partner_favorites (
  id UUID PRIMARY KEY,
  consumer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_consumer_partner_favorite UNIQUE (consumer_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_favorites_consumer ON partner_favorites(consumer_id);
CREATE INDEX IF NOT EXISTS idx_partner_favorites_partner ON partner_favorites(partner_id);

-- 4. Tabela: partner_reviews
CREATE TABLE IF NOT EXISTS partner_reviews (
  id UUID PRIMARY KEY,
  consumer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_consumer_partner_review UNIQUE (consumer_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_reviews_partner ON partner_reviews(partner_id);

-- 5. Tabela: partner_reports
CREATE TABLE IF NOT EXISTS partner_reports (
  id UUID PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  is_food_safety_risk BOOLEAN DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_reports_status ON partner_reports(status);
CREATE INDEX IF NOT EXISTS idx_partner_reports_food_safety ON partner_reports(is_food_safety_risk);

-- 6. Adicionar is_food_safety_risk à tabela product_reports
ALTER TABLE product_reports
ADD COLUMN IF NOT EXISTS is_food_safety_risk BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_product_reports_food_safety ON product_reports(is_food_safety_risk);
