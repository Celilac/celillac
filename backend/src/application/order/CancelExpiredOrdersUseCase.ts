// backend/src/application/order/CancelExpiredOrdersUseCase.ts
import { Result } from '../../domain/Result';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IPaymentRepository } from '../../domain/payment/repositories/IPaymentRepository';
import { RefundPaymentUseCase } from '../payment/RefundPaymentUseCase';
import { PaymentStatus } from '../../domain/payment/value-objects/PaymentStatus';
import { IOrderNotificationService } from '../../domain/order/services/IOrderNotificationService';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { OrderExpirationPolicy } from '../../domain/order/value-objects/OrderExpirationPolicy';

export interface CancelExpiredOrdersDTO {
  partnerTimeoutMinutes?: number;
  paymentTimeoutMinutes?: number;
  now?: Date;
}

export interface ExpiredOrderSummary {
  orderId: string;
  previousStatus: string;
  cancelReason: string;
  refundProcessed: boolean;
}

export interface CancelExpiredOrdersOutputDTO {
  processedCount: number;
  cancelledOrders: ExpiredOrderSummary[];
}

export class CancelExpiredOrdersUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly paymentRepository?: IPaymentRepository,
    private readonly refundPaymentUseCase?: RefundPaymentUseCase,
    private readonly notificationService?: IOrderNotificationService,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  async execute(dto: CancelExpiredOrdersDTO = {}): Promise<Result<CancelExpiredOrdersOutputDTO>> {
    const partnerTimeout =
      dto.partnerTimeoutMinutes ?? OrderExpirationPolicy.DEFAULT_PARTNER_TIMEOUT_MINUTES;
    const paymentTimeout =
      dto.paymentTimeoutMinutes ?? OrderExpirationPolicy.DEFAULT_PAYMENT_TIMEOUT_MINUTES;
    const now = dto.now ?? new Date();

    const pendingOrders = await this.orderRepository.findPendingExpired(partnerTimeout, paymentTimeout);

    const cancelledOrders: ExpiredOrderSummary[] = [];

    for (const order of pendingOrders) {
      const evaluation = OrderExpirationPolicy.evaluate(order, partnerTimeout, paymentTimeout, now);

      if (!evaluation.isExpired || !evaluation.reason) {
        continue;
      }

      const previousStatus = order.status;
      const cancelResult = order.cancel(evaluation.reason, false, true);

      if (cancelResult.isFailure) {
        continue;
      }

      const requiresRefund = cancelResult.getValue().requiresRefund;
      let refundProcessed = false;

      // Dispara estorno automático caso o pedido estivesse pago (PAID)
      if (requiresRefund && this.paymentRepository && this.refundPaymentUseCase) {
        try {
          const payment = await this.paymentRepository.findByOrderId(order.id);
          if (payment && payment.status === PaymentStatus.PAID) {
            const refundRes = await this.refundPaymentUseCase.execute({
              paymentId: payment.id,
              reason: evaluation.reason,
            });
            if (refundRes.isSuccess) {
              refundProcessed = true;
            } else {
              console.error(
                `[CancelExpiredOrdersUseCase] Falha no estorno do pedido ${order.id}:`,
                refundRes.getError()
              );
            }
          }
        } catch (refundErr) {
          console.error(`[CancelExpiredOrdersUseCase] Erro ao processar estorno para ${order.id}:`, refundErr);
        }
      }

      // Salva o pedido cancelado
      await this.orderRepository.save(order);

      // Registra auditoria
      if (this.auditLogRepository) {
        try {
          const logRes = AuditLog.create({
            entityType: 'ORDER',
            entityId: order.id,
            action: 'ORDER_AUTO_CANCELLED_TIMEOUT',
            actorId: 'SYSTEM',
            actorRole: 'SYSTEM',
            changes: {
              previousStatus,
              status: order.status,
              cancelReason: order.cancelReason,
              type: evaluation.type,
              refundProcessed,
            },
            reason: evaluation.reason,
          });
          if (logRes.isSuccess) {
            await this.auditLogRepository.save(logRes.getValue());
          }
        } catch (auditErr) {
          console.error(`[CancelExpiredOrdersUseCase] Erro ao gravar log de auditoria:`, auditErr);
        }
      }

      // Notifica consumidor e parceiro via SSE em tempo real
      if (this.notificationService) {
        try {
          const payload = {
            orderId: order.id,
            partnerId: order.partnerId,
            consumerId: order.consumerId,
            totalAmount: order.totalAmount,
            status: order.status,
            confirmedAt: order.cancelledAt?.toISOString() || new Date().toISOString(),
            metadata: {
              cancelReason: order.cancelReason,
            },
          };
          this.notificationService.notifyOrderStatusChanged(order.consumerId, payload);
          this.notificationService.notifyOrderStatusChanged(order.partnerId, payload);
        } catch (notifErr) {
          console.error(`[CancelExpiredOrdersUseCase] Erro ao emitir notificação SSE:`, notifErr);
        }
      }

      cancelledOrders.push({
        orderId: order.id,
        previousStatus,
        cancelReason: evaluation.reason,
        refundProcessed,
      });
    }

    return Result.ok<CancelExpiredOrdersOutputDTO>({
      processedCount: cancelledOrders.length,
      cancelledOrders,
    });
  }
}
