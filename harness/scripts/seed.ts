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
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME     ?? 'celilac_db',
  user:     process.env.DB_USER     ?? 'celilac_user',
  password: process.env.DB_PASSWORD ?? 'celilac_password',
});

// ─── Paleta de dados fictícios ──────────────────────────────────────────────

const USERS: Array<{
  email:        string;
  password:     string;
  role:         string;
  profileLabel: string;
  restrictions: Array<{ allergen: string; severity: string; id: string }>;
}> = [
  {
    email:        'celiaco.classico@seed.celilac.dev',
    password:     'Seed@123456',
    role:         'CELIACO',
    profileLabel: 'Celíaco clássico — glúten FATAL',
    restrictions: [
      { id: 'a1000001-0000-0000-0000-000000000001', allergen: 'GLUTEN',  severity: 'FATAL' },
      { id: 'a1000001-0000-0000-0000-000000000002', allergen: 'LACTOSE', severity: 'LOW'   },
    ],
  },
  {
    email:        'aplv.severo@seed.celilac.dev',
    password:     'Seed@123456',
    role:         'CELIACO',
    profileLabel: 'APLV severo — leite e ovo HIGH',
    restrictions: [
      { id: 'a2000001-0000-0000-0000-000000000001', allergen: 'LACTOSE', severity: 'FATAL' },
      { id: 'a2000001-0000-0000-0000-000000000002', allergen: 'EGGS',    severity: 'HIGH'  },
    ],
  },
  {
    email:        'multiplo.alergico@seed.celilac.dev',
    password:     'Seed@123456',
    role:         'CELIACO',
    profileLabel: 'Múltiplas restrições — glúten + castanhas + soja',
    restrictions: [
      { id: 'a3000001-0000-0000-0000-000000000001', allergen: 'GLUTEN',  severity: 'FATAL'  },
      { id: 'a3000001-0000-0000-0000-000000000002', allergen: 'NUTS',    severity: 'HIGH'   },
      { id: 'a3000001-0000-0000-0000-000000000003', allergen: 'SOY',     severity: 'MEDIUM' },
    ],
  },
  {
    email:        'sensivel.leve@seed.celilac.dev',
    password:     'Seed@123456',
    role:         'CELIACO',
    profileLabel: 'Sensibilidade leve — lactose e gergelim LOW',
    restrictions: [
      { id: 'a4000001-0000-0000-0000-000000000001', allergen: 'LACTOSE', severity: 'LOW' },
      { id: 'a4000001-0000-0000-0000-000000000002', allergen: 'SESAME',  severity: 'LOW' },
    ],
  },
  {
    email:        'parceiro.restaurante@seed.celilac.dev',
    password:     'Seed@123456',
    role:         'PARCEIRO',
    profileLabel: 'Parceiro — sem perfil alimentar',
    restrictions: [],
  },
];

