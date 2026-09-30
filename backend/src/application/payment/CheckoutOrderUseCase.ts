// backend/src/application/payment/CheckoutOrderUseCase.ts
import { Result } from '../../domain/Result';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IPaymentRepository } from '../../domain/payment/repositories/IPaymentRepository';
import { IPartnerFinancialAccountRepository } from '../../domain/payment/repositories/IPartnerFinancialAccountRepository';
import { IPaymentGateway } from '../../domain/payment/services/IPaymentGateway';
import { PaymentMethod, PaymentStatus } from '../../domain/payment/value-objects/PaymentStatus';
import { Payment } from '../../domain/payment/entities/Payment';
import { OrderStatus } from '../../domain/order/value-objects/OrderStatus';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';

export interface CheckoutCustomerInfo {
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface CheckoutOrderDTO {
  orderId: string;
  consumerId: string;
  method: PaymentMethod;
  creditCardToken?: string;
  customerInfo?: CheckoutCustomerInfo;
  idempotencyKey?: string;
  forceNew?: boolean;
}

export interface CheckoutOrderOutputDTO {
  paymentId: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  grossAmount: number;
  netPartnerAmount: number;
  platformFeeAmount: number;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpiresAt?: Date;
}

export class CheckoutOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly financialAccountRepository: IPartnerFinancialAccountRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  async execute(dto: CheckoutOrderDTO): Promise<Result<CheckoutOrderOutputDTO>> {
    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) {
      return Result.fail<CheckoutOrderOutputDTO>('Pedido não encontrado.');
    }

    if (order.consumerId !== dto.consumerId) {
      return Result.fail<CheckoutOrderOutputDTO>('Acesso negado: este pedido não pertence a você.');
    }

    // 1. Idempotência por chave explícita (Idempotency-Key)
    if (dto.idempotencyKey && !dto.forceNew) {
      const existingByKey = await this.paymentRepository.findByIdempotencyKey(dto.idempotencyKey);
      if (existingByKey) {
        return Result.ok<CheckoutOrderOutputDTO>({
          paymentId: existingByKey.id,
          orderId: existingByKey.orderId,
          method: existingByKey.method,
          status: existingByKey.status,
          grossAmount: existingByKey.grossAmount,
          netPartnerAmount: existingByKey.netPartnerAmount,
          platformFeeAmount: existingByKey.platformFeeAmount,
          pixQrCode: existingByKey.pixQrCode,
          pixCopyPaste: existingByKey.pixCopyPaste,
          pixExpiresAt: existingByKey.pixExpiresAt,
        });
      }
    }

