// backend/src/application/admin/ListReportsUseCase.ts
import { IReportRepository } from '../../domain/admin/repositories/IReportRepository';
import { Result } from '../../domain/Result';
import { ReportStatus } from '../../domain/admin/value-objects/ReportStatus';
import { ReportResponseDTO } from './CreateReportUseCase';

export interface ListReportsDTO {
  status?: string;
}

export class ListReportsUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(dto: ListReportsDTO): Promise<Result<ReportResponseDTO[]>> {
    let statusFilter: ReportStatus | undefined;
    if (dto.status) {
      if (!Object.values(ReportStatus).includes(dto.status as ReportStatus)) {
        return Result.fail<ReportResponseDTO[]>(`Invalid status filter: ${dto.status}`);
      }
      statusFilter = dto.status as ReportStatus;
    }

    const reports = await this.reportRepository.findAll(statusFilter ? { status: statusFilter } : undefined);

    const reportDTOs = reports.map(report => ({
      id: report.id,
      reporterId: report.reporterId,
      productId: report.productId,
      reason: report.reason,
      status: report.status,
      details: report.details,
      createdAt: report.createdAt.toISOString(),
    }));

    return Result.ok<ReportResponseDTO[]>(reportDTOs);
  }
}
