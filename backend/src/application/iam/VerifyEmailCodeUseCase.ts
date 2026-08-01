// backend/src/application/iam/VerifyEmailCodeUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IEmailVerificationRepository } from '../../domain/iam/repositories/IEmailVerificationRepository';
import { Result } from '../../domain/Result';

export interface VerifyEmailCodeInput {
  userId: string;
  code: string;
}

export class VerifyEmailCodeUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailVerificationRepository: IEmailVerificationRepository,
  ) {}

  async execute(input: VerifyEmailCodeInput): Promise<Result<void>> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      return Result.fail<void>('Usuário não encontrado.');
    }

    if (user.isEmailVerified) {
      return Result.ok<void>(undefined as any);
    }

    const verification = await this.emailVerificationRepository.findByUserIdAndCode(
      input.userId,
      input.code.trim(),
    );

    if (!verification) {
      return Result.fail<void>('Código de verificação inválido ou já utilizado.');
    }

    if (verification.isExpired()) {
      return Result.fail<void>('Este código de verificação expirou. Solicite um novo código.');
    }

    // Marca o código como utilizado e atualiza o usuário
    verification.markAsUsed();
    await this.emailVerificationRepository.save(verification);

    user.verifyEmail();
    await this.userRepository.save(user);

    return Result.ok<void>(undefined as any);
  }
}
