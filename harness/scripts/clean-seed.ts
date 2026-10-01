// harness/scripts/clean-seed.ts
// =============================================================
// Script de Limpeza de Dados de Teste / Seed — CeLiLac
// Remove de forma cirúrgica e segura apenas os dados e pedidos
// criados pelos scripts de seed/teste, sem tocar em nenhuma conta
// ou pedido real do sistema!
//
// Uso:
//   cd harness/scripts
//   npm run clean:seed
// =============================================================

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'celilac_db',
  user: process.env.DB_USER ?? 'celilac_user',
  password: process.env.DB_PASSWORD ?? 'celilac_password',
});

async function main(): Promise<void> {
  console.log('\n🧹 CeLiLac — Limpeza Segura de Dados de Teste / Seed');
  console.log('═'.repeat(60));

  try {
    await pool.query('SELECT 1');
    console.log('📡 Conexão com PostgreSQL estabelecida com sucesso.\n');

    // 1. Remover pagamentos e pedidos de teste (IDs com prefixo determinístico d000000... e f000000...)
    console.log('🗑️  Removendo pagamentos e reembolsos de teste…');
    await pool.query(`DELETE FROM payment_refunds WHERE id::text LIKE 'fr000001-%' OR payment_id::text LIKE 'f0000001-%'`);
    await pool.query(`DELETE FROM payments WHERE id::text LIKE 'f0000001-%' OR gateway_transaction_id LIKE 'pay_seed_%' OR gateway_transaction_id LIKE 'pay_offline_%'`);

    console.log('🗑️  Removendo itens e pedidos de teste…');
    await pool.query(`DELETE FROM order_items WHERE id::text LIKE 'd0000002-%' OR order_id::text LIKE 'd0000001-%'`);
    await pool.query(`DELETE FROM orders WHERE id::text LIKE 'd0000001-%'`);

    // 2. Remover subcontas financeiras de teste
    console.log('🗑️  Removendo subcontas financeiras de teste…');
    await pool.query(`DELETE FROM partner_financial_accounts WHERE id::text LIKE 'fa000001-%'`);

    // 3. Remover certificações e laudos de teste
    console.log('🗑️  Removendo certificações e laudos de teste…');
    await pool.query(`DELETE FROM product_certifications WHERE id::text LIKE 'e0000001-%'`);

    // 4. Remover produtos de teste
    console.log('🗑️  Removendo produtos de teste…');
    await pool.query(`DELETE FROM products WHERE id::text LIKE 'b000000%'`);

    // 5. Remover parceiros fictícios de teste (Bistro Sem Glúten Fit, etc.)
    console.log('🗑️  Removendo parceiros fictícios…');
    await pool.query(`DELETE FROM partners WHERE id::text LIKE 'c0000001-%'`);

    // 6. Remover usuários fictícios (@seed.celilac.dev)
    console.log('🗑️  Removendo usuários fictícios (@seed.celilac.dev)…');
    await pool.query(`DELETE FROM users WHERE email LIKE '%@seed.celilac.dev'`);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Limpeza concluída com sucesso!');
    console.log('   🛡️  Todas as contas, estabelecimentos e pedidos reais foram preservados intactos.');
    console.log('═'.repeat(60) + '\n');
  } catch (err) {
    console.error('❌ Erro durante a limpeza:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
