-- harness/scripts/migrations/015_add_whatsapp_phone_to_users.sql
-- Alias de compatibilidade com a documentação da Issue #40

ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20) NULL;
