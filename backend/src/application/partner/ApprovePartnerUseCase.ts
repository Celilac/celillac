// backend/src/application/partner/ApprovePartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface ApprovePartnerDTO {
  partnerId:   string;
  adminUserId: string;
}

export class ApprovePartnerUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository: IUserRepository,
    private readonly auditLogRepository?: IAuditLogRepository,
  ) {}

  async execute(dto: ApprovePartnerDTO): Promise<Result<void>> {
    // 1. Validar se o usuário que aprova é admin
    const adminUser = await this.userRepository.findById(dto.adminUserId);
    if (!adminUser) {
      return Result.fail<void>('Usuário administrador não encontrado.');
    }

    if (adminUser.role !== UserRole.ADMIN) {
      return Result.fail<void>('Acesso negado: Apenas administradores podem aprovar parceiros.');
    }

    // 2. Buscar o parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado.');
    }

    const previousStatus = partner.approvalStatus;

    // 3. Chamar método do domínio
    const approveResult = partner.approve();
    if (approveResult.isFailure) {
      return Result.fail<void>(approveResult.getError());
    }

    await this.partnerRepository.update(partner);

    // Auditoria (Issue #39)
    if (this.auditLogRepository) {
      const logResult = AuditLog.create({
        entityType: 'Partner',
        entityId:   partner.id,
        action:     'APPROVE',
        actorId:    dto.adminUserId,
        actorRole:  'ADMIN',
        changes:    {
          previousApprovalStatus: previousStatus,
          newApprovalStatus:      partner.approvalStatus,
          name:                   partner.name,
        },
        reason: 'Aprovação de cadastro de parceiro comercial',
      });

      if (logResult.isSuccess) {
        await this.auditLogRepository.save(logResult.getValue());
      }
    }

    return Result.ok<void>(undefined);
  }
}
