-- Migration 028: Add Delivery Payment and Fraud Protection
-- Suporte a pagamento na entrega (dinheiro/cartão), bloqueio de fraude e denúncia de cliente/pedido

-- 1. Flag de elegibilidade a pagamento na entrega no consumidor
ALTER TABLE consumers
ADD COLUMN IF NOT EXISTS can_pay_on_delivery BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_consumers_can_pay_on_delivery ON consumers(can_pay_on_delivery);

-- 2. Associação polimórfica de denúncia para target_user_id e order_id
ALTER TABLE product_reports
ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_reports_target_user_id ON product_reports(target_user_id);
CREATE INDEX IF NOT EXISTS idx_product_reports_order_id ON product_reports(order_id);

-- 3. Atualizar restrição de alvo da denúncia (produto, parceiro, usuário ou pedido)
ALTER TABLE product_reports DROP CONSTRAINT IF EXISTS check_product_or_partner_report;
ALTER TABLE product_reports DROP CONSTRAINT IF EXISTS check_report_target;
ALTER TABLE product_reports ADD CONSTRAINT check_report_target CHECK (
  product_id IS NOT NULL OR partner_id IS NOT NULL OR target_user_id IS NOT NULL OR order_id IS NOT NULL
);

-- 4. Troco para dinheiro na tabela de pagamentos
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS change_for NUMERIC(10, 2);
