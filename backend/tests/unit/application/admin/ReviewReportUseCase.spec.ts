// backend/tests/unit/application/admin/ReviewReportUseCase.spec.ts
import { ReviewReportUseCase } from '../../../../src/application/admin/ReviewReportUseCase';
import { IReportRepository } from '../../../../src/domain/admin/repositories/IReportRepository';
import { ReportStatus } from '../../../../src/domain/admin/value-objects/ReportStatus';
import { ReportReason } from '../../../../src/domain/admin/value-objects/ReportReason';
import { Report } from '../../../../src/domain/admin/Report';

describe('ReviewReportUseCase', () => {
  let useCase: ReviewReportUseCase;
  let repoMock: jest.Mocked<IReportRepository>;

  beforeEach(() => {
    repoMock = {
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new ReviewReportUseCase(repoMock);
  });

  it('should review and change status of a report', async () => {
    const report = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
      status: ReportStatus.PENDING,
    }, 'report-1').getValue();
    
    repoMock.findById.mockResolvedValue(report);

    const result = await useCase.execute({
      reportId: 'report-1',
      newStatus: ReportStatus.IN_REVIEW,
    });

    expect(result.isSuccess).toBe(true);
    expect(repoMock.update).toHaveBeenCalledTimes(1);
    expect(result.getValue().status).toBe(ReportStatus.IN_REVIEW);
  });

  it('should reopen a resolved or dismissed report to PENDING or IN_REVIEW', async () => {
    const report = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.MISSING_ALLERGEN,
      status: ReportStatus.RESOLVED,
    }, 'report-closed').getValue();
    
    repoMock.findById.mockResolvedValue(report);

    const result = await useCase.execute({
      reportId: 'report-closed',
      newStatus: ReportStatus.PENDING,
      reason: 'Novas evidências apresentadas pelo consumidor',
    });

    expect(result.isSuccess).toBe(true);
    expect(repoMock.update).toHaveBeenCalledTimes(1);
    expect(result.getValue().status).toBe(ReportStatus.PENDING);
  });

  it('should fail if report is not found', async () => {
    repoMock.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      reportId: 'invalid-id',
      newStatus: ReportStatus.IN_REVIEW,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Report not found.');
    expect(repoMock.update).not.toHaveBeenCalled();
  });

  it('should fail on invalid status', async () => {
    const report = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
      status: ReportStatus.PENDING,
    }, 'report-1').getValue();
    
    repoMock.findById.mockResolvedValue(report);

    const result = await useCase.execute({
      reportId: 'report-1',
      newStatus: 'INVALID_STATUS',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Invalid new status');
  });
});
