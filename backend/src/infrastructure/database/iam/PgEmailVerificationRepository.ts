// backend/src/infrastructure/database/iam/PgEmailVerificationRepository.ts
import { Pool } from 'pg';
import { IEmailVerificationRepository } from '../../../domain/iam/repositories/IEmailVerificationRepository';
import { EmailVerification } from '../../../domain/iam/EmailVerification';

export class PgEmailVerificationRepository implements IEmailVerificationRepository {
  constructor(private readonly pool: Pool) {}

  async save(verification: EmailVerification): Promise<void> {
    await this.pool.query(
      `INSERT INTO email_verifications (id, user_id, code, expires_at, is_used, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         is_used = EXCLUDED.is_used`,
      [
        verification.id,
        verification.userId,
        verification.code,
        verification.expiresAt,
        verification.isUsed,
        verification.createdAt,
      ],
    );
  }

  async findLatestPendingByUserId(userId: string): Promise<EmailVerification | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, code, expires_at, is_used, created_at
       FROM email_verifications
       WHERE user_id = $1 AND is_used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async findByUserIdAndCode(userId: string, code: string): Promise<EmailVerification | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, code, expires_at, is_used, created_at
       FROM email_verifications
       WHERE user_id = $1 AND code = $2 AND is_used = false
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code],
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async invalidatePreviousCodes(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE email_verifications SET is_used = true WHERE user_id = $1 AND is_used = false`,
      [userId],
    );
  }

  private mapRowToEntity(row: any): EmailVerification {
    return EmailVerification.create(
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
