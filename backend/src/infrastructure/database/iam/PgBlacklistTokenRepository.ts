// backend/src/infrastructure/database/iam/PgBlacklistTokenRepository.ts
import { Pool } from 'pg';
import { IBlacklistTokenRepository } from '../../../domain/iam/repositories/IBlacklistTokenRepository';
import { ICacheService, defaultCacheService } from '../../cache/CacheService';

/**
 * PgBlacklistTokenRepository — Implementação de IBlacklistTokenRepository usando pg.
 * Persiste e verifica tokens invalidados com cache em memória resiliente.
 */
export class PgBlacklistTokenRepository implements IBlacklistTokenRepository {
  constructor(
    private readonly pool: Pool,
    private readonly cacheService: ICacheService = defaultCacheService,
  ) {}

  async add(token: string, expiresAt: Date): Promise<void> {
    await this.pool.query(
      'INSERT INTO blacklisted_tokens (token, expires_at) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
      [token, expiresAt],
    );
    const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    await this.cacheService.set(`blacklist:${token}`, true, ttlSeconds);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const cached = await this.cacheService.get<boolean>(`blacklist:${token}`);
    if (cached !== null) {
      return cached;
    }

    const result = await this.pool.query(
      'SELECT token FROM blacklisted_tokens WHERE token = $1 LIMIT 1',
      [token],
    );
    const isRevoked = result.rows.length > 0;
    await this.cacheService.set(`blacklist:${token}`, isRevoked, 120);
    return isRevoked;
  }
}
