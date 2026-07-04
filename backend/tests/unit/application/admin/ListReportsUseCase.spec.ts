// backend/tests/unit/application/admin/ListReportsUseCase.spec.ts
import { ListReportsUseCase } from '../../../../src/application/admin/ListReportsUseCase';
import { IReportRepository } from '../../../../src/domain/admin/repositories/IReportRepository';
import { ReportStatus } from '../../../../src/domain/admin/value-objects/ReportStatus';
import { ReportReason } from '../../../../src/domain/admin/value-objects/ReportReason';
import { Report } from '../../../../src/domain/admin/Report';

describe('ListReportsUseCase', () => {
  let useCase: ListReportsUseCase;
  let repoMock: jest.Mocked<IReportRepository>;

  beforeEach(() => {
    repoMock = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new ListReportsUseCase(repoMock);
  });

  it('should list reports without filters', async () => {
    const report1 = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
    }).getValue();
    
    repoMock.findAll.mockResolvedValue([report1]);

    const result = await useCase.execute({});
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(1);
    expect(repoMock.findAll).toHaveBeenCalledWith(undefined);
  });

  it('should list reports with status filter', async () => {
    repoMock.findAll.mockResolvedValue([]);
    const result = await useCase.execute({ status: ReportStatus.PENDING });
    expect(result.isSuccess).toBe(true);
    expect(repoMock.findAll).toHaveBeenCalledWith({ status: ReportStatus.PENDING });
  });

  it('should fail with invalid status filter', async () => {
    const result = await useCase.execute({ status: 'INVALID_STATUS' });
    expect(result.isFailure).toBe(true);
    expect(repoMock.findAll).not.toHaveBeenCalled();
  });
});
