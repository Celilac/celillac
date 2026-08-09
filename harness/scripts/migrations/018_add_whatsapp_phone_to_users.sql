-- harness/scripts/migrations/018_add_whatsapp_phone_to_users.sql
-- Adiciona coluna whatsapp_phone na tabela users para contato de WhatsApp do consumidor (Issue #40)

ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20) NULL;
