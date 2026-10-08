// backend/tests/unit/application/order/CancelExpiredOrdersUseCase.spec.ts
import { CancelExpiredOrdersUseCase } from '../../../../src/application/order/CancelExpiredOrdersUseCase';
import { IOrderRepository } from '../../../../src/domain/order/repositories/IOrderRepository';
import { IPaymentRepository } from '../../../../src/domain/payment/repositories/IPaymentRepository';
import { RefundPaymentUseCase } from '../../../../src/application/payment/RefundPaymentUseCase';
import { IOrderNotificationService } from '../../../../src/domain/order/services/IOrderNotificationService';
import { IAuditLogRepository } from '../../../../src/domain/audit/repositories/IAuditLogRepository';
import { Order } from '../../../../src/domain/order/entities/Order';
import { OrderItem } from '../../../../src/domain/order/entities/OrderItem';
import { OrderStatus } from '../../../../src/domain/order/value-objects/OrderStatus';
import { Payment } from '../../../../src/domain/payment/entities/Payment';
import { PaymentMethod, PaymentStatus } from '../../../../src/domain/payment/value-objects/PaymentStatus';
import { Result } from '../../../../src/domain/Result';

describe('CancelExpiredOrdersUseCase Unit Tests', () => {
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockRefundPaymentUseCase: jest.Mocked<RefundPaymentUseCase>;
  let mockNotificationService: jest.Mocked<IOrderNotificationService>;
  let mockAuditLogRepository: jest.Mocked<IAuditLogRepository>;
  let useCase: CancelExpiredOrdersUseCase;

  const createTestOrder = (
    id: string,
    status: OrderStatus,
    minutesAgo: number,
    paymentMethod?: string
  ): Order => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: 'Pão de Queijo',
      unitPrice: 10,
      quantity: 1,
    }).getValue();

    const pastDate = new Date(Date.now() - minutesAgo * 60 * 1000);

    return Order.create(
      {
        consumerId: 'user-c1',
        partnerId: 'partner-p1',
        items: [item],
        allergenCheckVerdict: 'SAFE',
        status,
        paymentMethod,
        createdAt: pastDate,
        updatedAt: pastDate,
      },
      id
    ).getValue();
  };

  beforeEach(() => {
    mockOrderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByConsumerId: jest.fn(),
      findByPartnerId: jest.fn(),
      findPendingExpired: jest.fn(),
    };

    mockPaymentRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findByGatewayTransactionId: jest.fn(),
    };

    mockRefundPaymentUseCase = {
      execute: jest.fn().mockResolvedValue(Result.ok({ refundId: 'ref-1', status: 'REFUNDED' })),
    } as any;

    mockNotificationService = {
      notifyOrderStatusChanged: jest.fn(),
      notifyPaymentConfirmed: jest.fn(),
    };

    mockAuditLogRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findByEntity: jest.fn(),
    };

    useCase = new CancelExpiredOrdersUseCase(
      mockOrderRepository,
      mockPaymentRepository,
      mockRefundPaymentUseCase,
      mockNotificationService,
      mockAuditLogRepository
    );
  });

  it('deve retornar contagem 0 quando não houver pedidos expirados', async () => {
    mockOrderRepository.findPendingExpired.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().processedCount).toBe(0);
    expect(result.getValue().cancelledOrders).toHaveLength(0);
    expect(mockOrderRepository.save).not.toHaveBeenCalled();
  });

  it('deve cancelar pedido pago (PAID) por inação do parceiro e acionar estorno automático', async () => {
    const expiredPaidOrder = createTestOrder('ord-paid-1', OrderStatus.PAID, 16);
    mockOrderRepository.findPendingExpired.mockResolvedValue([expiredPaidOrder]);

    const mockPayment = Payment.create({
      orderId: 'ord-paid-1',
      consumerId: 'user-c1',
      partnerId: 'partner-p1',
      method: PaymentMethod.PIX,
      subtotalAmount: 10,
      deliveryFee: 0,
      status: PaymentStatus.PAID,
    }).getValue();

    mockPaymentRepository.findByOrderId.mockResolvedValue(mockPayment);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    const output = result.getValue();
    expect(output.processedCount).toBe(1);
    expect(output.cancelledOrders[0].orderId).toBe('ord-paid-1');
    expect(output.cancelledOrders[0].refundProcessed).toBe(true);
    expect(output.cancelledOrders[0].cancelReason).toContain('Estabelecimento não respondeu');

    expect(expiredPaidOrder.status).toBe(OrderStatus.CANCELLED);
    expect(mockOrderRepository.save).toHaveBeenCalledWith(expiredPaidOrder);
    expect(mockRefundPaymentUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: mockPayment.id,
      })
    );
    expect(mockNotificationService.notifyOrderStatusChanged).toHaveBeenCalledWith(
      'user-c1',
      expect.objectContaining({ orderId: 'ord-paid-1', status: OrderStatus.CANCELLED })
    );
    expect(mockAuditLogRepository.save).toHaveBeenCalled();
  });

  it('deve cancelar pedido em aberto (CREATED) por demora no pagamento sem solicitar estorno', async () => {
    const expiredCreatedOrder = createTestOrder('ord-created-1', OrderStatus.CREATED, 11);
    mockOrderRepository.findPendingExpired.mockResolvedValue([expiredCreatedOrder]);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    const output = result.getValue();
    expect(output.processedCount).toBe(1);
    expect(output.cancelledOrders[0].orderId).toBe('ord-created-1');
    expect(output.cancelledOrders[0].refundProcessed).toBe(false);
    expect(output.cancelledOrders[0].cancelReason).toContain('Prazo para seleção e conclusão do pagamento expirou');

    expect(expiredCreatedOrder.status).toBe(OrderStatus.CANCELLED);
    expect(mockOrderRepository.save).toHaveBeenCalledWith(expiredCreatedOrder);
    expect(mockRefundPaymentUseCase.execute).not.toHaveBeenCalled();
    expect(mockNotificationService.notifyOrderStatusChanged).toHaveBeenCalled();
  });
});
