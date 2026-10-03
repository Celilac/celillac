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

  it('deve revogar canPayOnDelivery do consumidor ao resolver denúncia (RESOLVED) com targetUserId', async () => {
    const report = Report.create({
      reporterId: 'partner-user-1',
      partnerId: 'partner-1',
      targetUserId: 'consumer-user-1',
      orderId: 'order-1',
      reason: ReportReason.CLIENT_REFUSED_PAYMENT,
      details: 'Cliente recusou pagar na entrega',
      status: ReportStatus.PENDING,
    }, 'report-non-payment').getValue();

    repoMock.findById.mockResolvedValue(report);

    const mockConsumer = {
      id: 'consumer-1',
      userId: 'consumer-user-1',
      canPayOnDelivery: true,
      revokePayOnDelivery: jest.fn(function(this: any) { this.canPayOnDelivery = false; }),
      restorePayOnDelivery: jest.fn(function(this: any) { this.canPayOnDelivery = true; }),
    };

    const consumerRepoMock: any = {
      findByUserId: jest.fn().mockResolvedValue(mockConsumer),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const auditLogRepoMock: any = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    const useCaseWithConsumer = new ReviewReportUseCase(repoMock, auditLogRepoMock, consumerRepoMock);

    const result = await useCaseWithConsumer.execute({
      reportId: 'report-non-payment',
      newStatus: ReportStatus.RESOLVED,
      reviewerId: 'admin-1',
      reason: 'Averiguação realizada: loja apresentou comprovante da tentativa frustrada.',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockConsumer.revokePayOnDelivery).toHaveBeenCalledTimes(1);
    expect(mockConsumer.canPayOnDelivery).toBe(false);
    expect(consumerRepoMock.save).toHaveBeenCalledWith(mockConsumer);
    expect(auditLogRepoMock.save).toHaveBeenCalled();
  });

  it('deve restaurar canPayOnDelivery do consumidor ao descartar denúncia (DISMISSED) improcedente', async () => {
    const report = Report.create({
      reporterId: 'partner-user-1',
      partnerId: 'partner-1',
      targetUserId: 'consumer-user-2',
      orderId: 'order-2',
      reason: ReportReason.CLIENT_ABSENT,
      details: 'Cliente ausente',
      status: ReportStatus.PENDING,
    }, 'report-absent').getValue();

    repoMock.findById.mockResolvedValue(report);

    const mockConsumer = {
      id: 'consumer-2',
      userId: 'consumer-user-2',
      canPayOnDelivery: false,
      revokePayOnDelivery: jest.fn(),
      restorePayOnDelivery: jest.fn(function(this: any) { this.canPayOnDelivery = true; }),
    };

    const consumerRepoMock: any = {
      findByUserId: jest.fn().mockResolvedValue(mockConsumer),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const useCaseWithConsumer = new ReviewReportUseCase(repoMock, undefined, consumerRepoMock);

    const result = await useCaseWithConsumer.execute({
      reportId: 'report-absent',
      newStatus: ReportStatus.DISMISSED,
      reviewerId: 'admin-1',
      reason: 'Denúncia improcedente: entregador compareceu em endereço divergente.',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockConsumer.restorePayOnDelivery).toHaveBeenCalledTimes(1);
    expect(mockConsumer.canPayOnDelivery).toBe(true);
    expect(consumerRepoMock.save).toHaveBeenCalledWith(mockConsumer);
  });
});

