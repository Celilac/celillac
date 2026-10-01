-- harness/scripts/migrations/026_create_payments_and_financial_accounts_tables.sql
-- Tabelas do Bounded Context de Pagamentos e Subcontas Financeiras

CREATE TABLE IF NOT EXISTS partner_financial_accounts (
    id UUID PRIMARY KEY,
    partner_id UUID NOT NULL UNIQUE REFERENCES partners(id),
    gateway_subaccount_id VARCHAR(255),
    pix_key VARCHAR(150) NOT NULL,
    pix_key_type VARCHAR(20) NOT NULL, -- CNPJ, CPF, EMAIL, PHONE, RANDOM
    bank_code VARCHAR(10),
    agency_number VARCHAR(10),
    account_number VARCHAR(20),
    account_type VARCHAR(20), -- CHECKING, SAVINGS
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_financial_accounts_partner_id ON partner_financial_accounts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_financial_accounts_subaccount ON partner_financial_accounts(gateway_subaccount_id);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    consumer_id UUID NOT NULL REFERENCES users(id),
    partner_id UUID NOT NULL REFERENCES partners(id),
    gateway VARCHAR(50) NOT NULL DEFAULT 'ASAAS',
    gateway_transaction_id VARCHAR(255),
    method VARCHAR(50) NOT NULL, -- PIX, CREDIT_CARD
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, AUTHORIZED, PAID, FAILED, REFUNDED
    gross_amount NUMERIC(10,2) NOT NULL,
    net_partner_amount NUMERIC(10,2) NOT NULL,
    platform_fee_amount NUMERIC(10,2) NOT NULL,
    pix_qr_code TEXT,
    pix_copy_paste TEXT,
    pix_expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_partner_id ON payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_payments_consumer_id ON payments(consumer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id),
    gateway_refund_id VARCHAR(255),
    refund_amount NUMERIC(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON payment_refunds(payment_id);
