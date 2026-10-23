// backend/src/infrastructure/database/iam/PgUserRepository.ts
import { Pool } from 'pg';

import { IUserRepository } from '../../../domain/iam/repositories/IUserRepository';
import { User, AccountStatus, ProfileEvaluationStatus } from '../../../domain/iam/User';
import { Email } from '../../../domain/iam/value-objects/Email';
import { PasswordHash } from '../../../domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../domain/iam/value-objects/UserRole';
import { WhatsappPhone } from '../../../domain/iam/value-objects/WhatsappPhone';

/**
 * PgUserRepository — Implementação concreta de IUserRepository usando pg.
 * Mapeia linhas do banco para entidades do domínio e vice-versa.
 * A camada de domínio NUNCA importa esta classe diretamente.
 */
export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) { }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, email, password_hash, role, full_name, birth_date, gender, avatar_url, whatsapp_phone, account_status, profile_evaluation_status, is_email_verified, terms_accepted_at, terms_version
       FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, email, password_hash, role, full_name, birth_date, gender, avatar_url, whatsapp_phone, account_status, profile_evaluation_status, is_email_verified, terms_accepted_at, terms_version
       FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async findAll(): Promise<User[]> {
    const result = await this.pool.query(
      `SELECT id, email, password_hash, role, full_name, birth_date, gender, avatar_url, whatsapp_phone, account_status, profile_evaluation_status, is_email_verified, terms_accepted_at, terms_version
       FROM users ORDER BY created_at DESC`,
    );

    return result.rows.map((row) => this.mapRowToUser(row));
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (
        id, email, password_hash, role, full_name, birth_date, gender, avatar_url, whatsapp_phone, account_status, profile_evaluation_status, is_email_verified, terms_accepted_at, terms_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        birth_date = EXCLUDED.birth_date,
        gender = EXCLUDED.gender,
        avatar_url = EXCLUDED.avatar_url,
        whatsapp_phone = EXCLUDED.whatsapp_phone,
        account_status = EXCLUDED.account_status,
        profile_evaluation_status = EXCLUDED.profile_evaluation_status,
        is_email_verified = EXCLUDED.is_email_verified,
        terms_accepted_at = COALESCE(users.terms_accepted_at, EXCLUDED.terms_accepted_at),
        terms_version = COALESCE(users.terms_version, EXCLUDED.terms_version)`,
      [
        user.id,
        user.email.value,
        user.passwordHash.value,
        user.role,
        user.fullName || null,
        user.birthDate || null,
        user.gender || null,
        user.avatarUrl || null,
        user.whatsappPhone?.value || null,
        user.accountStatus,
        user.profileEvaluationStatus,
        user.isEmailVerified,
        user.termsAcceptedAt || null,
        user.termsVersion || '1.0',
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  private mapRowToUser(row: {
    id: string;
    email: string;
    password_hash: string;
    role: string;
    full_name?: string;
    birth_date?: Date;
    gender?: string;
    avatar_url?: string;
    whatsapp_phone?: string;
    account_status?: string;
    profile_evaluation_status?: string;
    is_email_verified?: boolean;
    terms_accepted_at?: Date | string;
    terms_version?: string;
  }): User {
    const email = Email.create(row.email).getValue();
    const passwordHash = PasswordHash.fromHash(row.password_hash).getValue();
    const role = row.role as UserRole;
    const whatsappPhone = WhatsappPhone.create(row.whatsapp_phone).getValue();

    return User.create(
      {
        email,
        passwordHash,
        role,
        fullName: row.full_name,
        birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
        gender: row.gender,
        avatarUrl: row.avatar_url,
        whatsappPhone,
        accountStatus: (row.account_status as AccountStatus) || 'ACTIVE',
        profileEvaluationStatus: (row.profile_evaluation_status as ProfileEvaluationStatus) || 'PENDING_EVALUATION',
        isEmailVerified: !!row.is_email_verified,
        termsAcceptedAt: row.terms_accepted_at ? new Date(row.terms_accepted_at) : undefined,
        termsVersion: row.terms_version || undefined,
      },
      row.id,
    ).getValue();
  }
}
