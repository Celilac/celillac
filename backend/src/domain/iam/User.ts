// backend/src/domain/iam/User.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { Email } from './value-objects/Email';
import { PasswordHash } from './value-objects/PasswordHash';
import { UserRole } from './value-objects/UserRole';

/**
 * UserProps — shape das propriedades internas da entidade.
 * Mantidas privadas via Entity<T>.props.
 */
export interface UserProps {
  email:        Email;
  passwordHash: PasswordHash;
  role:         UserRole;
}

/**
 * User — Entidade raiz do contexto IAM.
 * Regras de domínio:
 *  - Nunca expõe senha em plaintext.
 *  - Role deve ser um dos valores definidos em UserRole.
 */
export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  // --- Getters (expõe o estado sem vazar o shape interno de props) ---

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): PasswordHash {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  // --- Factory Method ---

  static create(props: UserProps, id?: string): Result<User> {
    // Regra de domínio: role deve ser válida
    if (!Object.values(UserRole).includes(props.role)) {
      return Result.fail<User>('Role de usuário inválida.');
    }
    return Result.ok<User>(new User(props, id));
  }
}
