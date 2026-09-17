// backend/src/application/admin/certifications/ReviewProductCertificationUseCase.ts
import {
  IProductCertificationRepository,
  AdminCertificationListItem,
} from '../../../domain/catalog/repositories/IProductCertificationRepository';
import { IAuditLogRepository } from '../../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../../domain/audit/AuditLog';
import { Result } from '../../../domain/Result';

export type ReviewCertificationAction = 'APPROVE' | 'REJECT';

export interface ReviewProductCertificationDTO {
  certificationId: string;
  action: ReviewCertificationAction;
  notes?: string;
  adminId: string;
  adminEmail?: string;
}

export class ReviewProductCertificationUseCase {
  constructor(
    private readonly certificationRepository: IProductCertificationRepository,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  async execute(dto: ReviewProductCertificationDTO): Promise<Result<AdminCertificationListItem>> {
    if (!dto.certificationId || dto.certificationId.trim().length === 0) {
      return Result.fail<AdminCertificationListItem>('ID da certificação é obrigatório.');
    }

    if (!dto.action || !['APPROVE', 'REJECT'].includes(dto.action)) {
      return Result.fail<AdminCertificationListItem>('Ação inválida. Utilize APPROVE ou REJECT.');
    }

    if (dto.action === 'REJECT' && (!dto.notes || dto.notes.trim().length === 0)) {
      return Result.fail<AdminCertificationListItem>('Justificativa é obrigatória para rejeitar uma certificação/laudo.');
    }

    const certification = await this.certificationRepository.findById(dto.certificationId);
    if (!certification) {
      return Result.fail<AdminCertificationListItem>('Certificação não encontrada.');
    }

    const oldStatus = certification.verificationStatus;

    if (dto.action === 'APPROVE') {
      certification.markAsVerified(dto.notes);
    } else {
      certification.markAsRejected(dto.notes || 'Rejeitado pela moderação');
    }

    await this.certificationRepository.updateStatus(
      certification.id,
      certification.verificationStatus,
      certification.verificationNotes,
      dto.adminId
    );

    // Registro imutável de auditoria
    if (this.auditLogRepository) {
      try {
        const auditLogResult = AuditLog.create({
          entityType: 'PRODUCT_CERTIFICATION',
          entityId: certification.id,
          action: dto.action === 'APPROVE' ? 'CERTIFICATION_VERIFIED' : 'CERTIFICATION_REJECTED',
          actorId: dto.adminId,
          actorRole: 'ADMIN',
          changes: {
            oldStatus,
            newStatus: certification.verificationStatus,
            certificationType: certification.certificationType,
            certifyingEntity: certification.certifyingEntity,
            notes: certification.verificationNotes,
          },
          reason: dto.notes,
        });

        if (auditLogResult.isSuccess) {
          await this.auditLogRepository.save(auditLogResult.getValue());
        }
      } catch (auditError) {
        console.error('[ReviewProductCertification] Erro ao gravar log de auditoria:', auditError);
      }
    }

    const updatedItem = await this.certificationRepository.findItemDetailsById(certification.id);
    if (!updatedItem) {
      return Result.fail<AdminCertificationListItem>('Erro ao carregar dados atualizados da certificação.');
    }

    return Result.ok<AdminCertificationListItem>(updatedItem);
  }
}
