// harness/scripts/seed.ts
// =============================================================
// Script de Seed — CeLiLac
// Popula o banco local com dados fictícios para testes e desenvolvimento.
//
// ⚠️  NUNCA executar em produção.
// ⚠️  Apenas dados fictícios — sem emails ou CPFs reais.
// Conformidade: harness/guardrails.md — Seeds são dados locais seguros.
//
// Uso:
//   cd harness/scripts
//   npx ts-node seed.ts
// =============================================================

import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'celilac_db',
  user: process.env.DB_USER ?? 'celilac_user',
  password: process.env.DB_PASSWORD ?? 'celilac_password',
});

// ─── Paleta de dados fictícios ──────────────────────────────────────────────

const USERS: Array<{
  email: string;
  password: string;
  role: string;
  profileLabel: string;
  restrictions: Array<{ allergen: string; severity: string; id: string }>;
}> = [
    {
      email: 'admin@seed.celilac.dev',
      password: 'Seed@123456',
      role: 'ADMIN',
      profileLabel: 'Administrador Geral — Governança e Moderação',
      restrictions: [],
    },
    {
      email: 'celiaco.classico@seed.celilac.dev',
      password: 'Seed@123456',
      role: 'CELIACO',
      profileLabel: 'Celíaco clássico — glúten FATAL',
      restrictions: [
        { id: 'a1000001-0000-0000-0000-000000000001', allergen: 'GLUTEN', severity: 'FATAL' },
        { id: 'a1000001-0000-0000-0000-000000000002', allergen: 'LACTOSE', severity: 'LOW' },
      ],
    },
    {
      email: 'aplv.severo@seed.celilac.dev',
      password: 'Seed@123456',
      role: 'CELIACO',
      profileLabel: 'APLV severo — leite e ovo HIGH',
      restrictions: [
        { id: 'a2000001-0000-0000-0000-000000000001', allergen: 'LACTOSE', severity: 'FATAL' },
        { id: 'a2000001-0000-0000-0000-000000000002', allergen: 'EGGS', severity: 'HIGH' },
      ],
    },
    {
      email: 'multiplo.alergico@seed.celilac.dev',
      password: 'Seed@123456',
      role: 'CELIACO',
      profileLabel: 'Múltiplas restrições — glúten + castanhas + soja',
      restrictions: [
        { id: 'a3000001-0000-0000-0000-000000000001', allergen: 'GLUTEN', severity: 'FATAL' },
        { id: 'a3000001-0000-0000-0000-000000000002', allergen: 'NUTS', severity: 'HIGH' },
        { id: 'a3000001-0000-0000-0000-000000000003', allergen: 'SOY', severity: 'MEDIUM' },
      ],
    },
    {
      email: 'sensivel.leve@seed.celilac.dev',
      password: 'Seed@123456',
      role: 'CELIACO',
      profileLabel: 'Sensibilidade leve — lactose e gergelim LOW',
      restrictions: [
        { id: 'a4000001-0000-0000-0000-000000000001', allergen: 'LACTOSE', severity: 'LOW' },
        { id: 'a4000001-0000-0000-0000-000000000002', allergen: 'SESAME', severity: 'LOW' },
      ],
    },
    {
      email: 'parceiro.restaurante@seed.celilac.dev',
      password: 'Seed@123456',
      role: 'PARCEIRO',
      profileLabel: 'Parceiro — sem perfil alimentar',
      restrictions: [],
    },
  ];

