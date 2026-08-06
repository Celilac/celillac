// backend/tests/unit/interfaces/http/controllers/admin/CreateReportController.spec.ts
import { Request, Response } from 'express';
import { CreateReportController } from '../../../../../../src/interfaces/http/controllers/admin/CreateReportController';
import { CreateReportUseCase } from '../../../../../../src/application/admin/CreateReportUseCase';
import { Result } from '../../../../../../src/domain/Result';
import { ReportReason } from '../../../../../../src/domain/admin/value-objects/ReportReason';
import { ReportStatus } from '../../../../../../src/domain/admin/value-objects/ReportStatus';

describe('CreateReportController', () => {
  let controller: CreateReportController;
  let useCaseMock: jest.Mocked<CreateReportUseCase>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    useCaseMock = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateReportUseCase>;

    controller = new CreateReportController(useCaseMock);

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('should create product report successfully and return 201', async () => {
    req = {
      body: {
        productId: 'prod-123',
        reason: ReportReason.INCORRECT_INGREDIENTS,
        details: 'Ingredientes incorretos',
      },
      user: { id: 'user-1' } as any,
    };

    useCaseMock.execute.mockResolvedValue(
      Result.ok({
        id: 'report-1',
        reporterId: 'user-1',
        productId: 'prod-123',
        reason: ReportReason.INCORRECT_INGREDIENTS,
        isFoodSafetyRisk: false,
        status: ReportStatus.PENDING,
        details: 'Ingredientes incorretos',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    await controller.execute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'report-1',
        productId: 'prod-123',
        reporterId: 'user-1',
      })
    );
    expect(useCaseMock.execute).toHaveBeenCalledWith({
      reporterId: 'user-1',
      productId: 'prod-123',
      partnerId: undefined,
      reason: ReportReason.INCORRECT_INGREDIENTS,
      details: 'Ingredientes incorretos',
      isFoodSafetyRisk: undefined,
    });
  });

  it('should create partner report successfully and return 201', async () => {
    req = {
      body: {
        partnerId: 'partner-999',
        reason: ReportReason.WRONG_CROSS_CONTAMINATION,
        details: 'Estabelecimento omitiu contaminação cruzada',
        isFoodSafetyRisk: true,
      },
      user: { id: 'user-2' } as any,
    };

    useCaseMock.execute.mockResolvedValue(
      Result.ok({
        id: 'report-2',
        reporterId: 'user-2',
        partnerId: 'partner-999',
        reason: ReportReason.WRONG_CROSS_CONTAMINATION,
        isFoodSafetyRisk: true,
        status: ReportStatus.PENDING,
        details: 'Estabelecimento omitiu contaminação cruzada',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    await controller.execute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'report-2',
        partnerId: 'partner-999',
        reporterId: 'user-2',
        isFoodSafetyRisk: true,
      })
    );
    expect(useCaseMock.execute).toHaveBeenCalledWith({
      reporterId: 'user-2',
      productId: undefined,
      partnerId: 'partner-999',
      reason: ReportReason.WRONG_CROSS_CONTAMINATION,
      details: 'Estabelecimento omitiu contaminação cruzada',
      isFoodSafetyRisk: true,
    });
  });

  it('should return 400 when use case execution fails (e.g. neither productId nor partnerId supplied)', async () => {
    req = {
      body: {
        reason: ReportReason.OTHER,
      },
      user: { id: 'user-3' } as any,
    };

    useCaseMock.execute.mockResolvedValue(
      Result.fail('Product ID or Partner ID is required.')
    );

    await controller.execute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Product ID or Partner ID is required.',
    });
  });

  it('should return 500 when an unexpected exception is thrown', async () => {
    req = {
      body: {
        productId: 'prod-1',
        reason: ReportReason.OTHER,
      },
      user: { id: 'user-4' } as any,
    };

    useCaseMock.execute.mockRejectedValue(new Error('DB failure'));

    await controller.execute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });
});
