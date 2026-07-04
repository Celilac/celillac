// backend/src/domain/admin/repositories/IReportRepository.ts
import { Report } from '../Report';
import { ReportStatus } from '../value-objects/ReportStatus';

export interface IReportRepository {
  save(report: Report): Promise<void>;
  update(report: Report): Promise<void>;
  findById(id: string): Promise<Report | null>;
  findAll(filters?: { status?: ReportStatus }): Promise<Report[]>;
}
