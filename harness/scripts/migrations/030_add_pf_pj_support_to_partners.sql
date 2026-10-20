-- Migration 030: Add PF and PJ support and document tracking to Partners
-- Contexto: Diferenciação formal de Pessoa Física (artesanal/autônomo com CPF) e Pessoa Jurídica (empresa com CNPJ)

ALTER TABLE partners
ADD COLUMN IF NOT EXISTS legal_nature VARCHAR(10) DEFAULT 'PJ',
ADD COLUMN IF NOT EXISTS document_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS document_type VARCHAR(10) DEFAULT 'CNPJ',
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS responsible_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_partners_legal_nature ON partners(legal_nature);
CREATE INDEX IF NOT EXISTS idx_partners_document_number ON partners(document_number);

-- Backfill defensivo: parceiros com CNPJ preenchido passam a ter document_number = cnpj e legal_nature = 'PJ'
UPDATE partners
SET document_number = cnpj,
    document_type = 'CNPJ',
    legal_nature = 'PJ'
WHERE cnpj IS NOT NULL AND document_number IS NULL;
