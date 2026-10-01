// backend/tests/unit/application/payment/PaymentUseCases.spec.ts
import { CheckoutOrderUseCase } from '../../../../src/application/payment/CheckoutOrderUseCase';
import { SetupPartnerFinancialAccountUseCase } from '../../../../src/application/payment/SetupPartnerFinancialAccountUseCase';
import { HandleAsaasWebhookUseCase } from '../../../../src/application/payment/HandleAsaasWebhookUseCase';
import { RefundPaymentUseCase } from '../../../../src/application/payment/RefundPaymentUseCase';

import { IOrderRepository } from '../../../../src/domain/order/repositories/IOrderRepository';
import { IPaymentRepository } from '../../../../src/domain/payment/repositories/IPaymentRepository';
import { IPartnerFinancialAccountRepository } from '../../../../src/domain/payment/repositories/IPartnerFinancialAccountRepository';
import { IPaymentRefundRepository } from '../../../../src/domain/payment/repositories/IPaymentRefundRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IPaymentGateway } from '../../../../src/domain/payment/services/IPaymentGateway';
import { IAuditLogRepository } from '../../../../src/domain/audit/repositories/IAuditLogRepository';

import { Order } from '../../../../src/domain/order/entities/Order';
import { OrderItem } from '../../../../src/domain/order/entities/OrderItem';
import { OrderStatus } from '../../../../src/domain/order/value-objects/OrderStatus';
import { Payment } from '../../../../src/domain/payment/entities/Payment';
import { PartnerFinancialAccount } from '../../../../src/domain/payment/entities/PartnerFinancialAccount';
import { PaymentMethod, PaymentStatus } from '../../../../src/domain/payment/value-objects/PaymentStatus';
import { Consumer } from '../../../../src/domain/consumer/Consumer';
import { IConsumerRepository } from '../../../../src/domain/consumer/repositories/IConsumerRepository';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';
import { Result } from '../../../../src/domain/Result';

