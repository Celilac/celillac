// backend/src/application/payment/HandleAsaasWebhookUseCase.ts
import { Result } from '../../domain/Result';
import { IPaymentRepository } from '../../domain/payment/repositories/IPaymentRepository';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';

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
    private readonly orderRepository: IOrderRepository
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
        return Result.ok({ processed: true });
      }

      case 'PAYMENT_REFUNDED': {
        payment.markAsRefunded();
        if (order) {
          order.cancel('Estorno confirmado pelo gateway de pagamentos.', false);
          await this.orderRepository.save(order);
        }
        await this.paymentRepository.save(payment);
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
