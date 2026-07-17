// backend/src/infrastructure/database/iam/PgUserRepository.ts
import { Pool } from 'pg';

import { IUserRepository } from '../../../domain/iam/repositories/IUserRepository';
import { User } from '../../../domain/iam/User';
import { Email } from '../../../domain/iam/value-objects/Email';
import { PasswordHash } from '../../../domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../domain/iam/value-objects/UserRole';

/**
 * PgUserRepository — Implementação concreta de IUserRepository usando pg.
 * Mapeia linhas do banco para entidades do domínio e vice-versa.
 * A camada de domínio NUNCA importa esta classe diretamente.
 */
export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1 LIMIT 1',
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [user.id, user.email.value, user.passwordHash.value, user.role],
    );
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE id = $1 LIMIT 1',
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  // --- Mapper privado: linha do banco → entidade de domínio ---
  private mapRowToUser(row: { id: string; email: string; password_hash: string; role: string }): User {
    const email        = Email.create(row.email).getValue();
    const passwordHash = PasswordHash.fromHash(row.password_hash).getValue();
    const role         = row.role as UserRole;

    return User.create({ email, passwordHash, role }, row.id).getValue();
  }
}
