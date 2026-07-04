// backend/src/application/admin/ReviewReportUseCase.ts
import { IReportRepository } from '../../domain/admin/repositories/IReportRepository';
import { ReportStatus } from '../../domain/admin/value-objects/ReportStatus';
import { Result } from '../../domain/Result';
import { ReportResponseDTO } from './CreateReportUseCase';

export interface ReviewReportDTO {
  reportId: string;
  newStatus: string;
}

export class ReviewReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(dto: ReviewReportDTO): Promise<Result<ReportResponseDTO>> {
    const report = await this.reportRepository.findById(dto.reportId);
    
    if (!report) {
      return Result.fail<ReportResponseDTO>('Report not found.');
    }

    if (!Object.values(ReportStatus).includes(dto.newStatus as ReportStatus)) {
      return Result.fail<ReportResponseDTO>(`Invalid new status: ${dto.newStatus}`);
    }

    const changeResult = report.changeStatus(dto.newStatus as ReportStatus);
    if (changeResult.isFailure) {
      return Result.fail<ReportResponseDTO>(changeResult.getError());
    }

    await this.reportRepository.update(report);

    return Result.ok<ReportResponseDTO>({
      id: report.id,
      reporterId: report.reporterId,
      productId: report.productId,
      reason: report.reason,
      status: report.status,
      details: report.details,
      createdAt: report.createdAt.toISOString(),
    });
  }
}
