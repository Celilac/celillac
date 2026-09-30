// backend/src/application/order/UpdateOrderStatusUseCase.ts
import { Result } from '../../domain/Result';
import { Order } from '../../domain/order/entities/Order';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IOrderNotificationService } from '../../domain/order/services/IOrderNotificationService';

export type OrderStatusAction =
  | 'CONFIRM'
  | 'START_PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVER';

export interface UpdateOrderStatusDTO {
  orderId: string;
  userId: string;
  userRole: string;
  action: OrderStatusAction;
}

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly partnerRepository: IPartnerRepository,
    private readonly notificationService?: IOrderNotificationService
  ) {}

  async execute(dto: UpdateOrderStatusDTO): Promise<Result<Order>> {
    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) {
      return Result.fail<Order>('Pedido não encontrado.');
    }

    if (dto.userRole !== 'ADMIN') {
      const partner = await this.partnerRepository.findById(order.partnerId);
      if (!partner || partner.userId !== dto.userId) {
        return Result.fail<Order>('Acesso negado: apenas o parceiro responsável pode atualizar o status deste pedido.');
      }
    }

    let transitionResult: Result<void>;

    switch (dto.action) {
      case 'CONFIRM':
        transitionResult = order.confirm();
        break;
      case 'START_PREPARING':
        transitionResult = order.startPreparing();
        break;
      case 'READY_FOR_PICKUP':
        transitionResult = order.markReadyForPickup();
        break;
      case 'OUT_FOR_DELIVERY':
        transitionResult = order.markOutForDelivery();
        break;
      case 'DELIVER':
        transitionResult = order.markDelivered();
        break;
      default:
        return Result.fail<Order>('Ação de status inválida.');
    }

    if (transitionResult.isFailure) {
      return Result.fail<Order>(transitionResult.getError());
    }

    await this.orderRepository.save(order);

    if (this.notificationService) {
      const payload = {
        orderId: order.id,
        partnerId: order.partnerId,
        consumerId: order.consumerId,
        totalAmount: order.totalAmount,
        status: order.status,
        confirmedAt: new Date().toISOString(),
      };
      this.notificationService.notifyOrderStatusChanged(order.consumerId, payload);
      this.notificationService.notifyOrderStatusChanged(order.partnerId, payload);
    }

    return Result.ok<Order>(order);
  }
}