describe('Payment Application Use Cases Unit Tests', () => {
  let orderRepository: jest.Mocked<IOrderRepository>;
  let paymentRepository: jest.Mocked<IPaymentRepository>;
  let financialAccountRepository: jest.Mocked<IPartnerFinancialAccountRepository>;
  let refundRepository: jest.Mocked<IPaymentRefundRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let paymentGateway: jest.Mocked<IPaymentGateway>;

  const consumerId = 'consumer-user-1';
  const partnerUserId = 'partner-user-1';
  const partnerId = 'partner-1';

  const mockPartner = Partner.create(
    {
      userId: partnerUserId,
      name: 'Padaria Segura',
      description: 'Livre de glúten',
      address: 'Rua das Amêndoas, 50',
      phone: '+5511999998888',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
      operationalStatus: PartnerOperationalStatus.ACTIVE,
    },
    partnerId
  ).getValue();

  const createTestOrder = (id = 'order-1') => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: 'Bolo de Cenoura',
      unitPrice: 50.0,
      quantity: 1,
    }).getValue();

    return Order.create(
      {
        consumerId,
        partnerId,
        items: [item],
        deliveryFee: 10.0,
        allergenCheckVerdict: 'SAFE',
      },
      id
    ).getValue();
  };

  beforeEach(() => {
    orderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByConsumerId: jest.fn(),
      findByPartnerId: jest.fn(),
    };

    paymentRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      findByGatewayTransactionId: jest.fn(),
      findByIdempotencyKey: jest.fn(),
    };

    financialAccountRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findByPartnerId: jest.fn(),
      findBySubaccountId: jest.fn(),
    };

    refundRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByPaymentId: jest.fn(),
    };

    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockPartner),
      findByCnpj: jest.fn(),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    paymentGateway = {
      createSubaccount: jest.fn().mockResolvedValue(Result.ok({ subaccountId: 'subacc_mock_123' })),
      createPixCharge: jest.fn().mockResolvedValue(
        Result.ok({
          transactionId: 'pay_asaas_pix_1',
          pixQrCode: 'data:image/png;base64,mockqr',
          pixCopyPaste: '000201pixcopypaste',
          expiresAt: new Date(),
        })
      ),
      createCreditCardCharge: jest.fn().mockResolvedValue(
        Result.ok({
          transactionId: 'pay_asaas_cc_1',
          status: PaymentStatus.PAID,
        })
      ),
      refundCharge: jest.fn().mockResolvedValue(Result.ok({ gatewayRefundId: 'ref_asaas_1' })),
    };
  });

  describe('SetupPartnerFinancialAccountUseCase', () => {
    it('deve provisionar subconta no Asaas e salvar dados da chave PIX do parceiro', async () => {
      financialAccountRepository.findByPartnerId.mockResolvedValue(null);

      const useCase = new SetupPartnerFinancialAccountUseCase(
        partnerRepository,
        financialAccountRepository,
        paymentGateway
      );

      const result = await useCase.execute({
        partnerId,
        userId: partnerUserId,
        userRole: 'PARCEIRO',
        pixKey: 'financeiro@padariasegura.com.br',
        pixKeyType: 'EMAIL',
      });

      expect(result.isSuccess).toBe(true);
      expect(paymentGateway.createSubaccount).toHaveBeenCalled();
      expect(financialAccountRepository.save).toHaveBeenCalled();
      const account = result.getValue();
      expect(account.gatewaySubaccountId).toBe('subacc_mock_123');
      expect(account.isVerified).toBe(true);
    });
  });

  describe('CheckoutOrderUseCase', () => {
    it('deve gerar cobrança PIX com split de comissão CeLiLac (12%) e repasse líquido', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const financialAccount = PartnerFinancialAccount.create({
        partnerId,
        gatewaySubaccountId: 'subacc_partner_1',
        pixKey: '12345678000199',
        pixKeyType: 'CNPJ',
        isVerified: true,
      }).getValue();
      financialAccountRepository.findByPartnerId.mockResolvedValue(financialAccount);

      const useCase = new CheckoutOrderUseCase(
        orderRepository,
        paymentRepository,
        financialAccountRepository,
        paymentGateway
      );

      const result = await useCase.execute({
        orderId: order.id,
        consumerId,
        method: PaymentMethod.PIX,
      });

      expect(result.isSuccess).toBe(true);
      const checkout = result.getValue();
      expect(checkout.method).toBe(PaymentMethod.PIX);
      expect(checkout.grossAmount).toBe(60.0); // 50 subtotal + 10 entrega
      expect(checkout.platformFeeAmount).toBe(6.0); // 12% de 50
      expect(checkout.netPartnerAmount).toBe(54.0); // 60 - 6
      expect(checkout.pixCopyPaste).toBe('000201pixcopypaste');

      expect(paymentRepository.save).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(order.status).toBe(OrderStatus.AWAITING_PAYMENT);
    });

    it('deve processar pagamento com cartão de crédito tokenizado', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const useCase = new CheckoutOrderUseCase(
        orderRepository,
        paymentRepository,
        financialAccountRepository,
        paymentGateway
      );

      const result = await useCase.execute({
        orderId: order.id,
        consumerId,
        method: PaymentMethod.CREDIT_CARD,
        creditCardToken: 'token_cartao_seguro_123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe(PaymentStatus.PAID);
      expect(order.status).toBe(OrderStatus.PAID);
    });

    it('deve retornar pagamento existente de forma idempotente quando idempotencyKey já existir', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const existingPayment = Payment.create({
        orderId: order.id,
        consumerId,
        partnerId,
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
        idempotencyKey: 'idemp_key_abc_123',
        status: PaymentStatus.PENDING,
      }).getValue();

      paymentRepository.findByIdempotencyKey.mockResolvedValue(existingPayment);

      const useCase = new CheckoutOrderUseCase(
        orderRepository,
        paymentRepository,
        financialAccountRepository,
        paymentGateway
      );

      const result = await useCase.execute({
        orderId: order.id,
        consumerId,
        method: PaymentMethod.PIX,
        idempotencyKey: 'idemp_key_abc_123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().paymentId).toBe(existingPayment.id);
      expect(paymentGateway.createPixCharge).not.toHaveBeenCalled();
    });

    it('deve retornar pagamento existente de forma idempotente se o pedido já estiver PAID', async () => {
      const order = createTestOrder();
      order.markAsPaid();
      orderRepository.findById.mockResolvedValue(order);

      const paidPayment = Payment.create({
        orderId: order.id,
        consumerId,
        partnerId,
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
        status: PaymentStatus.PAID,
      }).getValue();

      paymentRepository.findByOrderId.mockResolvedValue(paidPayment);

      const useCase = new CheckoutOrderUseCase(
        orderRepository,
        paymentRepository,
        financialAccountRepository,
        paymentGateway
      );

      const result = await useCase.execute({
        orderId: order.id,
        consumerId,
        method: PaymentMethod.PIX,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().paymentId).toBe(paidPayment.id);
      expect(paymentGateway.createPixCharge).not.toHaveBeenCalled();
    });

    it('deve processar checkout com CARD_ON_DELIVERY confirmando o pedido sem chamar gateway Asaas', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const useCase = new CheckoutOrderUseCase(
        orderRepository,
        paymentRepository,
        financialAccountRepository,
        paymentGateway
      );

      const result = await useCase.execute({
        orderId: order.id,
        consumerId,
        method: PaymentMethod.CARD_ON_DELIVERY,
      });

      expect(result.isSuccess).toBe(true);
      const checkout = result.getValue();
      expect(checkout.method).toBe(PaymentMethod.CARD_ON_DELIVERY);
      expect(checkout.status).toBe(PaymentStatus.PENDING);
      expect(checkout.grossAmount).toBe(60.0);
      expect(checkout.platformFeeAmount).toBe(6.0); // 12%
      expect(paymentGateway.createCreditCardCharge).not.toHaveBeenCalled();
      expect(paymentGateway.createPixCharge).not.toHaveBeenCalled();
      expect(order.status).toBe(OrderStatus.CONFIRMED);
    });

    it('deve processar checkout com CASH_ON_DELIVERY validando troco para valor maior', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const useCase = new CheckoutOrderUseCase(
        orderRepository,
        paymentRepository,
        financialAccountRepository,
        paymentGateway
      );

      const result = await useCase.execute({
        orderId: order.id,
        consumerId,
        method: PaymentMethod.CASH_ON_DELIVERY,
        changeFor: 100.0,
      });

      expect(result.isSuccess).toBe(true);
      const checkout = result.getValue();
      expect(checkout.method).toBe(PaymentMethod.CASH_ON_DELIVERY);
      expect(checkout.changeFor).toBe(100.0);
      expect(order.status).toBe(OrderStatus.CONFIRMED);
    });

    it('deve bloquear checkout na entrega se o consumidor estiver proibido de pagar na entrega', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const blockedConsumer = Consumer.create({
        userId: consumerId,
        canPayOnDelivery: false,
      }).getValue();

      const mockConsumerRepo: jest.Mocked<IConsumerRepository> = {
        findByUserId: jest.fn().mockResolvedValue(blockedConsumer),
        findById: jest.fn().mockResolvedValue(blockedConsumer),
        save: jest.fn().mockResolvedValue(undefined),
      };

      const useCase = new CheckoutOrderUseCase(
        orderRepository,
        paymentRepository,
        financialAccountRepository,
        paymentGateway,
        mockConsumerRepo
      );

      const result = await useCase.execute({
        orderId: order.id,
        consumerId,
        method: PaymentMethod.CARD_ON_DELIVERY,
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Opção de pagamento na entrega indisponível');
    });
  });

  describe('HandleAsaasWebhookUseCase', () => {
    it('deve confirmar pagamento e atualizar o status do pedido para PAID ao receber evento PAYMENT_RECEIVED', async () => {
      const order = createTestOrder();
      order.markAwaitingPayment();

      const payment = Payment.create({
        orderId: order.id,
        consumerId,
        partnerId,
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
        gatewayTransactionId: 'pay_asaas_100',
      }).getValue();

      paymentRepository.findByGatewayTransactionId.mockResolvedValue(payment);
      orderRepository.findById.mockResolvedValue(order);

      const webhookUseCase = new HandleAsaasWebhookUseCase(paymentRepository, orderRepository);
      const result = await webhookUseCase.execute({
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_asaas_100',
          value: 60.0,
          status: 'RECEIVED',
          billingType: 'PIX',
          confirmedDate: new Date().toISOString(),
        },
      });

      expect(result.isSuccess).toBe(true);
      expect(payment.status).toBe(PaymentStatus.PAID);
      expect(order.status).toBe(OrderStatus.PAID);
      expect(paymentRepository.save).toHaveBeenCalledWith(payment);
      expect(orderRepository.save).toHaveBeenCalledWith(order);
    });

    it('deve disparar notifyPaymentConfirmed em tempo real no serviço de notificação ao confirmar pagamento', async () => {
      const order = createTestOrder();
      order.markAwaitingPayment();

      const payment = Payment.create({
        orderId: order.id,
        consumerId,
        partnerId,
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
        gatewayTransactionId: 'pay_asaas_101',
      }).getValue();

      paymentRepository.findByGatewayTransactionId.mockResolvedValue(payment);
      orderRepository.findById.mockResolvedValue(order);

      const mockNotificationService = {
        notifyPaymentConfirmed: jest.fn(),
        notifyOrderStatusChanged: jest.fn(),
      };

      const webhookUseCase = new HandleAsaasWebhookUseCase(
        paymentRepository,
        orderRepository,
        undefined,
        mockNotificationService
      );

      const result = await webhookUseCase.execute({
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_asaas_101',
          value: 60.0,
          status: 'RECEIVED',
          billingType: 'PIX',
          confirmedDate: '2026-09-30T14:30:00.000Z',
        },
      });

      expect(result.isSuccess).toBe(true);
      expect(mockNotificationService.notifyPaymentConfirmed).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyPaymentConfirmed).toHaveBeenCalledWith(
        partnerId,
        expect.objectContaining({
          orderId: order.id,
          partnerId,
          consumerId,
          status: OrderStatus.PAID,
          confirmedAt: '2026-09-30T14:30:00.000Z',
        })
      );
    });

    it('deve atualizar para REFUNDED ao receber evento PAYMENT_REFUNDED', async () => {
      const order = createTestOrder();
      order.markAsPaid();

      const payment = Payment.create({
        orderId: order.id,
        consumerId,
        partnerId,
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
        gatewayTransactionId: 'pay_asaas_100',
        status: PaymentStatus.PAID,
      }).getValue();

      paymentRepository.findByGatewayTransactionId.mockResolvedValue(payment);
      orderRepository.findById.mockResolvedValue(order);

      const webhookUseCase = new HandleAsaasWebhookUseCase(paymentRepository, orderRepository);
      const result = await webhookUseCase.execute({
        event: 'PAYMENT_REFUNDED',
        payment: {
          id: 'pay_asaas_100',
          value: 60.0,
          status: 'REFUNDED',
          billingType: 'PIX',
        },
      });

      expect(result.isSuccess).toBe(true);
      expect(payment.status).toBe(PaymentStatus.REFUNDED);
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('RefundPaymentUseCase', () => {
    it('deve disparar estorno no gateway e salvar registro de reembolso', async () => {
      const payment = Payment.create({
        orderId: 'order-1',
        consumerId,
        partnerId,
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
        gatewayTransactionId: 'pay_asaas_100',
        status: PaymentStatus.PAID,
      }).getValue();

      paymentRepository.findById.mockResolvedValue(payment);

      const refundUseCase = new RefundPaymentUseCase(
        paymentRepository,
        refundRepository,
        paymentGateway
      );

      const result = await refundUseCase.execute({
        paymentId: payment.id,
        reason: 'Cancelado pelo celíaco antes do aceite do parceiro',
      });

      expect(result.isSuccess).toBe(true);
      expect(paymentGateway.refundCharge).toHaveBeenCalledWith({
        gatewayTransactionId: 'pay_asaas_100',
        refundAmount: payment.grossAmount,
        reason: 'Cancelado pelo celíaco antes do aceite do parceiro',
      });
      expect(payment.status).toBe(PaymentStatus.REFUNDED);
      expect(refundRepository.save).toHaveBeenCalled();
    });
  });

  describe('Auditoria de Eventos Financeiros (AuditLogRepository)', () => {
    let mockAuditRepo: jest.Mocked<IAuditLogRepository>;

    beforeEach(() => {
      mockAuditRepo = {
        save: jest.fn().mockResolvedValue(undefined),
        findByEntity: jest.fn().mockResolvedValue([]),
      };
    });

    it('deve registrar PAYMENT_CHECKOUT_ATTEMPT no audit_logs durante o checkout', async () => {
      const order = createTestOrder('order-audit-1');
      orderRepository.findById.mockResolvedValue(order);
      paymentRepository.findByIdempotencyKey.mockResolvedValue(null);
      paymentRepository.findByOrderId.mockResolvedValue(null);
      financialAccountRepository.findByPartnerId.mockResolvedValue(null);
      paymentGateway.createPixCharge.mockResolvedValue(
        Result.ok({
          transactionId: 'pay_asaas_audit',
          pixQrCode: 'base64...',
          pixCopyPaste: 'pix-code...',
          expiresAt: new Date(),
        })
      );

      const useCase = new CheckoutOrderUseCase(
        orderRepository,
        paymentRepository,
        financialAccountRepository,
        paymentGateway,
        mockAuditRepo
      );

      const result = await useCase.execute({
        orderId: 'order-audit-1',
        consumerId,
        method: PaymentMethod.PIX,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockAuditRepo.save).toHaveBeenCalledTimes(1);
      const savedLog = mockAuditRepo.save.mock.calls[0][0];
      expect(savedLog.action).toBe('PAYMENT_CHECKOUT_ATTEMPT');
      expect(savedLog.entityType).toBe('PAYMENT');
      expect(savedLog.actorId).toBe(consumerId);
    });

    it('deve registrar PARTNER_FINANCIAL_ACCOUNT_CONFIGURED mascarando a chave PIX', async () => {
      partnerRepository.findById.mockResolvedValue(mockPartner);
      financialAccountRepository.findByPartnerId.mockResolvedValue(null);
      paymentGateway.createSubaccount.mockResolvedValue(Result.ok({ subaccountId: 'sub_123' }));

      const useCase = new SetupPartnerFinancialAccountUseCase(
        partnerRepository,
        financialAccountRepository,
        paymentGateway,
        mockAuditRepo
      );

      const result = await useCase.execute({
        partnerId,
        userId: partnerUserId,
        userRole: 'PARTNER',
        pixKey: '12345678901',
        pixKeyType: 'CPF' as any,
        bankCode: '033',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockAuditRepo.save).toHaveBeenCalledTimes(1);
      const savedLog = mockAuditRepo.save.mock.calls[0][0];
      expect(savedLog.action).toBe('PARTNER_FINANCIAL_ACCOUNT_CONFIGURED');
      expect(savedLog.changes.pixKey).toBe('123******01');
    });

    it('deve registrar PAYMENT_PROCESSED no webhook de confirmação', async () => {
      const payment = Payment.create({
        orderId: 'order-audit-2',
        consumerId,
        partnerId,
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
        gatewayTransactionId: 'pay_asaas_processed',
        status: PaymentStatus.PENDING,
      }).getValue();

      paymentRepository.findByGatewayTransactionId.mockResolvedValue(payment);
      orderRepository.findById.mockResolvedValue(createTestOrder('order-audit-2'));

      const useCase = new HandleAsaasWebhookUseCase(paymentRepository, orderRepository, mockAuditRepo);

      const result = await useCase.execute({
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_asaas_processed',
          value: 50.0,
          status: 'RECEIVED',
          billingType: 'PIX',
        },
      });

      expect(result.isSuccess).toBe(true);
      expect(mockAuditRepo.save).toHaveBeenCalledTimes(1);
      const savedLog = mockAuditRepo.save.mock.calls[0][0];
      expect(savedLog.action).toBe('PAYMENT_PROCESSED');
    });

    it('deve registrar PAYMENT_REFUNDED no RefundPaymentUseCase', async () => {
      const payment = Payment.create({
        orderId: 'order-audit-3',
        consumerId,
        partnerId,
        method: PaymentMethod.PIX,
        subtotalAmount: 75.0,
        gatewayTransactionId: 'pay_asaas_ref',
        status: PaymentStatus.PAID,
      }).getValue();

      paymentRepository.findById.mockResolvedValue(payment);
      paymentGateway.refundCharge.mockResolvedValue(Result.ok({ gatewayRefundId: 'ref_123' }));

      const useCase = new RefundPaymentUseCase(
        paymentRepository,
        refundRepository,
        paymentGateway,
        mockAuditRepo
      );

      const result = await useCase.execute({
        paymentId: payment.id,
        reason: 'Restrição detectada tardiamente',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockAuditRepo.save).toHaveBeenCalledTimes(1);
      const savedLog = mockAuditRepo.save.mock.calls[0][0];
      expect(savedLog.action).toBe('PAYMENT_REFUNDED');
      expect(savedLog.reason).toBe('Restrição detectada tardiamente');
    });
  });
});