    // 2. Idempotência por estado de pedido já pago ou cobrança idêntica pendente
    const existingForOrder = await this.paymentRepository.findByOrderId(order.id);
    if (existingForOrder) {
      if (existingForOrder.status === PaymentStatus.PAID) {
        return Result.ok<CheckoutOrderOutputDTO>({
          paymentId: existingForOrder.id,
          orderId: existingForOrder.orderId,
          method: existingForOrder.method,
          status: existingForOrder.status,
          grossAmount: existingForOrder.grossAmount,
          netPartnerAmount: existingForOrder.netPartnerAmount,
          platformFeeAmount: existingForOrder.platformFeeAmount,
          pixQrCode: existingForOrder.pixQrCode,
          pixCopyPaste: existingForOrder.pixCopyPaste,
          pixExpiresAt: existingForOrder.pixExpiresAt,
        });
      }

      if (
        !dto.forceNew &&
        existingForOrder.status === PaymentStatus.PENDING &&
        existingForOrder.method === dto.method
      ) {
        return Result.ok<CheckoutOrderOutputDTO>({
          paymentId: existingForOrder.id,
          orderId: existingForOrder.orderId,
          method: existingForOrder.method,
          status: existingForOrder.status,
          grossAmount: existingForOrder.grossAmount,
          netPartnerAmount: existingForOrder.netPartnerAmount,
          platformFeeAmount: existingForOrder.platformFeeAmount,
          pixQrCode: existingForOrder.pixQrCode,
          pixCopyPaste: existingForOrder.pixCopyPaste,
          pixExpiresAt: existingForOrder.pixExpiresAt,
        });
      }
    }

    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.AWAITING_PAYMENT) {
      return Result.fail<CheckoutOrderOutputDTO>(
        `Não é possível realizar checkout de um pedido com status "${order.status}".`
      );
    }

    // Buscar dados financeiros do parceiro para o split
    const partnerAccount = await this.financialAccountRepository.findByPartnerId(order.partnerId);
    const partnerSubaccountId = partnerAccount?.gatewaySubaccountId || `subacc_partner_${order.partnerId.substring(0, 8)}`;

    const customer = dto.customerInfo || {
      name: 'Consumidor CeLiLac',
      email: 'consumidor@celilac.dev',
      cpfCnpj: '000.000.000-00',
    };

    let paymentResult: Result<Payment>;

    if (dto.method === PaymentMethod.PIX) {
      const payment = (dto.forceNew && existingForOrder && existingForOrder.status === PaymentStatus.PENDING)
        ? existingForOrder
        : Payment.create({
            orderId: order.id,
            consumerId: order.consumerId,
            partnerId: order.partnerId,
            method: PaymentMethod.PIX,
            subtotalAmount: order.subtotalAmount,
            deliveryFee: order.deliveryFee,
            status: PaymentStatus.PENDING,
            idempotencyKey: dto.idempotencyKey,
          }).getValue();

      const gatewayRes = await this.paymentGateway.createPixCharge({
        orderId: order.id,
        grossAmount: payment.grossAmount,
        customerName: customer.name,
        customerEmail: customer.email,
        customerCpfCnpj: customer.cpfCnpj,
        partnerSubaccountId,
        netPartnerAmount: payment.netPartnerAmount,
      });

      if (gatewayRes.isFailure) {
        return Result.fail<CheckoutOrderOutputDTO>(gatewayRes.getError());
      }

      const pixData = gatewayRes.getValue();
      payment.setGatewayTransactionId(pixData.transactionId);
      payment.setPixDetails(pixData.pixQrCode, pixData.pixCopyPaste, pixData.expiresAt);

      order.markAwaitingPayment();
      paymentResult = Result.ok(payment);
    } else if (dto.method === PaymentMethod.CREDIT_CARD) {
      if (!dto.creditCardToken) {
        return Result.fail<CheckoutOrderOutputDTO>('Token do cartão de crédito é obrigatório para pagamento com cartão.');
      }

      const payment = Payment.create({
        orderId: order.id,
        consumerId: order.consumerId,
        partnerId: order.partnerId,
        method: PaymentMethod.CREDIT_CARD,
        subtotalAmount: order.subtotalAmount,
        deliveryFee: order.deliveryFee,
        status: PaymentStatus.PENDING,
        idempotencyKey: dto.idempotencyKey,
      }).getValue();

      const gatewayRes = await this.paymentGateway.createCreditCardCharge({
        orderId: order.id,
        grossAmount: payment.grossAmount,
        customerName: customer.name,
        customerEmail: customer.email,
        customerCpfCnpj: customer.cpfCnpj,
        cardToken: dto.creditCardToken,
        partnerSubaccountId,
        netPartnerAmount: payment.netPartnerAmount,
      });

      if (gatewayRes.isFailure) {
        return Result.fail<CheckoutOrderOutputDTO>(gatewayRes.getError());
      }

      const ccData = gatewayRes.getValue();
      payment.setGatewayTransactionId(ccData.transactionId);

      if (ccData.status === PaymentStatus.PAID) {
        payment.markAsPaid();
        order.markAsPaid();
      } else {
        order.markAwaitingPayment();
      }

      paymentResult = Result.ok(payment);
    } else {
      return Result.fail<CheckoutOrderOutputDTO>('Método de pagamento não suportado.');
    }

    const payment = paymentResult.getValue();

    await this.paymentRepository.save(payment);
    await this.orderRepository.save(order);

    if (this.auditLogRepository) {
      const logResult = AuditLog.create({
        entityType: 'PAYMENT',
        entityId: payment.id,
        action: 'PAYMENT_CHECKOUT_ATTEMPT',
        actorId: dto.consumerId,
        actorRole: 'CONSUMER',
        changes: {
          orderId: order.id,
          method: payment.method,
          status: payment.status,
          grossAmount: payment.grossAmount,
          idempotencyKey: payment.idempotencyKey,
        },
        reason: 'Tentativa de checkout iniciada pelo consumidor',
      });
      if (logResult.isSuccess) {
        await this.auditLogRepository.save(logResult.getValue());
      }
    }

    return Result.ok<CheckoutOrderOutputDTO>({
      paymentId: payment.id,
      orderId: order.id,
      method: payment.method,
      status: payment.status,
      grossAmount: payment.grossAmount,
      netPartnerAmount: payment.netPartnerAmount,
      platformFeeAmount: payment.platformFeeAmount,
      pixQrCode: payment.pixQrCode,
      pixCopyPaste: payment.pixCopyPaste,
      pixExpiresAt: payment.pixExpiresAt,
    });
  }
}
