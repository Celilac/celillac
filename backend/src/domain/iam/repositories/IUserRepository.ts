// backend/src/domain/iam/repositories/IUserRepository.ts
import { User } from '../User';

/**
 * IUserRepository — Interface pura do domínio.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}
