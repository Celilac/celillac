// backend/src/application/iam/RequestPasswordResetUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IPasswordResetRepository } from '../../domain/iam/repositories/IPasswordResetRepository';
import { IEmailService } from '../../domain/services/IEmailService';
import { PasswordReset } from '../../domain/iam/PasswordReset';
import { Email } from '../../domain/iam/value-objects/Email';
import { Result } from '../../domain/Result';

export interface RequestPasswordResetDTO {
  email: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(dto: RequestPasswordResetDTO): Promise<Result<{ message: string }>> {
    const defaultSuccessMessage =
      'Se o endereço de e-mail estiver cadastrado em nossa plataforma, você receberá em instantes um código para redefinir sua senha.';

    if (!dto.email || dto.email.trim().length === 0) {
      return Result.fail<{ message: string }>('Por favor, informe seu e-mail.');
    }

    const emailRes = Email.create(dto.email.trim());
    if (emailRes.isFailure) {
      return Result.fail<{ message: string }>(emailRes.getError());
    }

    const normalizedEmail = emailRes.getValue().value;
    const user = await this.userRepository.findByEmail(normalizedEmail);

    // Proteção contra enumeração de usuários (OWASP):
    // Se o usuário não existir, retorna a mensagem genérica com sucesso sem disparar e-mail.
    if (!user) {
      console.log(`[RequestPasswordResetUseCase]: E-mail ${normalizedEmail} não encontrado. Retorno neutro anti-enumeração.`);
      return Result.ok<{ message: string }>({ message: defaultSuccessMessage });
    }

    // Invalida códigos de recuperação anteriores pendentes
    await this.passwordResetRepository.invalidatePreviousCodes(user.id);

    // Gera novo código OTP de 6 dígitos válido por 15 minutos
    const code = PasswordReset.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const resetRes = PasswordReset.create({
      userId: user.id,
      code,
      expiresAt,
    });

    if (resetRes.isFailure) {
      return Result.fail<{ message: string }>(resetRes.getError());
    }

    await this.passwordResetRepository.save(resetRes.getValue());

    // Dispara o e-mail transacional
    await this.emailService.sendPasswordResetCode(
      user.email.value,
      code,
      user.fullName,
    );

    return Result.ok<{ message: string }>({ message: defaultSuccessMessage });
  }
}
