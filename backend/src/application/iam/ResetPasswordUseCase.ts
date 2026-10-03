// backend/src/application/iam/ResetPasswordUseCase.ts
import bcrypt from 'bcryptjs';

import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IPasswordResetRepository } from '../../domain/iam/repositories/IPasswordResetRepository';
import { PasswordHash } from '../../domain/iam/value-objects/PasswordHash';
import { Email } from '../../domain/iam/value-objects/Email';
import { Result } from '../../domain/Result';

export interface ResetPasswordDTO {
  email: string;
  code: string;
  newPassword: string;
}

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export class ResetPasswordUseCase {
  private static readonly SALT_ROUNDS = 10;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetRepository: IPasswordResetRepository,
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<Result<{ message: string }>> {
    if (!dto.email || dto.email.trim().length === 0) {
      return Result.fail<{ message: string }>('O e-mail é obrigatório.');
    }

    if (!dto.code || dto.code.trim().length !== 6) {
      return Result.fail<{ message: string }>('O código de recuperação deve ter exatamente 6 dígitos.');
    }

    if (!dto.newPassword || !STRONG_PASSWORD_REGEX.test(dto.newPassword)) {
      return Result.fail<{ message: string }>(
        'A nova senha deve ter no mínimo 8 caracteres, contendo ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial.',
      );
    }

    const emailRes = Email.create(dto.email.trim());
    if (emailRes.isFailure) {
      return Result.fail<{ message: string }>(emailRes.getError());
    }

    const user = await this.userRepository.findByEmail(emailRes.getValue().value);
    if (!user) {
      return Result.fail<{ message: string }>('Código de recuperação inválido ou expirado.');
    }

    const reset = await this.passwordResetRepository.findByUserIdAndCode(
      user.id,
      dto.code.trim(),
    );

    if (!reset || reset.isUsed) {
      return Result.fail<{ message: string }>('Código de recuperação inválido ou já utilizado.');
    }

    if (reset.isExpired()) {
      return Result.fail<{ message: string }>(
        'Este código de recuperação expirou. Por favor, solicite um novo código.',
      );
    }

    // Marca o código como utilizado
    reset.markAsUsed();
    await this.passwordResetRepository.save(reset);

    // Gera o novo hash da senha com bcrypt
    const rawHash = await bcrypt.hash(dto.newPassword, ResetPasswordUseCase.SALT_ROUNDS);
    const passwordHashRes = PasswordHash.fromHash(rawHash);
    if (passwordHashRes.isFailure) {
      return Result.fail<{ message: string }>(passwordHashRes.getError());
    }

    // Atualiza a senha no usuário e persiste
    user.changePassword(passwordHashRes.getValue());
    await this.userRepository.save(user);

    return Result.ok<{ message: string }>({
      message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
    });
  }
}