const PRODUCTS: Array<{
  id: string;
  name: string;
  brand: string;
  ingredients: string;
  has_gluten: boolean;
  cross_contamination: string;
  analysis_status: string;
  partner_id?: string;
}> = [
    // ── SAFE para celíacos ─────────────────────────────────────────────────────
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      name: 'Arroz Integral Orgânico',
      brand: 'Fazenda Natural',
      ingredients: 'arroz integral orgânico',
      has_gluten: false,
      cross_contamination: '',
      analysis_status: 'ANALISADO',
      partner_id: 'c0000001-0000-0000-0000-000000000002', // Mercado Natural & Cia
    },
    {
      id: 'b0000001-0000-0000-0000-000000000002',
      name: 'Feijão Carioca Seco',
      brand: 'Campo Belo',
      ingredients: 'feijão carioca',
      has_gluten: false,
      cross_contamination: '',
      analysis_status: 'ANALISADO',
      partner_id: 'c0000001-0000-0000-0000-000000000002', // Mercado Natural & Cia
    },
    {
      id: 'b0000001-0000-0000-0000-000000000003',
      name: 'Azeite de Oliva Extra Virgem',
      brand: 'Monte Cristallo',
      ingredients: 'azeite de oliva extra virgem 100%',
      has_gluten: false,
      cross_contamination: '',
      analysis_status: 'ANALISADO',
    },
    // ── WARNING — traços leves ─────────────────────────────────────────────────
    {
      id: 'b0000002-0000-0000-0000-000000000001',
      name: 'Chocolate Amargo 70%',
      brand: 'Cacau Select',
      ingredients: 'pasta de cacau, manteiga de cacau, açúcar, lecitina de soja',
      has_gluten: false,
      cross_contamination: 'Pode conter traços de leite e amêndoas.',
      analysis_status: 'ANALISADO',
    },
    {
      id: 'b0000002-0000-0000-0000-000000000002',
      name: 'Granola Sem Glúten',
      brand: 'VidaLight',
      ingredients: 'aveia certificada sem glúten, mel, frutas secas, óleo de coco',
      has_gluten: false,
      cross_contamination: 'Produzido em fábrica que processa castanhas e amendoim.',
      analysis_status: 'ANALISADO',
    },
    {
      id: 'b0000002-0000-0000-0000-000000000003',
      name: 'Arroz 7 Grãos com Castanhas',
      brand: 'Grão & Vida',
      ingredients: 'arroz integral, arroz vermelho, arroz preto, castanha-de-caju, gergelim',
      has_gluten: false,
      cross_contamination: 'Produzido em fábrica que processa leite e soja.',
      analysis_status: 'ANALISADO',
      partner_id: 'c0000001-0000-0000-0000-000000000002', // Mercado Natural & Cia
    },
    // ── DANGER — alérgeno de alta severidade ──────────────────────────────────
    {
      id: 'b0000003-0000-0000-0000-000000000001',
      name: 'Pão de Forma Integral',
      brand: 'Trigo Dourado',
      ingredients: 'farinha de trigo integral, água, sal, fermento biológico, açúcar',
      has_gluten: true,
      cross_contamination: '',
      analysis_status: 'ANALISADO',
    },
    {
      id: 'b0000003-0000-0000-0000-000000000002',
      name: 'Macarrão Espaguete Grano Duro',
      brand: 'La Pasta',
      ingredients: 'semolina de trigo duro (glúten), água',
      has_gluten: true,
      cross_contamination: '',
      analysis_status: 'ANALISADO',
    },
    {
      id: 'b0000003-0000-0000-0000-000000000003',
      name: 'Iogurte Grego Integral',
      brand: 'Leite Vivo',
      ingredients: 'leite integral pasteurizado, creme de leite, fermento lático',
      has_gluten: false,
      cross_contamination: '',
      analysis_status: 'ANALISADO',
    },
    {
      id: 'b0000003-0000-0000-0000-000000000004',
      name: 'Arroz de Forno Cremoso Quatro Queijos',
      brand: 'Pronto & Saboroso',
      ingredients: 'arroz agulhinha, queijo mussarela, queijo parmesão, requeijão cremoso, leite integral, manteiga, sal',
      has_gluten: false,
      cross_contamination: 'Livre de glúten. Contém derivados de leite.',
      analysis_status: 'ANALISADO',
    },
    // ── BLOCKED — FATAL para celíacos ─────────────────────────────────────────
    {
      id: 'b0000004-0000-0000-0000-000000000001',
      name: 'Biscoito de Aveia com Mel',
      brand: 'NaturSnack',
      ingredients: 'aveia, mel, manteiga, açúcar mascavo, farinha de trigo',
      has_gluten: true,
      cross_contamination: 'Contém glúten. Produzido em linha compartilhada.',
      analysis_status: 'ANALISADO',
    },
    {
      id: 'b0000004-0000-0000-0000-000000000002',
      name: 'Molho de Soja Shoyu',
      brand: 'Sakura',
      ingredients: 'soja, trigo, sal, água, caramelo',
      has_gluten: true,
      cross_contamination: 'Contém glúten e soja.',
      analysis_status: 'ANALISADO',
    },
    // ── CASO CRÍTICO: has_gluten=false mas traços de glúten → BLOCKED para celíacos
    {
      id: 'b0000004-0000-0000-0000-000000000003',
      name: 'Farofa Temperada "Sem Glúten"',
      brand: 'FarinhaMax',
      ingredients: 'farinha de mandioca, óleo vegetal, sal, temperos',
      has_gluten: false,
      cross_contamination: 'Pode conter traços de glúten de trigo.',
      analysis_status: 'ANALISADO',
    },
    {
      id: 'b0000004-0000-0000-0000-000000000004',
      name: 'Arroz com Cevada e Ervas Finas',
      brand: 'Sabor Gourmet',
      ingredients: 'arroz agulhinha, cevada perolada, salsa desidratada, cebolinha, alho',
      has_gluten: true,
      cross_contamination: 'Contém cevada e glúten.',
      analysis_status: 'ANALISADO',
    },
    {
      id: 'b0000004-0000-0000-0000-000000000005',
      name: 'Arroz Oriental para Sushi (Linha Compartilhada)',
      brand: 'Tokyo Grãos',
      ingredients: 'arroz para culinária oriental polido',
      has_gluten: false,
      cross_contamination: 'ALÉRGICOS: Embalado no mesmo maquinário que processa trigo. Pode conter traços de glúten.',
      analysis_status: 'ANALISADO',
    },
    // ── PENDENTE — sem ingredientes declarados → BLOCKED por precaução ─────────
    {
      id: 'b0000005-0000-0000-0000-000000000001',
      name: 'Produto Importado Sem Rótulo Traduzido',
      brand: 'Unknown Brand',
      ingredients: '',
      has_gluten: false,
      cross_contamination: '',
      analysis_status: 'PENDENTE_DE_ANALISE',
    },
    // ── Frutas do mar (para APLV + shellfish) ─────────────────────────────────
    {
      id: 'b0000006-0000-0000-0000-000000000001',
      name: 'Camarão Empanado Congelado',
      brand: 'Mar Profundo',
      ingredients: 'camarão (60%), farinha de trigo, amido de milho, sal, páprica',
      has_gluten: true,
      cross_contamination: 'Contém camarão, glúten. Processado com outros frutos do mar.',
      analysis_status: 'ANALISADO',
    },
    // ── Produto com castanhas (para NUTS HIGH) ─────────────────────────────────
    {
      id: 'b0000007-0000-0000-0000-000000000001',
      name: 'Mix de Castanhas Premium',
      brand: 'Nature\'s Best',
      ingredients: 'castanha-do-pará, amêndoa, castanha de caju, nozes, macadâmia',
      has_gluten: false,
      cross_contamination: 'Processado em ambiente com amendoim.',
      analysis_status: 'ANALISADO',
    },
    // ── Produto de Parceiro 100% Seguro (Bistro Sem Glúten) ───────────────────
    {
      id: 'b0000008-0000-0000-0000-000000000001',
      name: 'Pão Francês Artesanal Sem Glúten',
      brand: 'Bistro Sem Glúten Fit',
      ingredients: 'farinha de arroz, polvilho doce, água, fermento biológico, sal',
      has_gluten: false,
      cross_contamination: '100% livre de contaminação por glúten.',
      analysis_status: 'ANALISADO',
      partner_id: 'c0000001-0000-0000-0000-000000000001', // Bistro Sem Gluten Fit
    },
    {
      id: 'b0000008-0000-0000-0000-000000000002',
      name: 'Bolo de Cenoura com Chocolate Sem Leite',
      brand: 'Bistro Sem Glúten Fit',
      ingredients: 'cenoura, farinha de arroz, açúcar, óleo, cacau em pó 50%',
      has_gluten: false,
      cross_contamination: 'Livre de glúten e leite. Sem compartilhamento de maquinário.',
      analysis_status: 'ANALISADO',
      partner_id: 'c0000001-0000-0000-0000-000000000001', // Bistro Sem Gluten Fit
    },
  ];

