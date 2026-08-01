// backend/src/infrastructure/database/iam/PgBlacklistTokenRepository.ts
import { Pool } from 'pg';
import { IBlacklistTokenRepository } from '../../../domain/iam/repositories/IBlacklistTokenRepository';

/**
 * PgBlacklistTokenRepository — Implementação de IBlacklistTokenRepository usando pg.
 * Persiste e verifica tokens invalidados na tabela blacklisted_tokens.
 */
export class PgBlacklistTokenRepository implements IBlacklistTokenRepository {
  constructor(private readonly pool: Pool) {}

  async add(token: string, expiresAt: Date): Promise<void> {
    await this.pool.query(
      'INSERT INTO blacklisted_tokens (token, expires_at) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
      [token, expiresAt],
    );
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT token FROM blacklisted_tokens WHERE token = $1 LIMIT 1',
      [token],
    );
    return result.rows.length > 0;
  }
}
