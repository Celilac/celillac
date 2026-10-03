// backend/src/infrastructure/database/iam/PgPasswordResetRepository.ts
import { Pool } from 'pg';
import { IPasswordResetRepository } from '../../../domain/iam/repositories/IPasswordResetRepository';
import { PasswordReset } from '../../../domain/iam/PasswordReset';

export class PgPasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly pool: Pool) {}

  async save(reset: PasswordReset): Promise<void> {
    await this.pool.query(
      `INSERT INTO password_resets (id, user_id, code, expires_at, is_used, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         is_used = EXCLUDED.is_used`,
      [
        reset.id,
        reset.userId,
        reset.code,
        reset.expiresAt,
        reset.isUsed,
        reset.createdAt,
      ],
    );
  }

  async findLatestPendingByUserId(userId: string): Promise<PasswordReset | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, code, expires_at, is_used, created_at
       FROM password_resets
       WHERE user_id = $1 AND is_used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async findByUserIdAndCode(userId: string, code: string): Promise<PasswordReset | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, code, expires_at, is_used, created_at
       FROM password_resets
       WHERE user_id = $1 AND code = $2 AND is_used = false
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code],
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async invalidatePreviousCodes(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE password_resets SET is_used = true WHERE user_id = $1 AND is_used = false`,
      [userId],
    );
  }

  private mapRowToEntity(row: any): PasswordReset {
    return PasswordReset.create(
      {
        userId: row.user_id,
        code: row.code,
        expiresAt: new Date(row.expires_at),
        isUsed: row.is_used,
        createdAt: new Date(row.created_at),
      },
      row.id,
    ).getValue();
  }
}
