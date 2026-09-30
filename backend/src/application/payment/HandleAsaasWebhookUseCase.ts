// backend/src/application/payment/HandleAsaasWebhookUseCase.ts
import { Result } from '../../domain/Result';
import { IPaymentRepository } from '../../domain/payment/repositories/IPaymentRepository';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { SecurityLogger } from '../../infrastructure/logging/SecurityLogger';

export interface AsaasWebhookEventDTO {
  event: string;
  payment: {
    id: string;
    externalReference?: string;
    value: number;
    netValue?: number;
    status: string;
    billingType: string;
    confirmedDate?: string;
  };
}

export class HandleAsaasWebhookUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  async execute(dto: AsaasWebhookEventDTO): Promise<Result<{ processed: boolean; reason?: string }>> {
    if (!dto || !dto.payment || !dto.payment.id) {
      return Result.fail<{ processed: boolean; reason?: string }>('Payload de webhook inválido.');
    }

    const transactionId = dto.payment.id;
    let payment = await this.paymentRepository.findByGatewayTransactionId(transactionId);

    // Fallback: se não encontrou por transactionId, tenta por orderId (externalReference)
    if (!payment && dto.payment.externalReference) {
      payment = await this.paymentRepository.findByOrderId(dto.payment.externalReference);
      if (payment) {
        payment.setGatewayTransactionId(transactionId);
      }
    }

    if (!payment) {
      // Ignora silenciosamente eventos de pagamentos não originados no CeLiLac
      return Result.ok({ processed: false, reason: 'Pagamento não localizado no sistema.' });
    }

    const order = await this.orderRepository.findById(payment.orderId);

    switch (dto.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED': {
        payment.markAsPaid(dto.payment.confirmedDate ? new Date(dto.payment.confirmedDate) : new Date());
        if (order) {
          order.markAsPaid();
          await this.orderRepository.save(order);
        }
        await this.paymentRepository.save(payment);

        SecurityLogger.logPaymentProcessed({
          orderId: payment.orderId,
          paymentId: payment.id,
          status: payment.status,
          gatewayTransactionId: transactionId,
        });

        if (this.auditLogRepository) {
          const logRes = AuditLog.create({
            entityType: 'PAYMENT',
            entityId: payment.id,
            action: 'PAYMENT_PROCESSED',
            changes: {
              event: dto.event,
              orderId: payment.orderId,
              amount: payment.grossAmount,
              gatewayTransactionId: transactionId,
            },
            reason: 'Confirmação de pagamento recebida via webhook Asaas',
          });
          if (logRes.isSuccess) {
            await this.auditLogRepository.save(logRes.getValue());
          }
        }

        return Result.ok({ processed: true });
      }

      case 'PAYMENT_REFUNDED': {
        payment.markAsRefunded();
        if (order) {
          order.cancel('Estorno confirmado pelo gateway de pagamentos.', false);
          await this.orderRepository.save(order);
        }
        await this.paymentRepository.save(payment);

        SecurityLogger.logPaymentRefunded({
          orderId: payment.orderId,
          paymentId: payment.id,
          refundAmount: payment.grossAmount,
          reason: 'Estorno confirmado via webhook Asaas.',
        });

        if (this.auditLogRepository) {
          const logRes = AuditLog.create({
            entityType: 'PAYMENT',
            entityId: payment.id,
            action: 'PAYMENT_REFUNDED',
            changes: {
              event: dto.event,
              orderId: payment.orderId,
              amount: payment.grossAmount,
              gatewayTransactionId: transactionId,
            },
            reason: 'Estorno de pagamento confirmado via webhook Asaas',
          });
          if (logRes.isSuccess) {
            await this.auditLogRepository.save(logRes.getValue());
          }
        }

        return Result.ok({ processed: true });
      }

      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED': {
        payment.markAsFailed('Pagamento expirado ou cancelado no gateway.');
        if (order) {
          order.cancel('Pagamento expirou antes da confirmação.', false);
          await this.orderRepository.save(order);
        }
        await this.paymentRepository.save(payment);
        return Result.ok({ processed: true });
      }

      default:
        return Result.ok({ processed: false, reason: `Evento não processado: ${dto.event}` });
    }
  }
}
