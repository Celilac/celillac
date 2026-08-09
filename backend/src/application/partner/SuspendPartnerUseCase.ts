// backend/src/application/partner/SuspendPartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface SuspendPartnerDTO {
  partnerId:   string;
  adminUserId: string;
  reason:      string;
}

export class SuspendPartnerUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository: IUserRepository,
    private readonly auditLogRepository?: IAuditLogRepository,
  ) {}

  async execute(dto: SuspendPartnerDTO): Promise<Result<void>> {
    // 1. Validar se o usuário executor é admin
    const adminUser = await this.userRepository.findById(dto.adminUserId);
    if (!adminUser) {
      return Result.fail<void>('Usuário administrador não encontrado.');
    }

    if (adminUser.role !== UserRole.ADMIN) {
      return Result.fail<void>('Acesso negado: Apenas administradores podem suspender parceiros.');
    }

    // 2. Buscar o parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado.');
    }

    const previousStatus = partner.approvalStatus;

    // 3. Executar transição no domínio
    const suspendResult = partner.suspend(dto.reason);
    if (suspendResult.isFailure) {
      return Result.fail<void>(suspendResult.getError());
    }

    // 4. Persistir no banco de dados
    await this.partnerRepository.update(partner);

    // 5. Auditoria (Issue #39)
    if (this.auditLogRepository) {
      const logResult = AuditLog.create({
        entityType: 'Partner',
        entityId:   partner.id,
        action:     'SUSPEND',
        actorId:    dto.adminUserId,
        actorRole:  'ADMIN',
        changes:    {
          previousApprovalStatus: previousStatus,
          newApprovalStatus:      partner.approvalStatus,
          name:                   partner.name,
        },
        reason: dto.reason || 'Suspensão de cadastro de parceiro comercial',
      });

      if (logResult.isSuccess) {
        await this.auditLogRepository.save(logResult.getValue());
      }
    }

    return Result.ok<void>(undefined);
  }
}
