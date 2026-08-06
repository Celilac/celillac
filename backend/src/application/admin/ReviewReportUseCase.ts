// backend/src/application/admin/ReviewReportUseCase.ts
import { IReportRepository } from '../../domain/admin/repositories/IReportRepository';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { ReportStatus } from '../../domain/admin/value-objects/ReportStatus';
import { Result } from '../../domain/Result';
import { ReportResponseDTO } from './CreateReportUseCase';

export interface ReviewReportDTO {
  reportId:   string;
  newStatus:  string;
  reviewerId?: string;
  reason?:    string;
}

export class ReviewReportUseCase {
  constructor(
    private readonly reportRepository: IReportRepository,
    private readonly auditLogRepository?: IAuditLogRepository,
  ) {}

  async execute(dto: ReviewReportDTO): Promise<Result<ReportResponseDTO>> {
    const report = await this.reportRepository.findById(dto.reportId);
    
    if (!report) {
      return Result.fail<ReportResponseDTO>('Report not found.');
    }

    if (!Object.values(ReportStatus).includes(dto.newStatus as ReportStatus)) {
      return Result.fail<ReportResponseDTO>(`Invalid new status: ${dto.newStatus}`);
    }

    const oldStatus = report.status;

    const changeResult = report.changeStatus(dto.newStatus as ReportStatus);
    if (changeResult.isFailure) {
      return Result.fail<ReportResponseDTO>(changeResult.getError());
    }

    await this.reportRepository.update(report);

    // Auditoria (Issue #39)
    if (this.auditLogRepository) {
      const logResult = AuditLog.create({
        entityType: 'Report',
        entityId:   report.id,
        action:     'STATUS_CHANGE',
        actorId:    dto.reviewerId,
        actorRole:  'ADMIN',
        changes:    {
          oldStatus,
          newStatus:        report.status,
          productId:        report.productId,
          partnerId:        report.partnerId,
          isFoodSafetyRisk: report.isFoodSafetyRisk,
        },
        reason: dto.reason || `Alteração do status da denúncia para ${report.status}`,
      });

      if (logResult.isSuccess) {
        await this.auditLogRepository.save(logResult.getValue());
      }
    }

    return Result.ok<ReportResponseDTO>({
      id:               report.id,
      reporterId:       report.reporterId,
      productId:        report.productId,
      partnerId:        report.partnerId,
      reason:           report.reason,
      isFoodSafetyRisk: report.isFoodSafetyRisk,
      status:           report.status,
      details:          report.details,
      createdAt:        report.createdAt.toISOString(),
      updatedAt:        report.updatedAt.toISOString(),
    });
  }
}
