// backend/src/application/iam/RegisterUserUseCase.ts
import bcrypt from 'bcryptjs';

import { Email } from '../../domain/iam/value-objects/Email';
import { PasswordHash } from '../../domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../domain/iam/value-objects/UserRole';
import { User } from '../../domain/iam/User';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';

export interface RegisterUserDTO {
  email:    string;
  password: string;
  role:     UserRole;
}

export interface RegisterUserResponseDTO {
  id:    string;
  email: string;
  role:  string;
}

/**
 * RegisterUserUseCase — Orquestra o cadastro de um novo usuário.
 *
 * Fluxo:
 *  1. Valida o e-mail via Email VO
 *  2. Verifica duplicidade no repositório
 *  3. Gera hash da senha com bcrypt
 *  4. Cria a entidade User
 *  5. Persiste via IUserRepository
 */
export class RegisterUserUseCase {
  private static readonly SALT_ROUNDS = 10;

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: RegisterUserDTO): Promise<Result<RegisterUserResponseDTO>> {
    // 1. Validar e-mail
    const emailResult = Email.create(dto.email);
    if (emailResult.isFailure) {
      return Result.fail<RegisterUserResponseDTO>(emailResult.getError());
    }
    const email = emailResult.getValue();

    // 2. Verificar duplicidade
    const existingUser = await this.userRepository.findByEmail(email.value);
    if (existingUser) {
      return Result.fail<RegisterUserResponseDTO>('Este e-mail já está em uso.');
    }

    // 3. Hash da senha (bcryptjs — única dependência externa da Application)
    const rawHash           = await bcrypt.hash(dto.password, RegisterUserUseCase.SALT_ROUNDS);
    const passwordHashResult = PasswordHash.fromHash(rawHash);
    if (passwordHashResult.isFailure) {
      return Result.fail<RegisterUserResponseDTO>(passwordHashResult.getError());
    }

    // 4. Criar entidade User
    const userResult = User.create({
      email,
      passwordHash: passwordHashResult.getValue(),
      role:         dto.role,
    });
    if (userResult.isFailure) {
      return Result.fail<RegisterUserResponseDTO>(userResult.getError());
    }
    const user = userResult.getValue();

    // 5. Persistir
    await this.userRepository.save(user);

    return Result.ok<RegisterUserResponseDTO>({
      id:    user.id,
      email: user.email.value,
      role:  user.role,
    });
  }
}