const PRODUCTS: Array<{
  id:                 string;
  name:               string;
  brand:              string;
  ingredients:        string;
  has_gluten:         boolean;
  cross_contamination:string;
  analysis_status:    string;
}> = [
  // ── SAFE para celíacos ─────────────────────────────────────────────────────
  {
    id:                  'b0000001-0000-0000-0000-000000000001',
    name:                'Arroz Integral Orgânico',
    brand:               'Fazenda Natural',
    ingredients:         'arroz integral orgânico',
    has_gluten:          false,
    cross_contamination: '',
    analysis_status:     'ANALISADO',
  },
  {
    id:                  'b0000001-0000-0000-0000-000000000002',
    name:                'Feijão Carioca Seco',
    brand:               'Campo Belo',
    ingredients:         'feijão carioca',
    has_gluten:          false,
    cross_contamination: '',
    analysis_status:     'ANALISADO',
  },
  {
    id:                  'b0000001-0000-0000-0000-000000000003',
    name:                'Azeite de Oliva Extra Virgem',
    brand:               'Monte Cristallo',
    ingredients:         'azeite de oliva extra virgem 100%',
    has_gluten:          false,
    cross_contamination: '',
    analysis_status:     'ANALISADO',
  },
  // ── WARNING — traços leves ─────────────────────────────────────────────────
  {
    id:                  'b0000002-0000-0000-0000-000000000001',
    name:                'Chocolate Amargo 70%',
    brand:               'Cacau Select',
    ingredients:         'pasta de cacau, manteiga de cacau, açúcar, lecitina de soja',
    has_gluten:          false,
    cross_contamination: 'Pode conter traços de leite e amêndoas.',
    analysis_status:     'ANALISADO',
  },
  {
    id:                  'b0000002-0000-0000-0000-000000000002',
    name:                'Granola Sem Glúten',
    brand:               'VidaLight',
    ingredients:         'aveia certificada sem glúten, mel, frutas secas, óleo de coco',
    has_gluten:          false,
    cross_contamination: 'Produzido em fábrica que processa castanhas e amendoim.',
    analysis_status:     'ANALISADO',
  },
  // ── DANGER — alérgeno de alta severidade ──────────────────────────────────
  {
    id:                  'b0000003-0000-0000-0000-000000000001',
    name:                'Pão de Forma Integral',
    brand:               'Trigo Dourado',
    ingredients:         'farinha de trigo integral, água, sal, fermento biológico, açúcar',
    has_gluten:          true,
    cross_contamination: '',
    analysis_status:     'ANALISADO',
  },
  {
    id:                  'b0000003-0000-0000-0000-000000000002',
    name:                'Macarrão Espaguete Grano Duro',
    brand:               'La Pasta',
    ingredients:         'semolina de trigo duro (glúten), água',
    has_gluten:          true,
    cross_contamination: '',
    analysis_status:     'ANALISADO',
  },
  {
    id:                  'b0000003-0000-0000-0000-000000000003',
    name:                'Iogurte Grego Integral',
    brand:               'Leite Vivo',
    ingredients:         'leite integral pasteurizado, creme de leite, fermento lático',
    has_gluten:          false,
    cross_contamination: '',
    analysis_status:     'ANALISADO',
  },
  // ── BLOCKED — FATAL para celíacos ─────────────────────────────────────────
  {
    id:                  'b0000004-0000-0000-0000-000000000001',
    name:                'Biscoito de Aveia com Mel',
    brand:               'NaturSnack',
    ingredients:         'aveia, mel, manteiga, açúcar mascavo, farinha de trigo',
    has_gluten:          true,
    cross_contamination: 'Contém glúten. Produzido em linha compartilhada.',
    analysis_status:     'ANALISADO',
  },
  {
    id:                  'b0000004-0000-0000-0000-000000000002',
    name:                'Molho de Soja Shoyu',
    brand:               'Sakura',
    ingredients:         'soja, trigo, sal, água, caramelo',
    has_gluten:          true,
    cross_contamination: 'Contém glúten e soja.',
    analysis_status:     'ANALISADO',
  },
  // ── CASO CRÍTICO: has_gluten=false mas traços de glúten → BLOCKED para celíacos
  {
    id:                  'b0000004-0000-0000-0000-000000000003',
    name:                'Farofa Temperada "Sem Glúten"',
    brand:               'FarinhaMax',
    ingredients:         'farinha de mandioca, óleo vegetal, sal, temperos',
    has_gluten:          false,
    cross_contamination: 'Pode conter traços de glúten de trigo.',
    analysis_status:     'ANALISADO',
  },
  // ── PENDENTE — sem ingredientes declarados → BLOCKED por precaução ─────────
  {
    id:                  'b0000005-0000-0000-0000-000000000001',
    name:                'Produto Importado Sem Rótulo Traduzido',
    brand:               'Unknown Brand',
    ingredients:         '',
    has_gluten:          false,
    cross_contamination: '',
    analysis_status:     'PENDENTE_DE_ANALISE',
  },
  // ── Frutas do mar (para APLV + shellfish) ─────────────────────────────────
  {
    id:                  'b0000006-0000-0000-0000-000000000001',
    name:                'Camarão Empanado Congelado',
    brand:               'Mar Profundo',
    ingredients:         'camarão (60%), farinha de trigo, amido de milho, sal, páprica',
    has_gluten:          true,
    cross_contamination: 'Contém camarão, glúten. Processado com outros frutos do mar.',
    analysis_status:     'ANALISADO',
  },
  // ── Produto com castanhas (para NUTS HIGH) ─────────────────────────────────
  {
    id:                  'b0000007-0000-0000-0000-000000000001',
    name:                'Mix de Castanhas Premium',
    brand:               'Nature\'s Best',
    ingredients:         'castanha-do-pará, amêndoa, castanha de caju, nozes, macadâmia',
    has_gluten:          false,
    cross_contamination: 'Processado em ambiente com amendoim.',
    analysis_status:     'ANALISADO',
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
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_has_gluten ON products(has_gluten)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(analysis_status)`);

  console.log('  ✅ Tabela products garantida.');
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

async function seedProducts(): Promise<void> {
  for (const product of PRODUCTS) {
    await pool.query(
      `INSERT INTO products (id, name, brand, ingredients, has_gluten, cross_contamination, analysis_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name                = EXCLUDED.name,
         brand               = EXCLUDED.brand,
         ingredients         = EXCLUDED.ingredients,
         has_gluten          = EXCLUDED.has_gluten,
         cross_contamination = EXCLUDED.cross_contamination,
         analysis_status     = EXCLUDED.analysis_status,
         updated_at          = CURRENT_TIMESTAMP`,
      [
        product.id,
        product.name,
        product.brand,
        product.ingredients,
        product.has_gluten,
        product.cross_contamination,
        product.analysis_status,
      ],
    );

    const statusIcon = product.ingredients === '' ? '⏳' :
                       product.has_gluten           ? '⛔' :
                       product.cross_contamination.toLowerCase().includes('glúten') ? '⛔' :
                       product.cross_contamination  ? '⚠️' : '✅';

    console.log(`  ${statusIcon} [${product.analysis_status.padEnd(20)}] ${product.name} (${product.brand})`);
  }
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

    // 1. Garantir tabela products
    console.log('📦 Verificando tabela products…');
    await createProductsTableIfNotExists();
    console.log('');

    // 2. Usuários
    console.log('👥 Inserindo usuários…');
    const emailToId = await seedUsers();
    console.log('');

    // 3. Perfis alimentares
    console.log('🥗 Inserindo perfis alimentares…');
    await seedFoodProfiles(emailToId);
    console.log('');

    // 4. Produtos
    console.log('🏪 Inserindo produtos…');
    await seedProducts();
    console.log('');

    // Resumo final
    const { rows: userCount }    = await pool.query('SELECT COUNT(*) FROM users');
    const { rows: profileCount } = await pool.query('SELECT COUNT(*) FROM food_profiles');
    const { rows: productCount } = await pool.query('SELECT COUNT(*) FROM products');

    console.log('═'.repeat(55));
    console.log('✅ Seed concluído com sucesso!');
    console.log(`   👤 Usuários:    ${userCount[0].count}`);
    console.log(`   🥗 Perfis:      ${profileCount[0].count}`);
    console.log(`   🏪 Produtos:    ${productCount[0].count}`);
    console.log('');
    console.log('📋 Credenciais de teste:');
    for (const user of USERS) {
      console.log(`   ${user.email.padEnd(45)} senha: Seed@123456`);
    }
    console.log('═'.repeat(55));
  } catch (err) {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
