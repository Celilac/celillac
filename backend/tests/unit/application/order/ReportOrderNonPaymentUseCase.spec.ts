// backend/tests/unit/application/order/ReportOrderNonPaymentUseCase.spec.ts
import { ReportOrderNonPaymentUseCase } from '../../../../src/application/order/ReportOrderNonPaymentUseCase';
import { IOrderRepository } from '../../../../src/domain/order/repositories/IOrderRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IPaymentRepository } from '../../../../src/domain/payment/repositories/IPaymentRepository';
import { IReportRepository } from '../../../../src/domain/admin/repositories/IReportRepository';
import { IConsumerRepository } from '../../../../src/domain/consumer/repositories/IConsumerRepository';
import { IOrderNotificationService } from '../../../../src/domain/order/services/IOrderNotificationService';
import { IAuditLogRepository } from '../../../../src/domain/audit/repositories/IAuditLogRepository';
import { Order } from '../../../../src/domain/order/entities/Order';
import { OrderItem } from '../../../../src/domain/order/entities/OrderItem';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';
import { Payment } from '../../../../src/domain/payment/entities/Payment';
import { PaymentMethod, PaymentStatus } from '../../../../src/domain/payment/value-objects/PaymentStatus';
import { Consumer } from '../../../../src/domain/consumer/Consumer';
import { ReportReason } from '../../../../src/domain/admin/value-objects/ReportReason';
import { OrderStatus } from '../../../../src/domain/order/value-objects/OrderStatus';

