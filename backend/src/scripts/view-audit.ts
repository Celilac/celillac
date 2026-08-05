// backend/src/scripts/view-audit.ts
import { pool } from '../infrastructure/database/connection';

async function main() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        entity_type AS "entityType", 
        entity_id AS "entityId", 
        action, 
        actor_role AS "actorRole", 
        changes, 
        reason, 
        created_at AS "createdAt"
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('\n==================================================');
    console.log(` 📜 HISTÓRICO DE AUDITORIA (Total: ${result.rows.length} registros no limite)`);
    console.log('==================================================\n');

    if (result.rows.length === 0) {
      console.log('Nenhum registro de auditoria encontrado ainda.');
      console.log('💡 Dica: Atualize um Perfil Alimentar no Web App ou modere uma Denúncia no Admin para gerar registros automaticamente.\n');
    } else {
      console.log(JSON.stringify(result.rows, null, 2));
    }
  } catch (err: any) {
    console.error('Erro ao consultar audit_logs:', err.message);
  } finally {
    await pool.end();
  }
}

main();
