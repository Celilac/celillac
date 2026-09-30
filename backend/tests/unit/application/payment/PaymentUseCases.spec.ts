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

import { Order } from '../../../../src/domain/order/entities/Order';
import { OrderItem } from '../../../../src/domain/order/entities/OrderItem';
import { OrderStatus } from '../../../../src/domain/order/value-objects/OrderStatus';
import { Payment } from '../../../../src/domain/payment/entities/Payment';
import { PartnerFinancialAccount } from '../../../../src/domain/payment/entities/PartnerFinancialAccount';
import { PaymentMethod, PaymentStatus } from '../../../../src/domain/payment/value-objects/PaymentStatus';
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
});
