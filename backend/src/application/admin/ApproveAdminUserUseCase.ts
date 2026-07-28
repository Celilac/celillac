// backend/src/application/admin/ApproveAdminUserUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IEmailService } from '../../domain/services/IEmailService';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface ApproveAdminUserInput {
  adminUserIdToApprove: string;
  approvedByUserId: string;
}

export class ApproveAdminUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(input: ApproveAdminUserInput): Promise<Result<void>> {
    const approver = await this.userRepository.findById(input.approvedByUserId);
    if (!approver || approver.role !== UserRole.ADMIN || approver.accountStatus !== 'ACTIVE') {
      return Result.fail<void>('Somente administradores ativos podem aprovar novas contas administrativas.');
    }

    const userToApprove = await this.userRepository.findById(input.adminUserIdToApprove);
    if (!userToApprove) {
      return Result.fail<void>('Usuário não encontrado.');
    }

    if (userToApprove.role !== UserRole.ADMIN) {
      return Result.fail<void>('O usuário informado não possui a função de Administrador.');
    }

    userToApprove.approveAdminAccount();
    await this.userRepository.save(userToApprove);

    // Dispara e-mail de notificação conforme acordado
    await this.emailService.sendAdminApprovalNotification(
      userToApprove.email.value,
      userToApprove.fullName,
    );

    return Result.ok<void>(undefined as any);
  }
}
