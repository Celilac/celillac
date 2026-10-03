// backend/src/application/admin/ReviewReportUseCase.ts
import { IReportRepository } from '../../domain/admin/repositories/IReportRepository';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
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
    private readonly consumerRepository?: IConsumerRepository,
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

    // Auditoria de consumidor denunciado por não pagamento / ocorrência na entrega
    let consumerCodStatusChanged = false;
    if (report.targetUserId && this.consumerRepository) {
      const consumer = await this.consumerRepository.findByUserId(report.targetUserId);
      if (consumer) {
        if (dto.newStatus === ReportStatus.RESOLVED) {
          // ADMIN aceitou a denúncia após avaliar as circunstâncias: bloqueia o consumidor para pagamento na entrega
          const auditReason = dto.reason
            ? `Denúncia confirmada após auditoria administrativa: ${dto.reason}`
            : 'Denúncia de não pagamento aceita após averiguação administrativa da declaração da loja.';
          consumer.revokePayOnDelivery(auditReason);
          await this.consumerRepository.save(consumer);
          consumerCodStatusChanged = true;
        } else if (dto.newStatus === ReportStatus.DISMISSED && !consumer.canPayOnDelivery) {
          // ADMIN descartou a denúncia como improcedente: restaura elegibilidade de pagamento na entrega
          consumer.restorePayOnDelivery();
          await this.consumerRepository.save(consumer);
          consumerCodStatusChanged = true;
        }
      }
    }

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
          targetUserId:     report.targetUserId,
          orderId:          report.orderId,
          consumerCodStatusChanged,
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
      targetUserId:     report.targetUserId,
      orderId:          report.orderId,
      reason:           report.reason,
      isFoodSafetyRisk: report.isFoodSafetyRisk,
      status:           report.status,
      details:          report.details,
      createdAt:        report.createdAt.toISOString(),
      updatedAt:        report.updatedAt.toISOString(),
    });
  }
}
