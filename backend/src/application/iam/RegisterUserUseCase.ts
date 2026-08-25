// backend/src/application/iam/RegisterUserUseCase.ts
import bcrypt from 'bcryptjs';

import { Email } from '../../domain/iam/value-objects/Email';
import { PasswordHash } from '../../domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../domain/iam/value-objects/UserRole';
import { User, AccountStatus } from '../../domain/iam/User';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IEmailService } from '../../domain/services/IEmailService';
import { SendEmailVerificationCodeUseCase } from './SendEmailVerificationCodeUseCase';
import { Result } from '../../domain/Result';

export interface RegisterUserDTO {
  email: string;
  password: string;
  role: UserRole;
  fullName?: string;
}

export interface RegisterUserResponseDTO {
  id: string;
  email: string;
  role: string;
  accountStatus: string;
  isEmailVerified: boolean;
  message?: string;
}

/**
 * RegisterUserUseCase — Orquestra o cadastro de um novo usuário.
 *
 * Fluxo:
 *  1. Valida o e-mail via Email VO
 *  2. Verifica duplicidade no repositório
 *  3. Gera hash da senha com bcrypt
 *  4. Regra de Primeiro Admin (Bootstrap): Se for o primeiro ADMIN real da plataforma, é aprovado automaticamente.
 *  5. Cria a entidade User
 *  6. Persiste via IUserRepository
 *  7. Se não for Admin pendente, dispara a geração do código OTP de verificação de e-mail
 *  8. Dispara notificação por e-mail aos administradores (Zoho Mail / Central)
 */
export class RegisterUserUseCase {
  private static readonly SALT_ROUNDS = 10;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sendVerificationUseCase?: SendEmailVerificationCodeUseCase,
    private readonly emailService?: IEmailService,
  ) { }

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

    // 3. Hash da senha
    const rawHash = await bcrypt.hash(dto.password, RegisterUserUseCase.SALT_ROUNDS);
    const passwordHashResult = PasswordHash.fromHash(rawHash);
    if (passwordHashResult.isFailure) {
      return Result.fail<RegisterUserResponseDTO>(passwordHashResult.getError());
    }

    // 4. Determinar status da conta e regra de Bootstrap do Primeiro Admin
    const isAdmin = dto.role === UserRole.ADMIN;
    let accountStatus: AccountStatus = 'ACTIVE';

    if (isAdmin) {
      const allUsers = await this.userRepository.findAll();
      const realActiveAdmins = allUsers.filter(
        (u) => u.role === UserRole.ADMIN && u.accountStatus === 'ACTIVE' && u.email.value !== 'admin@celilac.com.br',
      );

      // Se já existe ao menos 1 admin real ativo no sistema, exige aprovação prévia.
      // Se for o PRIMEIRO admin real da plataforma (bootstrap), é aprovado automaticamente!
      accountStatus = realActiveAdmins.length > 0 ? 'PENDING_APPROVAL' : 'ACTIVE';
    }

    // 5. Criar entidade User
    const userResult = User.create({
      email,
      passwordHash: passwordHashResult.getValue(),
      role: dto.role,
      fullName: dto.fullName,
      accountStatus,
      profileEvaluationStatus: 'PENDING_EVALUATION',
      isEmailVerified: false,
    });

    if (userResult.isFailure) {
      return Result.fail<RegisterUserResponseDTO>(userResult.getError());
    }
    const user = userResult.getValue();

    // 6. Persistir
    await this.userRepository.save(user);

    // 7. Enviar código de verificação por e-mail (se não for admin pendente)
    const isPendingAdmin = user.role === UserRole.ADMIN && user.accountStatus === 'PENDING_APPROVAL';
    if (!isPendingAdmin && this.sendVerificationUseCase) {
      try {
        await this.sendVerificationUseCase.execute(user.id);
      } catch (err) {
        console.error('[RegisterUserUseCase]: Erro ao enviar código de verificação:', err);
      }
    }

    // 8. Disparar notificação por e-mail aos administradores (Zoho Mail / Central) de forma assíncrona
    if (this.emailService) {
      this.notifyAdminsOfNewUser(user).catch((err) => {
        console.error('[RegisterUserUseCase]: Erro ao disparar notificações para administradores:', err);
      });
    }

    return Result.ok<RegisterUserResponseDTO>({
      id: user.id,
      email: user.email.value,
      role: user.role,
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified,
      message: isPendingAdmin
        ? 'Conta de Administrador cadastrada com sucesso! Ela aguarda aprovação de um administrador existente para que você possa fazer login.'
        : undefined,
    });
  }

  private async notifyAdminsOfNewUser(user: User): Promise<void> {
    if (!this.emailService) return;

    try {
      const recipientEmails = new Set<string>();

      // E-mail central de notificação para administradores (padrão: celilac@zohomail.com)
      const targetEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || 'celilac@zohomail.com').trim().toLowerCase();
      if (targetEmail && targetEmail.includes('@')) {
        recipientEmails.add(targetEmail);
      }

      // Disparo assíncrono para o e-mail central
      const notificationPromises = Array.from(recipientEmails).map((adminEmail) =>
        this.emailService!.sendNewUserRegisteredAdminNotification(adminEmail, {
          fullName: user.fullName,
          email: user.email.value,
          role: user.role,
          registeredAt: new Date(),
        }),
      );

      await Promise.all(notificationPromises);
      console.log(`[RegisterUserUseCase]: 🔔 Notificação de novo usuário enviada para administradores: [ ${Array.from(recipientEmails).join(', ')} ]`);
    } catch (err) {
      console.error('[RegisterUserUseCase]: Falha ao processar envio de notificações para administradores:', err);
    }
  }
}
