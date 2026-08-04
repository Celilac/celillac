// backend/src/application/admin/CreateReportUseCase.ts
import { IReportRepository } from '../../domain/admin/repositories/IReportRepository';
import { Report } from '../../domain/admin/Report';
import { ReportReason } from '../../domain/admin/value-objects/ReportReason';
import { Result } from '../../domain/Result';

export interface CreateReportDTO {
  reporterId: string;
  productId?: string;
  partnerId?: string;
  reason: string;
  details?: string;
  isFoodSafetyRisk?: boolean;
}

export interface ReportResponseDTO {
  id: string;
  reporterId: string;
  productId?: string;
  partnerId?: string;
  reason: string;
  isFoodSafetyRisk: boolean;
  status: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export class CreateReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(dto: CreateReportDTO): Promise<Result<ReportResponseDTO>> {
    const reportResult = Report.create({
      reporterId: dto.reporterId,
      productId: dto.productId,
      partnerId: dto.partnerId,
      reason: dto.reason as ReportReason,
      details: dto.details,
      isFoodSafetyRisk: dto.isFoodSafetyRisk,
    });

    if (reportResult.isFailure) {
      return Result.fail<ReportResponseDTO>(reportResult.getError());
    }

    const report = reportResult.getValue();
    await this.reportRepository.save(report);

    return Result.ok<ReportResponseDTO>({
      id: report.id,
      reporterId: report.reporterId,
      productId: report.productId,
      partnerId: report.partnerId,
      reason: report.reason,
      isFoodSafetyRisk: report.isFoodSafetyRisk,
      status: report.status,
      details: report.details,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    });
  }
}
