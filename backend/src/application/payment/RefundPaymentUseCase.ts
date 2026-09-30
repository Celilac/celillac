// backend/src/application/payment/RefundPaymentUseCase.ts
import { Result } from '../../domain/Result';
import { IPaymentRepository } from '../../domain/payment/repositories/IPaymentRepository';
import { IPaymentRefundRepository } from '../../domain/payment/repositories/IPaymentRefundRepository';
import { IPaymentGateway } from '../../domain/payment/services/IPaymentGateway';
import { PaymentRefund } from '../../domain/payment/entities/PaymentRefund';
import { PaymentStatus } from '../../domain/payment/value-objects/PaymentStatus';

export interface RefundPaymentDTO {
  paymentId: string;
  reason: string;
  amount?: number;
}

export class RefundPaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly refundRepository: IPaymentRefundRepository,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(dto: RefundPaymentDTO): Promise<Result<PaymentRefund>> {
    const payment = await this.paymentRepository.findById(dto.paymentId);
    if (!payment) {
      return Result.fail<PaymentRefund>('Transação de pagamento não encontrada.');
    }

    if (payment.status !== PaymentStatus.PAID) {
      return Result.fail<PaymentRefund>('Apenas pagamentos confirmados podem ser estornados.');
    }

    if (!payment.gatewayTransactionId) {
      return Result.fail<PaymentRefund>('Transação não possui identificador do gateway para estorno.');
    }

    const refundAmount = dto.amount ?? payment.grossAmount;

    // Disparar estorno no gateway Asaas
    const gatewayRes = await this.paymentGateway.refundCharge({
      gatewayTransactionId: payment.gatewayTransactionId,
      refundAmount,
      reason: dto.reason,
    });

    if (gatewayRes.isFailure) {
      return Result.fail<PaymentRefund>(`Falha no gateway ao processar estorno: ${gatewayRes.getError()}`);
    }

    const refund = PaymentRefund.create({
      paymentId: payment.id,
      gatewayRefundId: gatewayRes.getValue().gatewayRefundId,
      refundAmount,
      reason: dto.reason,
      status: 'COMPLETED',
    }).getValue();

    payment.markAsRefunded();

    await this.refundRepository.save(refund);
    await this.paymentRepository.save(payment);

    return Result.ok<PaymentRefund>(refund);
  }
}
