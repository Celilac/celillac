// backend/src/application/iam/SendEmailVerificationCodeUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IEmailVerificationRepository } from '../../domain/iam/repositories/IEmailVerificationRepository';
import { IEmailService } from '../../domain/services/IEmailService';
import { EmailVerification } from '../../domain/iam/EmailVerification';
import { Result } from '../../domain/Result';

export class SendEmailVerificationCodeUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailVerificationRepository: IEmailVerificationRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(userId: string): Promise<Result<void>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail<void>('Usuário não encontrado.');
    }

    if (user.isEmailVerified) {
      return Result.fail<void>('Este endereço de e-mail já está verificado.');
    }

    // Invalida códigos antigos não utilizados do mesmo usuário
    await this.emailVerificationRepository.invalidatePreviousCodes(userId);

    // Gera um novo código OTP de 6 dígitos válido por 15 minutos
    const code = EmailVerification.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const verificationRes = EmailVerification.create({
      userId,
      code,
      expiresAt,
    });

    if (verificationRes.isFailure) {
      return Result.fail<void>(verificationRes.getError());
    }

    const verification = verificationRes.getValue();
    await this.emailVerificationRepository.save(verification);

    // Envia o e-mail via Zoho / EmailService
    await this.emailService.sendVerificationCode(
      user.email.value,
      code,
      user.fullName,
    );

    return Result.ok<void>(undefined as any);
  }
}