const PARTNERS: Array<{
  id: string;
  emailResponsavel: string;
  name: string;
  cnpj?: string;
  description: string;
  address: string;
  phone: string;
  type: string;
  approvalStatus: string;
  operationalStatus: string;
  city: string;
  state: string;
  deliveryRegion: string;
}> = [
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      emailResponsavel: 'parceiro.restaurante@seed.celilac.dev',
      name: 'Bistro Sem Gluten Fit',
      cnpj: '12345678000195',
      description: 'Um bistrô 100% livre de glúten e contaminação cruzada.',
      address: 'Av. Paulista, 1000',
      phone: '11999998888',
      type: 'RESTAURANT',
      approvalStatus: 'APPROVED',
      operationalStatus: 'ACTIVE',
      city: 'São Paulo',
      state: 'SP',
      deliveryRegion: 'Grande São Paulo',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000002',
      emailResponsavel: 'parceiro.restaurante@seed.celilac.dev',
      name: 'Mercado Natural & Cia',
      cnpj: '98765432000198',
      description: 'Mercearia com seleção de produtos embalados sem glúten e sem leite.',
      address: 'Rua das Flores, 123',
      phone: '11988887777',
      type: 'MARKET',
      approvalStatus: 'APPROVED',
      operationalStatus: 'ACTIVE',
      city: 'São Paulo',
      state: 'SP',
      deliveryRegion: 'Zona Sul',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000003',
      emailResponsavel: 'parceiro.restaurante@seed.celilac.dev',
      name: 'Doceria Artesanal da Ana',
      cnpj: '',
      description: 'Doces artesanais sem glúten e sem lactose sob encomenda.',
      address: 'Rua XV de Novembro, 456',
      phone: '11977776666',
      type: 'INDEPENDENT_PRODUCER',
      approvalStatus: 'PENDING_REVIEW',
      operationalStatus: 'INACTIVE',
      city: 'Campinas',
      state: 'SP',
      deliveryRegion: 'Campinas e Região',
    }
  ];

