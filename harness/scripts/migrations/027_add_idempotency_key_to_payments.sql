-- harness/scripts/migrations/027_add_idempotency_key_to_payments.sql
-- Adiciona suporte a Chave de Idempotência na tabela de Pagamentos para prevenção de cobrança duplicada

ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key 
ON payments (idempotency_key) 
WHERE idempotency_key IS NOT NULL;
