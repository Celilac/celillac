// backend/src/infrastructure/database/connection.ts
import { Pool } from 'pg';

/**
 * Singleton de conexão com o PostgreSQL.
 * Variáveis carregadas do .env via dotenv (inicializado em index.ts).
 * Credenciais do docker-compose.yml (DATABASE.md).
 */
export const pool = new Pool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME     ?? 'celilac_db',
  user:     process.env.DB_USER     ?? 'celilac_user',
  password: process.env.DB_PASSWORD ?? 'celilac_password',
});

/**
 * Testa a conexão com o banco ao inicializar.
 * Lança erro claro se o Docker não estiver rodando.
 */
export async function testDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  client.release();
  console.log('[Database]: Conexão com PostgreSQL estabelecida com sucesso.');
}