const CERTIFICATIONS: Array<{
  id: string;
  product_id: string;
  certification_type: string;
  certifying_entity: string;
  certificate_code: string;
  valid_until: string;
  verification_status: string;
  verification_notes?: string;
}> = [
  // ── Pendente de Revisão (DECLARED_BY_PARTNER) ──────────────────────────
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    product_id: 'b0000008-0000-0000-0000-000000000001', // Pão Francês Artesanal Sem Glúten (Bistro)
    certification_type: 'ACELBRA_SEAL',
    certifying_entity: 'ACELBRA - Associação dos Celíacos do Brasil',
    certificate_code: 'ACEL-BR-2026-991',
    valid_until: '2027-12-31',
    verification_status: 'DECLARED_BY_PARTNER',
  },
  {
    id: 'e0000001-0000-0000-0000-000000000002',
    product_id: 'b0000008-0000-0000-0000-000000000001', // Pão Francês Artesanal Sem Glúten
    certification_type: 'GLUTEN_FREE_LAB',
    certifying_entity: 'Laboratório Eurofins Food Testing',
    certificate_code: 'EUR-BR-2026-8812',
    valid_until: '2026-11-30',
    verification_status: 'DECLARED_BY_PARTNER',
  },
  {
    id: 'e0000001-0000-0000-0000-000000000003',
    product_id: 'b0000008-0000-0000-0000-000000000002', // Bolo de Cenoura com Chocolate Sem Leite
    certification_type: 'VEGAN_SVB',
    certifying_entity: 'Sociedade Vegetariana Brasileira',
    certificate_code: 'SVB-VG-2025-104',
    valid_until: '2026-08-15',
    verification_status: 'DECLARED_BY_PARTNER',
  },
  // ── Aprovado / Homologado (VERIFIED_BY_CELILAC) ────────────────────────
  {
    id: 'e0000001-0000-0000-0000-000000000004',
    product_id: 'b0000001-0000-0000-0000-000000000001', // Arroz Integral Orgânico
    certification_type: 'ORGANIC_BRAZIL',
    certifying_entity: 'Ministério da Agricultura / SisOrg',
    certificate_code: 'SISORG-BR-2025-4421',
    valid_until: '2027-05-30',
    verification_status: 'VERIFIED_BY_CELILAC',
    verification_notes: 'Certificado orgânico ativo verificado no cadastro SisOrg em 10/01/2026.',
  },
  {
    id: 'e0000001-0000-0000-0000-000000000005',
    product_id: 'b0000001-0000-0000-0000-000000000002', // Feijão Carioca Seco
    certification_type: 'OTHER',
    certifying_entity: 'BKA Certificações Kosher',
    certificate_code: 'KSH-2025-09',
    valid_until: '2026-12-31',
    verification_status: 'VERIFIED_BY_CELILAC',
    verification_notes: 'Documento homologado pela equipe de auditoria CeLiLac.',
  },
  // ── Rejeitado (REJECTED) ───────────────────────────────────────────────
  {
    id: 'e0000001-0000-0000-0000-000000000006',
    product_id: 'b0000002-0000-0000-0000-000000000002', // Granola Sem Glúten
    certification_type: 'GLUTEN_FREE_LAB',
    certifying_entity: 'Biotec Análises Químicas',
    certificate_code: 'BIO-990-2024',
    valid_until: '2024-12-31',
    verification_status: 'REJECTED',
    verification_notes: 'Laudo com validade expirada e sem laudo microbiológico complementar.',
  },
];

// ─── Funções auxiliares ─────────────────────────────────────────────────────

