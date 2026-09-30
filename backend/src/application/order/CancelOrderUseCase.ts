// backend/src/application/order/CancelOrderUseCase.ts
import { Result } from '../../domain/Result';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IPaymentRepository } from '../../domain/payment/repositories/IPaymentRepository';
import { RefundPaymentUseCase } from '../payment/RefundPaymentUseCase';
import { PaymentStatus } from '../../domain/payment/value-objects/PaymentStatus';

export interface CancelOrderDTO {
  orderId: string;
  userId: string;
  userRole: string; // 'CELIACO' | 'PARCEIRO' | 'ADMIN'
  reason: string;
}

export interface CancelOrderOutputDTO {
  orderId: string;
  status: string;
  requiresRefund: boolean;
  cancelReason: string;
}

export class CancelOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly partnerRepository: IPartnerRepository,
    private readonly paymentRepository?: IPaymentRepository,
    private readonly refundPaymentUseCase?: RefundPaymentUseCase
  ) {}

  async execute(dto: CancelOrderDTO): Promise<Result<CancelOrderOutputDTO>> {
    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) {
      return Result.fail<CancelOrderOutputDTO>('Pedido não encontrado.');
    }

    let isRequestedByConsumer = false;

    if (dto.userRole === 'CELIACO') {
      if (order.consumerId !== dto.userId) {
        return Result.fail<CancelOrderOutputDTO>('Acesso negado: você só pode cancelar seus próprios pedidos.');
      }
      isRequestedByConsumer = true;
    } else if (dto.userRole === 'PARCEIRO') {
      const partner = await this.partnerRepository.findById(order.partnerId);
      if (!partner || partner.userId !== dto.userId) {
        return Result.fail<CancelOrderOutputDTO>('Acesso negado: você só pode cancelar pedidos do seu estabelecimento.');
      }
      isRequestedByConsumer = false;
    } else if (dto.userRole !== 'ADMIN') {
      return Result.fail<CancelOrderOutputDTO>('Acesso negado.');
    }

    const cancelResult = order.cancel(dto.reason, isRequestedByConsumer);
    if (cancelResult.isFailure) {
      return Result.fail<CancelOrderOutputDTO>(cancelResult.getError());
    }

    const requiresRefund = cancelResult.getValue().requiresRefund;

    // Disparo coordenado de estorno no gateway de pagamento quando elegível
    if (requiresRefund && this.paymentRepository && this.refundPaymentUseCase) {
      const payment = await this.paymentRepository.findByOrderId(order.id);
      if (payment && payment.status === PaymentStatus.PAID) {
        const refundResult = await this.refundPaymentUseCase.execute({
          paymentId: payment.id,
          reason: dto.reason || 'Cancelamento do pedido antes do início do preparo.',
        });

        if (refundResult.isFailure) {
          return Result.fail<CancelOrderOutputDTO>(
            `Falha ao processar estorno automático no gateway: ${refundResult.getError()}`
          );
        }
      }
    }

    await this.orderRepository.save(order);

    return Result.ok<CancelOrderOutputDTO>({
      orderId: order.id,
      status: order.status,
      requiresRefund,
      cancelReason: order.cancelReason || dto.reason,
    });
  }
}
