// backend/src/application/iam/LoginUserUseCase.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface LoginUserResponseDTO {
  token: string;
  expiresIn: string;
}

/**
 * LoginUserUseCase — Orquestra a autenticação de um usuário existente.
 *
 * Fluxo:
 *  1. Busca usuário por e-mail
 *  2. Compara senha com bcrypt
 *  3. Verifica se conta de Admin aguarda aprovação prévia
 *  4. Gera JWT assinado com JWT_SECRET do environment
 */
export class LoginUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: LoginUserDTO): Promise<Result<LoginUserResponseDTO>> {
    // 1. Buscar usuário
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      return Result.fail<LoginUserResponseDTO>('Credenciais inválidas.');
    }

    // 2. Comparar senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash.value);
    if (!isPasswordValid) {
      return Result.fail<LoginUserResponseDTO>('Credenciais inválidas.');
    }

    // 3. Regra de Segurança: Admin pendente de autorização não pode fazer login
    if (user.isPendingAdminApproval()) {
      return Result.fail<LoginUserResponseDTO>(
        'Sua conta de Administrador aguarda aprovação prévia de um administrador existente.',
      );
    }

    // 4. Gerar JWT
    const secret = process.env.JWT_SECRET as string;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      secret,
      { expiresIn } as jwt.SignOptions,
    );

    return Result.ok<LoginUserResponseDTO>({ token, expiresIn });
  }
}
