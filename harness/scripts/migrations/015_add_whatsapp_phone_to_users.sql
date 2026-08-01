-- Migration 015: WhatsApp Phone
-- Adiciona número de contato exclusivo para WhatsApp ao User (opcional, preenchido no perfil)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20);
