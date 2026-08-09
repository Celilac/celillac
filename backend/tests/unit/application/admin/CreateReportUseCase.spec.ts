// backend/tests/unit/application/admin/CreateReportUseCase.spec.ts
import { CreateReportUseCase } from '../../../../src/application/admin/CreateReportUseCase';
import { IReportRepository } from '../../../../src/domain/admin/repositories/IReportRepository';
import { ReportReason } from '../../../../src/domain/admin/value-objects/ReportReason';
import { ReportStatus } from '../../../../src/domain/admin/value-objects/ReportStatus';

describe('CreateReportUseCase', () => {
  let useCase: CreateReportUseCase;
  let repoMock: jest.Mocked<IReportRepository>;

  beforeEach(() => {
    repoMock = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new CreateReportUseCase(repoMock);
  });

  it('should create and save a new product report', async () => {
    const result = await useCase.execute({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.INCORRECT_INGREDIENTS,
      details: 'Contains milk but not declared',
    });

    expect(result.isSuccess).toBe(true);
    expect(repoMock.save).toHaveBeenCalledTimes(1);
    
    const value = result.getValue();
    expect(value.status).toBe(ReportStatus.PENDING);
    expect(value.reason).toBe(ReportReason.INCORRECT_INGREDIENTS);
    expect(value.reporterId).toBe('user-1');
    expect(value.productId).toBe('prod-1');
    expect(value.isFoodSafetyRisk).toBe(false);
  });

  it('should create and save a new partner report with food safety risk', async () => {
    const result = await useCase.execute({
      reporterId: 'user-1',
      partnerId: 'partner-1',
      reason: ReportReason.WRONG_CROSS_CONTAMINATION,
      details: 'Contaminação cruzada grave relatada',
    });

    expect(result.isSuccess).toBe(true);
    expect(repoMock.save).toHaveBeenCalledTimes(1);

    const value = result.getValue();
    expect(value.status).toBe(ReportStatus.PENDING);
    expect(value.reason).toBe(ReportReason.WRONG_CROSS_CONTAMINATION);
    expect(value.partnerId).toBe('partner-1');
    expect(value.isFoodSafetyRisk).toBe(true);
  });

  it('should fail with invalid reason', async () => {
    const result = await useCase.execute({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: 'NON_EXISTENT_REASON',
    });

    expect(result.isFailure).toBe(true);
    expect(repoMock.save).not.toHaveBeenCalled();
  });
});