describe('ReportOrderNonPaymentUseCase', () => {
  let orderRepository: jest.Mocked<IOrderRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let paymentRepository: jest.Mocked<IPaymentRepository>;
  let reportRepository: jest.Mocked<IReportRepository>;
  let consumerRepository: jest.Mocked<IConsumerRepository>;
  let notificationService: jest.Mocked<IOrderNotificationService>;
  let auditLogRepository: jest.Mocked<IAuditLogRepository>;

  const consumerUserId = 'user-consumer-123';
  const partnerUserId = 'user-partner-456';
  const partnerId = 'partner-estab-789';
  const orderId = 'order-abc-123';

  const mockPartner = Partner.create(
    {
      userId: partnerUserId,
      name: 'Padaria Segura',
      description: 'Pães artesanais sem glúten',
      address: 'Rua das Flores, 100',
      phone: '+5511999998888',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
      operationalStatus: PartnerOperationalStatus.ACTIVE,
    },
    partnerId
  ).getValue();

  const createOrder = (status = OrderStatus.CONFIRMED) => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: 'Pão Francês Sem Glúten',
      unitPrice: 20.0,
      quantity: 2,
    }).getValue();

    const order = Order.create(
      {
        consumerId: consumerUserId,
        partnerId,
        items: [item],
        deliveryFee: 10.0,
        allergenCheckVerdict: 'SAFE',
        status,
      },
      orderId
    ).getValue();

    return order;
  };

  const createPayment = () => {
    return Payment.create({
      orderId,
      consumerId: consumerUserId,
      partnerId,
      gateway: 'DELIVERY',
      method: PaymentMethod.CASH_ON_DELIVERY,
      subtotalAmount: 40.0,
      deliveryFee: 10.0,
      changeFor: 50.0,
      status: PaymentStatus.PENDING,
    }).getValue();
  };

  const createConsumer = (canPayOnDelivery = true) => {
    return Consumer.create(
      {
        userId: consumerUserId,
        canPayOnDelivery,
      },
      'consumer-entity-id'
    ).getValue();
  };

  beforeEach(() => {
    orderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByConsumerId: jest.fn(),
      findByPartnerId: jest.fn(),
    };

    partnerRepository = {
      findById: jest.fn().mockResolvedValue(mockPartner),
      findByUserId: jest.fn(),
      findAllByUserId: jest.fn().mockResolvedValue([mockPartner]),
      findNearby: jest.fn(),
      findAllPendingApproval: jest.fn(),
      findAllApproved: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      existsByNameAndAddress: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    paymentRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      findByGatewayTransactionId: jest.fn(),
      findByIdempotencyKey: jest.fn(),
    };

    reportRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    consumerRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findByUserId: jest.fn(),
      findById: jest.fn(),
    };

    notificationService = {
      notifyPaymentConfirmed: jest.fn(),
      notifyOrderStatusChanged: jest.fn(),
    };

    auditLogRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
      findByEntity: jest.fn(),
    } as any;
  });

  it('deve registrar denúncia com sucesso, cancelar pedido, isentar taxa da plataforma e bloquear pagamento na entrega do cliente', async () => {
    const order = createOrder(OrderStatus.OUT_FOR_DELIVERY);
    const payment = createPayment();
    const consumer = createConsumer(true);

    orderRepository.findById.mockResolvedValue(order);
    paymentRepository.findByOrderId.mockResolvedValue(payment);
    consumerRepository.findByUserId.mockResolvedValue(consumer);

    const useCase = new ReportOrderNonPaymentUseCase(
      orderRepository,
      partnerRepository,
      paymentRepository,
      reportRepository,
      consumerRepository,
      notificationService,
      auditLogRepository
    );

    const result = await useCase.execute({
      orderId,
      partnerUserId,
      reason: ReportReason.CLIENT_REFUSED_PAYMENT,
      details: 'Cliente se recusou a pagar e foi ríspido',
    });

    expect(result.isSuccess).toBe(true);
    const output = result.getValue();
    expect(output.orderStatus).toBe(OrderStatus.CANCELLED);
    expect(output.consumerBlockedFromDeliveryPayment).toBe(true);
    expect(output.platformFeeWaived).toBe(true);
    expect(output.reportId).toBeDefined();

    // Verificações de persistência
    expect(orderRepository.save).toHaveBeenCalled();
    expect(order.status).toBe(OrderStatus.CANCELLED);

    expect(paymentRepository.save).toHaveBeenCalled();
    expect(payment.status).toBe(PaymentStatus.FAILED);
    expect(payment.platformFeeAmount).toBe(0); // Taxa CeLiLac zerada!

    expect(reportRepository.save).toHaveBeenCalled();
    expect(consumerRepository.save).toHaveBeenCalled();
    expect(consumer.canPayOnDelivery).toBe(false); // Revogado!

    expect(notificationService.notifyOrderStatusChanged).toHaveBeenCalledTimes(2);
    expect(auditLogRepository.save).toHaveBeenCalled();
  });

  it('deve falhar se o pedido não existir', async () => {
    orderRepository.findById.mockResolvedValue(null);

    const useCase = new ReportOrderNonPaymentUseCase(
      orderRepository,
      partnerRepository,
      paymentRepository,
      reportRepository,
      consumerRepository
    );

    const result = await useCase.execute({
      orderId: 'inexistente',
      partnerUserId,
      reason: ReportReason.CLIENT_ABSENT,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Pedido não encontrado');
  });

  it('deve impedir que usuário que não é dono do parceiro reporte a ocorrência', async () => {
    const order = createOrder();
    orderRepository.findById.mockResolvedValue(order);

    const useCase = new ReportOrderNonPaymentUseCase(
      orderRepository,
      partnerRepository,
      paymentRepository,
      reportRepository,
      consumerRepository
    );

    const result = await useCase.execute({
      orderId,
      partnerUserId: 'outro-usuario-intruso',
      reason: ReportReason.CLIENT_ABSENT,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Acesso negado');
  });

  it('deve impedir denúncia de pedido já entregue', async () => {
    const order = createOrder(OrderStatus.DELIVERED);
    orderRepository.findById.mockResolvedValue(order);

    const useCase = new ReportOrderNonPaymentUseCase(
      orderRepository,
      partnerRepository,
      paymentRepository,
      reportRepository,
      consumerRepository
    );

    const result = await useCase.execute({
      orderId,
      partnerUserId,
      reason: ReportReason.CLIENT_REFUSED_PAYMENT,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('já entregue');
  });

  it('deve rejeitar motivo de denúncia não relacionado a entrega', async () => {
    const order = createOrder(OrderStatus.OUT_FOR_DELIVERY);
    orderRepository.findById.mockResolvedValue(order);

    const useCase = new ReportOrderNonPaymentUseCase(
      orderRepository,
      partnerRepository,
      paymentRepository,
      reportRepository,
      consumerRepository
    );

    const result = await useCase.execute({
      orderId,
      partnerUserId,
      reason: ReportReason.MISSING_ALLERGEN,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Motivo de denúncia inválido');
  });
});