async function createProductsTableIfNotExists(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name                VARCHAR(255) NOT NULL,
      brand               VARCHAR(255),
      ingredients         TEXT NOT NULL DEFAULT '',
      has_gluten          BOOLEAN NOT NULL DEFAULT FALSE,
      cross_contamination TEXT NOT NULL DEFAULT '',
      analysis_status     VARCHAR(50) NOT NULL DEFAULT 'PENDENTE_DE_ANALISE',
      partner_id          UUID,
      price               NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      category            VARCHAR(100) NOT NULL DEFAULT 'Geral',
      image_url           VARCHAR(500),
      is_active           BOOLEAN NOT NULL DEFAULT TRUE,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_has_gluten ON products(has_gluten)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(analysis_status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_partner_id ON products(partner_id)`);

  console.log('  ✅ Tabela products garantida.');
}

async function createCertificationsTableIfNotExists(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_certifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      certification_type VARCHAR(60) NOT NULL,
      certifying_entity VARCHAR(150) NOT NULL,
      certificate_code VARCHAR(100),
      valid_until DATE,
      image_id UUID,
      verification_status VARCHAR(30) NOT NULL DEFAULT 'DECLARED_BY_PARTNER',
      verification_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_certifications_product_id ON product_certifications(product_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_certifications_status ON product_certifications(verification_status)`);

  console.log('  ✅ Tabela product_certifications garantida.');
}

async function createOrdersAndPaymentsTablesIfNotExists(): Promise<void> {
  // Orders & Items (Migration 025)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      consumer_id UUID NOT NULL REFERENCES users(id),
      partner_id UUID NOT NULL REFERENCES partners(id),
      status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
      subtotal_amount NUMERIC(10,2) NOT NULL,
      delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      total_amount NUMERIC(10,2) NOT NULL,
      allergen_check_verdict VARCHAR(50) NOT NULL DEFAULT 'SAFE',
      notes TEXT,
      cancelled_at TIMESTAMP WITH TIME ZONE,
      cancel_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_consumer_id ON orders(consumer_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON orders(partner_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id),
      product_name VARCHAR(255) NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL,
      quantity INT NOT NULL,
      total_price NUMERIC(10,2) NOT NULL
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`);

  // Financial Accounts & Payments (Migration 026)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_financial_accounts (
      id UUID PRIMARY KEY,
      partner_id UUID NOT NULL UNIQUE REFERENCES partners(id),
      gateway_subaccount_id VARCHAR(255),
      pix_key VARCHAR(150) NOT NULL,
      pix_key_type VARCHAR(20) NOT NULL,
      bank_code VARCHAR(10),
      agency_number VARCHAR(10),
      account_number VARCHAR(20),
      account_type VARCHAR(20),
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_partner_financial_accounts_partner_id ON partner_financial_accounts(partner_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_partner_financial_accounts_subaccount ON partner_financial_accounts(gateway_subaccount_id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id),
      consumer_id UUID NOT NULL REFERENCES users(id),
      partner_id UUID NOT NULL REFERENCES partners(id),
      gateway VARCHAR(50) NOT NULL DEFAULT 'ASAAS',
      gateway_transaction_id VARCHAR(255),
      method VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
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
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON payments(gateway_transaction_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_partner_id ON payments(partner_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_consumer_id ON payments(consumer_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_refunds (
      id UUID PRIMARY KEY,
      payment_id UUID NOT NULL REFERENCES payments(id),
      gateway_refund_id VARCHAR(255),
      refund_amount NUMERIC(10,2) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON payment_refunds(payment_id)`);

  console.log('  ✅ Tabelas orders, order_items, partner_financial_accounts e payments garantidas.');
}

async function seedUsers(): Promise<Map<string, string>> {
  const emailToId = new Map<string, string>();
  const SALT_ROUNDS = 10;

  for (const user of USERS) {
    const hash = await bcrypt.hash(user.password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
       RETURNING id`,
      [user.email, hash, user.role],
    );

    const userId = result.rows[0].id as string;
    emailToId.set(user.email, userId);
    console.log(`  👤 ${user.profileLabel} → ${userId}`);
  }

  return emailToId;
}

async function seedFoodProfiles(emailToId: Map<string, string>): Promise<void> {
  for (const user of USERS) {
    if (user.restrictions.length === 0) continue;

    const userId = emailToId.get(user.email)!;

    // Verifica se já existe um perfil para este usuário
    const existing = await pool.query(
      'SELECT id FROM food_profiles WHERE user_id = $1 LIMIT 1',
      [userId],
    );

    const restrictionsJson = JSON.stringify(user.restrictions);

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO food_profiles (user_id, restrictions)
         VALUES ($1, $2::jsonb)`,
        [userId, restrictionsJson],
      );
      console.log(`  🥗 Perfil criado para ${user.email} (${user.restrictions.length} restrições)`);
    } else {
      await pool.query(
        `UPDATE food_profiles SET restrictions = $1::jsonb WHERE user_id = $2`,
        [restrictionsJson, userId],
      );
      console.log(`  🔄 Perfil atualizado para ${user.email}`);
    }
  }
}

