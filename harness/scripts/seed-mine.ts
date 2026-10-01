// harness/scripts/seed-mine.ts
// =============================================================
// Script de Seed Direcionado — CeLiLac
// Popula o banco com pedidos e dados de teste vinculados
// DIRETAMENTE aos estabelecimentos e usuários já cadastrados na VPS!
//
// Não cria contas fantasmas.
// Vincula os pedidos aos seus estabelecimentos e ao seu cliente real.
//
// Uso:
//   cd harness/scripts
//   npm run seed:mine
//
// Opções via Variáveis de Ambiente (opcionais):
//   PARTNER_NAME="Pesque e Prosa"
//   CONSUMER_EMAIL="seu_email@dominio.com"
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
  console.log('\n🎯 CeLiLac — Seed Direcionado para Contas Reais');
  console.log('═'.repeat(60));

  try {
    await pool.query('SELECT 1');
    console.log('📡 Conexão com PostgreSQL estabelecida com sucesso.\n');

    // 1. Identificar Parceiro Real
    console.log('🔍 Localizando estabelecimento no banco de dados…');
    const partnerFilterName = process.env.PARTNER_NAME?.trim();
    const partnerFilterId = process.env.PARTNER_ID?.trim();

    let partnerQuery = `
      SELECT p.id, p.name, p.user_id, u.email as owner_email, u.full_name as owner_name
      FROM partners p
      JOIN users u ON u.id = p.user_id
    `;
    const partnerParams: any[] = [];

    if (partnerFilterId) {
      partnerQuery += ` WHERE p.id = $1`;
      partnerParams.push(partnerFilterId);
    } else if (partnerFilterName) {
      partnerQuery += ` WHERE p.name ILIKE $1`;
      partnerParams.push(`%${partnerFilterName}%`);
    } else {
      partnerQuery += ` WHERE p.id::text NOT LIKE 'c0000001-%' ORDER BY p.created_at ASC LIMIT 1`;
    }

    const { rows: partnersFound } = await pool.query(partnerQuery, partnerParams);

    if (partnersFound.length === 0) {
      // Se não encontrou parceiro real, busca qualquer parceiro existente
      const { rows: fallbackPartners } = await pool.query(`SELECT id, name, user_id FROM partners LIMIT 1`);
      if (fallbackPartners.length === 0) {
        console.error('❌ Nenhum estabelecimento parceiro encontrado no banco!');
        console.error('👉 Crie um estabelecimento na plataforma ou cadastre-se como parceiro primeiro.');
        process.exit(1);
      }
      partnersFound.push(fallbackPartners[0]);
    }

    const targetPartner = partnersFound[0];
    console.log(`  🏢 Estabelecimento Selecionado: "${targetPartner.name}"`);
    console.log(`     ID: ${targetPartner.id}`);
    if (targetPartner.owner_email) {
      console.log(`     Responsável: ${targetPartner.owner_name ?? targetPartner.owner_email}`);
    }
    console.log('');

    // 2. Identificar Consumidor Real
    console.log('🔍 Localizando conta de cliente para simulação…');
    const consumerFilterEmail = process.env.CONSUMER_EMAIL?.trim();

    let consumerQuery = `
      SELECT id, email, full_name, role
      FROM users
    `;
    const consumerParams: any[] = [];

    if (consumerFilterEmail) {
      consumerQuery += ` WHERE email = $1`;
      consumerParams.push(consumerFilterEmail);
    } else {
      // Prioriza usuários não-seed e que não sejam unicamente o parceiro, ou o primeiro não-seed
      consumerQuery += `
        WHERE email NOT LIKE '%@seed.celilac.dev'
        ORDER BY 
          CASE WHEN role IN ('CELIACO', 'CONSUMIDOR') THEN 1 ELSE 2 END,
          created_at ASC
        LIMIT 1
      `;
    }

    const { rows: consumersFound } = await pool.query(consumerQuery, consumerParams);

    if (consumersFound.length === 0) {
      // Fallback para qualquer usuário
      const { rows: fallbackUsers } = await pool.query(`SELECT id, email, full_name, role FROM users LIMIT 1`);
      if (fallbackUsers.length === 0) {
        console.error('❌ Nenhum usuário encontrado no banco!');
        process.exit(1);
      }
      consumersFound.push(fallbackUsers[0]);
    }

    const targetConsumer = consumersFound[0];
    console.log(`  👤 Cliente Selecionado: "${targetConsumer.full_name ?? targetConsumer.email}"`);
    console.log(`     Email: ${targetConsumer.email} (ID: ${targetConsumer.id})`);
    console.log('');

    // 3. Garantir Produtos para o Estabelecimento
    console.log('🏪 Verificando cardápio / produtos do estabelecimento…');
    let { rows: existingProducts } = await pool.query(
      `SELECT id, name, price FROM products WHERE partner_id = $1 LIMIT 5`,
      [targetPartner.id]
    );

    let prod1 = existingProducts[0];
    let prod2 = existingProducts[1];

    if (!prod1) {
      console.log('  ➕ Cadastrando produto de demonstração 1 para o cardápio…');
      const prod1Id = 'b0000008-0000-0000-0000-000000000001';
      await pool.query(
        `INSERT INTO products (
          id, name, brand, ingredients, has_gluten, cross_contamination,
          analysis_status, partner_id, price, category, is_published, in_stock
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          partner_id = EXCLUDED.partner_id,
          price = EXCLUDED.price,
          is_published = TRUE,
          in_stock = TRUE`,
        [
          prod1Id,
          'Pão Francês Artesanal Sem Glúten',
          targetPartner.name,
          'farinha de arroz, polvilho doce, água, fermento biológico, sal',
          false,
          '',
          'ANALISADO',
          targetPartner.id,
          29.90,
          'Padaria & Panificação',
          true,
          true,
        ]
      );
      prod1 = { id: prod1Id, name: 'Pão Francês Artesanal Sem Glúten', price: 29.90 };
    }

    if (!prod2) {
      console.log('  ➕ Cadastrando produto de demonstração 2 para o cardápio…');
      const prod2Id = 'b0000008-0000-0000-0000-000000000002';
      await pool.query(
        `INSERT INTO products (
          id, name, brand, ingredients, has_gluten, cross_contamination,
          analysis_status, partner_id, price, category, is_published, in_stock
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          partner_id = EXCLUDED.partner_id,
          price = EXCLUDED.price,
          is_published = TRUE,
          in_stock = TRUE`,
        [
          prod2Id,
          'Bolo de Cenoura com Chocolate Sem Leite',
          targetPartner.name,
          'cenoura fresca, ovos, açúcar demerara, óleo de girassol, cacau em pó 70%',
          false,
          '',
          'ANALISADO',
          targetPartner.id,
          35.00,
          'Doces & Sobremesas',
          true,
          true,
        ]
      );
      prod2 = { id: prod2Id, name: 'Bolo de Cenoura com Chocolate Sem Leite', price: 35.00 };
    }

    console.log(`  ✅ Cardápio pronto:`);
    console.log(`     • ${prod1.name} (R$ ${Number(prod1.price).toFixed(2)})`);
    console.log(`     • ${prod2.name} (R$ ${Number(prod2.price).toFixed(2)})`);
    console.log('');

    // 4. Configurar Conta Financeira do Estabelecimento (Painel Financeiro)
    console.log('💳 Configurando subconta financeira e chave PIX para o restaurante…');
    const financialAccountId = 'fa000001-0000-0000-0000-000000000001';
    await pool.query(
      `INSERT INTO partner_financial_accounts (
        id, partner_id, gateway_subaccount_id, pix_key, pix_key_type,
        bank_code, agency_number, account_number, account_type, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (partner_id) DO UPDATE SET
        is_verified = TRUE,
        updated_at = CURRENT_TIMESTAMP`,
      [
        financialAccountId,
        targetPartner.id,
        `sub_asaas_${targetPartner.id.substring(0, 8)}`,
        '12.345.678/0001-95',
        'CNPJ',
        '260',
        '0001',
        '9876543-2',
        'CHECKING',
        true,
      ]
    );
    console.log(`  ✅ Painel Financeiro habilitado (/partner/financial) com Split de 12% ativo.`);
    console.log('');

    // 5. Inserir Pedidos de Teste Vinculados
    console.log('📦 Inserindo pedidos de teste vinculados diretamente ao seu estabelecimento…');

    // Pedido 1: PIX Aberto
    const order1Id = 'd0000001-0000-0000-0000-000000000001';
    await pool.query(
      `INSERT INTO orders (id, consumer_id, partner_id, status, subtotal_amount, delivery_fee, total_amount, allergen_check_verdict, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         cancel_reason = NULL,
         cancelled_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      [order1Id, targetConsumer.id, targetPartner.id, 'AWAITING_PAYMENT', 59.80, 0.00, 59.80, 'SAFE', 'Favor embalar separadamente para evitar contato.']
    );
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      ['d0000002-0000-0000-0000-000000000001', order1Id, prod1.id, prod1.name, 29.90, 2, 59.80]
    );
    await pool.query(
      `INSERT INTO payments (id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id, method, status, gross_amount, net_partner_amount, platform_fee_amount, pix_qr_code, pix_copy_paste, pix_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         updated_at = CURRENT_TIMESTAMP`,
      [
        'f0000001-0000-0000-0000-000000000001',
        order1Id,
        targetConsumer.id,
        targetPartner.id,
        'ASAAS',
        'pay_seed_asaas_001',
        'PIX',
        'PENDING',
        59.80,
        50.63,
        7.18,
        'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=00020126580014br.gov.bcb.pix0136bistro-pix-seed-key520400005303986540559.805802BR5915CELILAC%20PAGAMENTOS6009SAO%20PAULO62070503***6304ABCD',
        '00020126580014br.gov.bcb.pix0136bistro-pix-seed-key520400005303986540559.805802BR5915CELILAC PAGAMENTOS6009SAO PAULO62070503***6304ABCD',
        new Date(Date.now() + 24 * 3600 * 1000)
      ]
    );
    console.log(`  🛒 [AWAITING_PAYMENT] Checkout PIX em Aberto: #${order1Id.substring(0, 8)} (R$ 59,80)`);

    // Pedido 2: PIX Pago / Em Preparo
    const order2Id = 'd0000002-0000-0000-0000-000000000002';
    await pool.query(
      `INSERT INTO orders (id, consumer_id, partner_id, status, subtotal_amount, delivery_fee, total_amount, allergen_check_verdict, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         cancel_reason = NULL,
         cancelled_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      [order2Id, targetConsumer.id, targetPartner.id, 'PREPARING', 35.00, 0.00, 35.00, 'SAFE', 'Para viagem imediata.']
    );
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      ['d0000002-0000-0000-0000-000000000002', order2Id, prod2.id, prod2.name, 35.00, 1, 35.00]
    );
    await pool.query(
      `INSERT INTO payments (id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id, method, status, gross_amount, net_partner_amount, platform_fee_amount, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         updated_at = CURRENT_TIMESTAMP`,
      [
        'f0000001-0000-0000-0000-000000000002',
        order2Id,
        targetConsumer.id,
        targetPartner.id,
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
    console.log(`  🍳 [PREPARING] Pago via PIX - Na Cozinha / Em Preparo: #${order2Id.substring(0, 8)} (R$ 35,00)`);

    // Pedido 4: Maquininha na Entrega (Novo Pedido aguardando aceite do restaurante!)
    const order4Id = 'd0000004-0000-0000-0000-000000000004';
    await pool.query(
      `INSERT INTO orders (id, consumer_id, partner_id, status, subtotal_amount, delivery_fee, total_amount, allergen_check_verdict, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         cancel_reason = NULL,
         cancelled_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      [order4Id, targetConsumer.id, targetPartner.id, 'AWAITING_PAYMENT', 35.00, 0.00, 35.00, 'SAFE', 'Pagamento na entrega: Levar máquina de cartão (Débito/Crédito).']
    );
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      ['d0000002-0000-0000-0000-000000000005', order4Id, prod2.id, prod2.name, 35.00, 1, 35.00]
    );
    await pool.query(
      `INSERT INTO payments (id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id, method, status, gross_amount, net_partner_amount, platform_fee_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         updated_at = CURRENT_TIMESTAMP`,
      [
        'f0000001-0000-0000-0000-000000000004',
        order4Id,
        targetConsumer.id,
        targetPartner.id,
        'OFFLINE',
        'pay_offline_delivery_card_004',
        'CARD_ON_DELIVERY',
        'PENDING',
        35.00,
        31.41,
        3.59
      ]
    );
    console.log(`  🔔 [AWAITING_PAYMENT] Maquininha na Entrega (Aguardando Aceite na aba "Novos"): #${order4Id.substring(0, 8)} (R$ 35,00)`);

    // Pedido 5: Dinheiro na Entrega com Troco (Aceito / Em Preparo)
    const order5Id = 'd0000005-0000-0000-0000-000000000005';
    await pool.query(
      `INSERT INTO orders (id, consumer_id, partner_id, status, subtotal_amount, delivery_fee, total_amount, allergen_check_verdict, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         cancel_reason = NULL,
         cancelled_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      [order5Id, targetConsumer.id, targetPartner.id, 'CONFIRMED', 29.90, 5.10, 35.00, 'SAFE', 'Pagamento em dinheiro na entrega. Levar troco para R$ 50,00.']
    );
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      ['d0000002-0000-0000-0000-000000000006', order5Id, prod1.id, prod1.name, 29.90, 1, 29.90]
    );
    await pool.query(
      `INSERT INTO payments (id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id, method, status, gross_amount, net_partner_amount, platform_fee_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         updated_at = CURRENT_TIMESTAMP`,
      [
        'f0000001-0000-0000-0000-000000000005',
        order5Id,
        targetConsumer.id,
        targetPartner.id,
        'OFFLINE',
        'pay_offline_delivery_cash_005',
        'CASH_ON_DELIVERY',
        'PENDING',
        35.00,
        31.41,
        3.59
      ]
    );
    console.log(`  💵 [CONFIRMED] Dinheiro na Entrega (Aceito / Em Preparo com Troco p/ R$ 50): #${order5Id.substring(0, 8)} (R$ 35,00)`);

    // Pedido 6: Maquininha na Entrega — Saiu para Entrega (Pronto / Em Rota — ideal para testar Reportar Problema)
    const order6Id = 'd0000006-0000-0000-0000-000000000006';
    await pool.query(
      `INSERT INTO orders (id, consumer_id, partner_id, status, subtotal_amount, delivery_fee, total_amount, allergen_check_verdict, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         cancel_reason = NULL,
         cancelled_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      [order6Id, targetConsumer.id, targetPartner.id, 'OUT_FOR_DELIVERY', 94.80, 0.00, 94.80, 'SAFE', 'Entregar na portaria. Pagamento na maquininha na entrega.']
    );
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      ['d0000002-0000-0000-0000-000000000007', order6Id, prod1.id, prod1.name, 29.90, 2, 59.80]
    );
    await pool.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      ['d0000002-0000-0000-0000-000000000008', order6Id, prod2.id, prod2.name, 35.00, 1, 35.00]
    );
    await pool.query(
      `INSERT INTO payments (id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id, method, status, gross_amount, net_partner_amount, platform_fee_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET 
         consumer_id = EXCLUDED.consumer_id,
         partner_id = EXCLUDED.partner_id,
         status = EXCLUDED.status, 
         updated_at = CURRENT_TIMESTAMP`,
      [
        'f0000001-0000-0000-0000-000000000006',
        order6Id,
        targetConsumer.id,
        targetPartner.id,
        'OFFLINE',
        'pay_offline_delivery_card_006',
        'CARD_ON_DELIVERY',
        'PENDING',
        94.80,
        83.42,
        11.38
      ]
    );
    console.log(`  🛵 [OUT_FOR_DELIVERY] Saiu para Entrega (Com botão "Reportar Problema"): #${order6Id.substring(0, 8)} (R$ 94,80)`);
    console.log('');

    // 6. Transmitir Notificação em Tempo Real para o Backend
    console.log('🔔 Disparando notificação em tempo real para o estabelecimento…');
    try {
      const backendPort = process.env.PORT ?? '3000';
      const notifyRes = await fetch(`http://localhost:${backendPort}/orders/test-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order4Id,
          consumerId: targetConsumer.id,
          partnerId: targetPartner.id,
          status: 'AWAITING_PAYMENT',
          totalAmount: 35.0,
        }),
      });
      if (notifyRes.ok) {
        console.log(`  🔔 Notificação SSE transmitida com sucesso para "${targetPartner.name}"!`);
      }
    } catch {
      console.log('  ℹ️  Backend offline na porta local (notificação em tempo real ignorada, os pedidos foram criados no banco).');
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Seed direcionado concluído com sucesso!');
    console.log(`   🏢 Estabelecimento: ${targetPartner.name} (ID: ${targetPartner.id})`);
    console.log(`   👤 Cliente:         ${targetConsumer.email}`);
    console.log('');
    console.log('🚀 Acesse diretamente na VPS (com sua conta já logada):');
    console.log(`   🍳 Gestão de Pedidos do Restaurante: /partner/orders?partnerId=${targetPartner.id}`);
    console.log(`   💰 Extrato & Financeiro do Restaurante: /partner/financial`);
    console.log(`   📦 Meus Pedidos (Visão do Cliente): /orders`);
    console.log('═'.repeat(60) + '\n');
  } catch (err) {
    console.error('❌ Erro no seed direcionado:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
