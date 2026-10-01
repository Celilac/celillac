// backend/src/application/order/ReportOrderNonPaymentUseCase.ts
import { Result } from '../../domain/Result';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IPaymentRepository } from '../../domain/payment/repositories/IPaymentRepository';
import { IReportRepository } from '../../domain/admin/repositories/IReportRepository';
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { IOrderNotificationService } from '../../domain/order/services/IOrderNotificationService';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { Report } from '../../domain/admin/Report';
import { ReportReason } from '../../domain/admin/value-objects/ReportReason';
import { ReportStatus } from '../../domain/admin/value-objects/ReportStatus';
import { OrderStatus } from '../../domain/order/value-objects/OrderStatus';
import { SecurityLogger } from '../../infrastructure/logging/SecurityLogger';

export interface ReportOrderNonPaymentDTO {
  orderId: string;
  partnerUserId: string;
  reason: ReportReason;
  details?: string;
  ip?: string;
  userAgent?: string;
}

export interface ReportOrderNonPaymentOutputDTO {
  reportId: string;
  orderId: string;
  orderStatus: OrderStatus;
  consumerBlockedFromDeliveryPayment: boolean;
  platformFeeWaived: boolean;
}

export class ReportOrderNonPaymentUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly partnerRepository: IPartnerRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly reportRepository: IReportRepository,
    private readonly consumerRepository: IConsumerRepository,
    private readonly notificationService?: IOrderNotificationService,
    private readonly auditLogRepository?: IAuditLogRepository
  ) {}

  async execute(dto: ReportOrderNonPaymentDTO): Promise<Result<ReportOrderNonPaymentOutputDTO>> {
    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) {
      return Result.fail<ReportOrderNonPaymentOutputDTO>('Pedido não encontrado.');
    }

    // 1. Validar que o usuário autenticado é dono do estabelecimento
    const partner = await this.partnerRepository.findById(order.partnerId);
    if (!partner || partner.userId !== dto.partnerUserId) {
      return Result.fail<ReportOrderNonPaymentOutputDTO>(
        'Acesso negado: apenas o parceiro responsável pode reportar ocorrência neste pedido.'
      );
    }

    // 2. Validar que o pedido ainda não foi finalizado ou já cancelado
    if (order.status === OrderStatus.DELIVERED) {
      return Result.fail<ReportOrderNonPaymentOutputDTO>(
        'Não é possível reportar não pagamento para um pedido já entregue e concluído.'
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      return Result.fail<ReportOrderNonPaymentOutputDTO>('Este pedido já foi cancelado anteriormente.');
    }

    // Validar razão
    const validReasons = [
      ReportReason.CLIENT_REFUSED_PAYMENT,
      ReportReason.CLIENT_ABSENT,
      ReportReason.FRAUDULENT_ORDER,
      ReportReason.ADDRESS_UNREACHABLE,
      ReportReason.CLIENT_REQUESTED_CANCELLATION,
      ReportReason.OUT_OF_STOCK,
      ReportReason.OTHER,
    ];
    if (!validReasons.includes(dto.reason)) {
      return Result.fail<ReportOrderNonPaymentOutputDTO>('Motivo de denúncia inválido para entrega.');
    }

    const reasonLabelMap: Record<string, string> = {
      [ReportReason.CLIENT_REFUSED_PAYMENT]: 'Cliente se recusou a pagar na entrega',
      [ReportReason.CLIENT_ABSENT]: 'Cliente ausente / Não atende entregador',
      [ReportReason.FRAUDULENT_ORDER]: 'Pedido fraudulento ou trote',
      [ReportReason.ADDRESS_UNREACHABLE]: 'Endereço incorreto, incompleto ou inacessível',
      [ReportReason.CLIENT_REQUESTED_CANCELLATION]: 'Cliente solicitou o cancelamento do pedido',
      [ReportReason.OUT_OF_STOCK]: 'Item ou ingrediente esgotado no restaurante',
      [ReportReason.OTHER]: 'Outro problema com o cliente ou entrega',
    };
    const cancelReasonText = dto.details
      ? `${reasonLabelMap[dto.reason] || dto.reason}: ${dto.details}`
      : reasonLabelMap[dto.reason] || dto.reason;

    // 3. Cancelar o pedido
    const cancelResult = order.cancel(cancelReasonText, false);
    if (cancelResult.isFailure) {
      return Result.fail<ReportOrderNonPaymentOutputDTO>(cancelResult.getError());
    }
    await this.orderRepository.save(order);

    // 4. Falhar o pagamento e isentar taxa da plataforma CeLiLac
    let platformFeeWaived = false;
    const payment = await this.paymentRepository.findByOrderId(order.id);
    if (payment) {
      payment.markAsFailed(cancelReasonText);
      payment.waivePlatformFee();
      await this.paymentRepository.save(payment);
      platformFeeWaived = true;
    }

    // 5. Criar Report polimórfico
    const reportOrError = Report.create({
      reporterId: dto.partnerUserId,
      partnerId: partner.id,
      targetUserId: order.consumerId,
      orderId: order.id,
      reason: dto.reason,
      details: dto.details,
      isFoodSafetyRisk: false,
      status: ReportStatus.PENDING,
    });

    if (reportOrError.isFailure) {
      return Result.fail<ReportOrderNonPaymentOutputDTO>(reportOrError.getError());
    }
    const report = reportOrError.getValue();
    await this.reportRepository.save(report);

    // 6. Revogar canPayOnDelivery no consumidor apenas em casos de fraude ou recusa direta de pagamento
    let consumerBlocked = false;
    const fraudReasons = [
      ReportReason.CLIENT_REFUSED_PAYMENT,
      ReportReason.CLIENT_ABSENT,
      ReportReason.FRAUDULENT_ORDER,
    ];
    if (fraudReasons.includes(dto.reason)) {
      const consumer = await this.consumerRepository.findByUserId(order.consumerId);
      if (consumer) {
        consumer.revokePayOnDelivery(cancelReasonText);
        await this.consumerRepository.save(consumer);
        consumerBlocked = true;
      }
    }

    // 7. Notificações SSE
    if (this.notificationService) {
      const payload = {
        orderId: order.id,
        partnerId: order.partnerId,
        consumerId: order.consumerId,
        totalAmount: order.totalAmount,
        status: order.status,
        confirmedAt: new Date().toISOString(),
        metadata: {
          cancelReason: cancelReasonText,
          reportId: report.id,
        },
      };
      this.notificationService.notifyOrderStatusChanged(order.consumerId, payload);
      this.notificationService.notifyOrderStatusChanged(order.partnerId, payload);
    }

    // 8. Auditoria & Observabilidade
    SecurityLogger.logOrderPaymentRefusedOnDelivery({
      ip: dto.ip || '127.0.0.1',
      userAgent: dto.userAgent,
      actorId: dto.partnerUserId,
      targetId: order.consumerId,
      orderId: order.id,
      partnerId: partner.id,
      reportId: report.id,
      reason: dto.reason,
      details: dto.details,
      platformFeeWaived,
      consumerBlocked,
    });

    if (this.auditLogRepository) {
      const auditLog = AuditLog.create({
        entityType: 'ORDER',
        entityId: order.id,
        action: 'ORDER_PAYMENT_REFUSED_ON_DELIVERY',
        actorId: dto.partnerUserId,
        actorRole: 'PARTNER',
        changes: {
          orderStatus: order.status,
          reportId: report.id,
          reason: dto.reason,
          consumerId: order.consumerId,
          consumerBlocked,
          platformFeeWaived,
        },
        reason: cancelReasonText,
      });
      if (auditLog.isSuccess) {
        await this.auditLogRepository.save(auditLog.getValue());
      }
    }

    return Result.ok<ReportOrderNonPaymentOutputDTO>({
      reportId: report.id,
      orderId: order.id,
      orderStatus: order.status,
      consumerBlockedFromDeliveryPayment: consumerBlocked,
      platformFeeWaived,
    });
  }
}