async function seedPartners(emailToId: Map<string, string>): Promise<void> {
  for (const partner of PARTNERS) {
    const userId = emailToId.get(partner.emailResponsavel)!;

    await pool.query(
      `INSERT INTO partners (id, user_id, name, cnpj, description, address, phone, type, approval_status, operational_status, city, state, delivery_region)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         name               = EXCLUDED.name,
         cnpj               = EXCLUDED.cnpj,
         description        = EXCLUDED.description,
         address            = EXCLUDED.address,
         phone              = EXCLUDED.phone,
         type               = EXCLUDED.type,
         approval_status    = EXCLUDED.approval_status,
         operational_status = EXCLUDED.operational_status,
         city               = EXCLUDED.city,
         state              = EXCLUDED.state,
         delivery_region    = EXCLUDED.delivery_region,
         updated_at         = CURRENT_TIMESTAMP`,
      [
        partner.id,
        userId,
        partner.name,
        partner.cnpj || null,
        partner.description,
        partner.address,
        partner.phone,
        partner.type,
        partner.approvalStatus,
        partner.operationalStatus,
        partner.city,
        partner.state,
        partner.deliveryRegion,
      ]
    );

    console.log(`  🏢 [${partner.approvalStatus}/${partner.operationalStatus}] Partner: ${partner.name}`);
  }
}

async function seedProducts(): Promise<void> {
  for (const product of PRODUCTS) {
    await pool.query(
      `INSERT INTO products (id, name, brand, ingredients, has_gluten, cross_contamination, analysis_status, partner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name                = EXCLUDED.name,
         brand               = EXCLUDED.brand,
         ingredients         = EXCLUDED.ingredients,
         has_gluten          = EXCLUDED.has_gluten,
         cross_contamination = EXCLUDED.cross_contamination,
         analysis_status     = EXCLUDED.analysis_status,
         partner_id          = EXCLUDED.partner_id,
         updated_at          = CURRENT_TIMESTAMP`,
      [
        product.id,
        product.name,
        product.brand,
        product.ingredients,
        product.has_gluten,
        product.cross_contamination,
        product.analysis_status,
        product.partner_id || null,
      ],
    );

    const statusIcon = product.ingredients === '' ? '⏳' :
      product.has_gluten ? '⛔' :
        product.cross_contamination.toLowerCase().includes('glúten') ? '⛔' :
          product.cross_contamination ? '⚠️' : '✅';

    console.log(`  ${statusIcon} [${product.analysis_status.padEnd(20)}] ${product.name} (${product.brand})`);
  }
}

async function seedProductCertifications(): Promise<void> {
  for (const cert of CERTIFICATIONS) {
    await pool.query(
      `INSERT INTO product_certifications (
         id, product_id, certification_type, certifying_entity,
         certificate_code, valid_until, verification_status, verification_notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         certification_type  = EXCLUDED.certification_type,
         certifying_entity   = EXCLUDED.certifying_entity,
         certificate_code    = EXCLUDED.certificate_code,
         valid_until         = EXCLUDED.valid_until,
         verification_status = EXCLUDED.verification_status,
         verification_notes  = EXCLUDED.verification_notes,
         updated_at          = CURRENT_TIMESTAMP`,
      [
        cert.id,
        cert.product_id,
        cert.certification_type,
        cert.certifying_entity,
        cert.certificate_code,
        cert.valid_until,
        cert.verification_status,
        cert.verification_notes || null,
      ],
    );

    const statusBadge = cert.verification_status === 'DECLARED_BY_PARTNER' ? '⏳ PENDENTE' :
      cert.verification_status === 'VERIFIED_BY_CELILAC' ? '✅ VERIFICADO' : '❌ REJEITADO';

    console.log(`  🎖️  [${statusBadge}] ${cert.certification_type} (${cert.certifying_entity})`);
  }
}

async function seedPartnerFinancialAccounts(): Promise<void> {
  const partnerId = 'c0000001-0000-0000-0000-000000000001'; // Bistro Sem Gluten Fit
  await pool.query(
    `INSERT INTO partner_financial_accounts (
       id, partner_id, gateway_subaccount_id, pix_key, pix_key_type,
       bank_code, agency_number, account_number, account_type, is_verified
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (partner_id) DO UPDATE SET
       gateway_subaccount_id = EXCLUDED.gateway_subaccount_id,
       pix_key               = EXCLUDED.pix_key,
       pix_key_type          = EXCLUDED.pix_key_type,
       bank_code             = EXCLUDED.bank_code,
       agency_number         = EXCLUDED.agency_number,
       account_number        = EXCLUDED.account_number,
       account_type          = EXCLUDED.account_type,
       is_verified           = EXCLUDED.is_verified,
       updated_at            = CURRENT_TIMESTAMP`,
    [
      'fa000001-0000-0000-0000-000000000001',
      partnerId,
      'sub_asaas_bistro_fit_001',
      '12.345.678/0001-95',
      'CNPJ',
      '260',
      '0001',
      '1234567-8',
      'CHECKING',
      true,
    ]
  );
  console.log('  🏦 Subconta financeira configurada para Bistro Sem Gluten Fit (Chave PIX: 12.345.678/0001-95)');
}

