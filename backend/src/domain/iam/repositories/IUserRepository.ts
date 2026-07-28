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
   * Persiste um usuário (criação ou atualização).
   */
  save(user: User): Promise<void>;

  /**
   * Busca um usuário pelo ID.
   * @returns User se encontrado, null caso contrário.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Retorna todos os usuários cadastrados na plataforma.
   */
  findAll(): Promise<User[]>;
}
