// backend/src/infrastructure/database/iam/PgUserRepository.ts
import { Pool } from 'pg';

import { IUserRepository } from '../../../domain/iam/repositories/IUserRepository';
import { User, AccountStatus, ProfileEvaluationStatus } from '../../../domain/iam/User';
import { Email } from '../../../domain/iam/value-objects/Email';
import { PasswordHash } from '../../../domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../domain/iam/value-objects/UserRole';

export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, email, password_hash, role, full_name, birth_date, gender, avatar_url, account_status, profile_evaluation_status
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
      `SELECT id, email, password_hash, role, full_name, birth_date, gender, avatar_url, account_status, profile_evaluation_status
       FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (
        id, email, password_hash, role, full_name, birth_date, gender, avatar_url, account_status, profile_evaluation_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        birth_date = EXCLUDED.birth_date,
        gender = EXCLUDED.gender,
        avatar_url = EXCLUDED.avatar_url,
        account_status = EXCLUDED.account_status,
        profile_evaluation_status = EXCLUDED.profile_evaluation_status`,
      [
        user.id,
        user.email.value,
        user.passwordHash.value,
        user.role,
        user.fullName || null,
        user.birthDate || null,
        user.gender || null,
        user.avatarUrl || null,
        user.accountStatus,
        user.profileEvaluationStatus,
      ],
    );
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
    account_status?: string;
    profile_evaluation_status?: string;
  }): User {
    const email = Email.create(row.email).getValue();
    const passwordHash = PasswordHash.fromHash(row.password_hash).getValue();
    const role = row.role as UserRole;

    return User.create(
      {
        email,
        passwordHash,
        role,
        fullName: row.full_name,
        birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
        gender: row.gender,
        avatarUrl: row.avatar_url,
        accountStatus: (row.account_status as AccountStatus) || 'ACTIVE',
        profileEvaluationStatus: (row.profile_evaluation_status as ProfileEvaluationStatus) || 'PENDING_EVALUATION',
      },
      row.id,
    ).getValue();
  }
}
