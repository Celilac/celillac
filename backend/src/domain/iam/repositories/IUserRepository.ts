// backend/src/domain/iam/repositories/IUserRepository.ts
import { User } from '../User';

/**
 * IUserRepository — Interface pura do domínio.
 * A infraestrutura (PostgreSQL) implementa esta interface.
 * O domínio NUNCA importa nada da infraestrutura — Dependency Rule.
 */
export interface IUserRepository {
  /**
   * Busca um usuário pelo e-mail.
   * @returns User se encontrado, null caso contrário.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Persiste um novo usuário.
   */
  save(user: User): Promise<void>;

  /**
   * Busca um usuário pelo ID.
   */
  findById(id: string): Promise<User | null>;
}
