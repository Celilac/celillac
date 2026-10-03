// backend/src/application/admin/ReviewCategoryUseCase.ts
import { ICategoryRepository } from '../../domain/catalog/repositories/ICategoryRepository';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { CategoryResponseDTO } from '../catalog/CreateCategoryUseCase';
import { Result } from '../../domain/Result';

export type ReviewCategoryAction = 'APPROVE_GLOBAL' | 'APPROVE_RESTRICTED' | 'REJECT';

export interface ReviewCategoryDTO {
  categoryId: string;
  action: ReviewCategoryAction;
  rejectionReason?: string;
  adminId: string;
}

export class ReviewCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  async execute(dto: ReviewCategoryDTO): Promise<Result<CategoryResponseDTO>> {
    if (!dto.categoryId || dto.categoryId.trim().length === 0) {
      return Result.fail<CategoryResponseDTO>('ID da categoria é obrigatório.');
    }

    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) {
      return Result.fail<CategoryResponseDTO>('Categoria não encontrada.');
    }

    const oldStatus = category.status;
    const oldVisibility = category.visibility;

    if (dto.action === 'APPROVE_GLOBAL') {
      category.approveAsGlobal();
    } else if (dto.action === 'APPROVE_RESTRICTED') {
      category.approveAsRestricted();
    } else if (dto.action === 'REJECT') {
      const rejectResult = category.reject(dto.rejectionReason || '');
      if (rejectResult.isFailure) {
        return Result.fail<CategoryResponseDTO>(rejectResult.getError());
      }
    } else {
      return Result.fail<CategoryResponseDTO>('Ação de revisão inválida.');
    }

    await this.categoryRepository.update(category);

    // Registra log de auditoria
    if (this.auditLogRepository) {
      try {
        const auditLogResult = AuditLog.create({
          entityType: 'CATEGORY',
          entityId: category.id,
          action: dto.action,
          actorId: dto.adminId,
          actorRole: 'ADMIN',
          changes: {
            oldStatus,
            newStatus: category.status,
            oldVisibility,
            newVisibility: category.visibility,
            rejectionReason: category.rejectionReason,
          },
          reason: dto.rejectionReason,
        });

        if (auditLogResult.isSuccess) {
          await this.auditLogRepository.save(auditLogResult.getValue());
        }
      } catch (err) {
        console.error('[AuditLog] Erro ao gravar log de auditoria de categoria:', err);
      }
    }

    return Result.ok<CategoryResponseDTO>({
      id: category.id,
      name: category.name,
      normalizedName: category.normalizedName,
      partnerId: category.partnerId,
      status: category.status,
      visibility: category.visibility,
      rejectionReason: category.rejectionReason,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    });
  }
}