async function seedOrdersAndPayments(emailToId: Map<string, string>): Promise<void> {
  const celiacoId = emailToId.get('celiaco.classico@seed.celilac.dev');
  if (!celiacoId) return;

  const partnerId = 'c0000001-0000-0000-0000-000000000001'; // Bistro Sem Gluten Fit
  const breadId = 'b0000008-0000-0000-0000-000000000001';
  const cakeId = 'b0000008-0000-0000-0000-000000000002';

  // 1. Pedido 1: Em aberto para teste de Checkout PIX (AWAITING_PAYMENT)
  const order1Id = 'd0000001-0000-0000-0000-000000000001';
  await pool.query(
    `INSERT INTO orders (id, consumer_id, partner_id, status, subtotal_amount, delivery_fee, total_amount, allergen_check_verdict, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
    [order1Id, celiacoId, partnerId, 'AWAITING_PAYMENT', 59.80, 0.00, 59.80, 'SAFE', 'Favor embalar separadamente para evitar contato.']
  );
  await pool.query(
    `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    ['d0000002-0000-0000-0000-000000000001', order1Id, breadId, 'Pão Francês Artesanal Sem Glúten', 29.90, 2, 59.80]
  );
  await pool.query(
    `INSERT INTO payments (id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id, method, status, gross_amount, net_partner_amount, platform_fee_amount, pix_qr_code, pix_copy_paste, pix_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
    [
      'f0000001-0000-0000-0000-000000000001',
      order1Id,
      celiacoId,
      partnerId,
      'ASAAS',
      'pay_seed_asaas_001',
      'PIX',
      'PENDING',
      59.80,
      50.63,
      7.18,
      'https://api.asaas.com/qr/seed_payload_001',
      '00020126580014br.gov.bcb.pix0136bistro-pix-seed-key520400005303986540559.805802BR5915CELILAC PAGAMENTOS6009SAO PAULO62070503***6304ABCD',
      new Date(Date.now() + 24 * 3600 * 1000)
    ]
  );
  console.log(`  📦 [AWAITING_PAYMENT] Pedido Checkout PIX: ${order1Id} (Total: R$ 59,80)`);

  // 2. Pedido 2: Pago e em preparo na cozinha (PREPARING)
  const order2Id = 'd0000001-0000-0000-0000-000000000002';
  await pool.query(
    `INSERT INTO orders (id, consumer_id, partner_id, status, subtotal_amount, delivery_fee, total_amount, allergen_check_verdict, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
    [order2Id, celiacoId, partnerId, 'PREPARING', 35.00, 0.00, 35.00, 'SAFE', 'Para viagem imediata.']
  );
  await pool.query(
    `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    ['d0000002-0000-0000-0000-000000000002', order2Id, cakeId, 'Bolo de Cenoura com Chocolate Sem Leite', 35.00, 1, 35.00]
  );
  await pool.query(
    `INSERT INTO payments (id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id, method, status, gross_amount, net_partner_amount, platform_fee_amount, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
    [
      'f0000001-0000-0000-0000-000000000002',
      order2Id,
      celiacoId,
      partnerId,
      'ASAAS',
      'pay_seed_asaas_002',
      'PIX',
      'PAID',
      35.00,
      28.81,
      4.20,
      new Date()
    ]
  );
  console.log(`  🍳 [PREPARING] Pedido em Cozinha do Parceiro: ${order2Id} (Total: R$ 35,00)`);

  // 3. Pedido 3: Concluído e Entregue (DELIVERED)
  const order3Id = 'd0000001-0000-0000-0000-000000000003';
  await pool.query(
    `INSERT INTO orders (id, consumer_id, partner_id, status, subtotal_amount, delivery_fee, total_amount, allergen_check_verdict, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
    [order3Id, celiacoId, partnerId, 'DELIVERED', 94.80, 0.00, 94.80, 'SAFE', 'Entregar na portaria.']
  );
  await pool.query(
    `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    ['d0000002-0000-0000-0000-000000000003', order3Id, breadId, 'Pão Francês Artesanal Sem Glúten', 29.90, 2, 59.80]
  );
  await pool.query(
    `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    ['d0000002-0000-0000-0000-000000000004', order3Id, cakeId, 'Bolo de Cenoura com Chocolate Sem Leite', 35.00, 1, 35.00]
  );
  await pool.query(
    `INSERT INTO payments (id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id, method, status, gross_amount, net_partner_amount, platform_fee_amount, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
    [
      'f0000001-0000-0000-0000-000000000003',
      order3Id,
      celiacoId,
      partnerId,
      'ASAAS',
      'pay_seed_asaas_003',
      'PIX',
      'PAID',
      94.80,
      81.43,
      11.38,
      new Date(Date.now() - 3600 * 1000 * 24)
    ]
  );
  console.log(`  🛵 [DELIVERED] Pedido Concluído e Entregue: ${order3Id} (Total: R$ 94,80)`);
}

// ─── Entry point ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🌱 CeLiLac — Script de Seed');
  console.log('═'.repeat(55));
  console.log('⚠️  Dados fictícios para ambiente local APENAS\n');

  try {
    // Verificar conexão
    await pool.query('SELECT 1');
    console.log('📡 Conexão com PostgreSQL estabelecida.\n');

    // 1. Garantir tabelas products, certifications, orders e payments
    console.log('📦 Verificando tabelas…');
    await createProductsTableIfNotExists();
    await createCertificationsTableIfNotExists();
    await createOrdersAndPaymentsTablesIfNotExists();
    console.log('');

    // 2. Usuários
    console.log('👥 Inserindo usuários…');
    const emailToId = await seedUsers();
    console.log('');

    // 3. Perfis alimentares
    console.log('🥗 Inserindo perfis alimentares…');
    await seedFoodProfiles(emailToId);
    console.log('');

    // 4. Parceiros
    console.log('🏢 Inserindo parceiros comerciais…');
    await seedPartners(emailToId);
    console.log('');

    // 5. Produtos
    console.log('🏪 Inserindo produtos…');
    await seedProducts();
    console.log('');

    // 6. Certificações e Laudos
    console.log('🏅 Inserindo certificações e laudos de produtos…');
    await seedProductCertifications();
    console.log('');

    // 7. Subcontas Financeiras e Chaves PIX
    console.log('💳 Configurando subcontas financeiras e chaves PIX…');
    await seedPartnerFinancialAccounts();
    console.log('');

    // 8. Pedidos e Pagamentos (Casos de teste do Checkout e Split)
    console.log('📦 Inserindo pedidos e pagamentos de teste…');
    await seedOrdersAndPayments(emailToId);
    console.log('');

    // Resumo final
    const { rows: userCount } = await pool.query('SELECT COUNT(*) FROM users');
    const { rows: profileCount } = await pool.query('SELECT COUNT(*) FROM food_profiles');
    const { rows: partnerCount } = await pool.query('SELECT COUNT(*) FROM partners');
    const { rows: productCount } = await pool.query('SELECT COUNT(*) FROM products');
    const { rows: certCount } = await pool.query('SELECT COUNT(*) FROM product_certifications');
    const { rows: orderCount } = await pool.query('SELECT COUNT(*) FROM orders');
    const { rows: paymentCount } = await pool.query('SELECT COUNT(*) FROM payments');
    const { rows: financialAccountCount } = await pool.query('SELECT COUNT(*) FROM partner_financial_accounts');

    console.log('═'.repeat(55));
    console.log('✅ Seed concluído com sucesso!');
    console.log(`   👤 Usuários:            ${userCount[0].count}`);
    console.log(`   🥗 Perfis:              ${profileCount[0].count}`);
    console.log(`   🏢 Parceiros:           ${partnerCount[0].count}`);
    console.log(`   🏪 Produtos:            ${productCount[0].count}`);
    console.log(`   🏅 Certificações:       ${certCount[0].count}`);
    console.log(`   📦 Pedidos:             ${orderCount[0].count}`);
    console.log(`   💳 Pagamentos:          ${paymentCount[0].count}`);
    console.log(`   🏦 Subcontas PIX:       ${financialAccountCount[0].count}`);
    console.log('');
    console.log('📋 Credenciais de teste:');
    for (const user of USERS) {
      console.log(`   ${user.email.padEnd(45)} senha: Seed@123456`);
    }
    console.log('');
    console.log('🚀 URLs de Teste Rápido (Web App em http://localhost:3001):');
    console.log('   🛒 Checkout PIX em Aberto: /checkout/d0000001-0000-0000-0000-000000000001');
    console.log('   📦 Meus Pedidos (Celíaco): /orders');
    console.log('   🍳 Fila de Pedidos (Cozinha do Parceiro): /partner/orders');
    console.log('   💰 Extrato & Split 12% (Financeiro do Parceiro): /partner/financial');
    console.log('═'.repeat(55));
  } catch (err) {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
