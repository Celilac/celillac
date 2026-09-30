// backend/src/application/order/GetOrderUseCase.ts
import { Result } from '../../domain/Result';
import { Order } from '../../domain/order/entities/Order';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';

export interface GetOrderDTO {
  orderId: string;
  userId: string;
  userRole: string;
}

export class GetOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly partnerRepository: IPartnerRepository
  ) {}

  async execute(dto: GetOrderDTO): Promise<Result<Order>> {
    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) {
      return Result.fail<Order>('Pedido não encontrado.');
    }

    if (dto.userRole === 'CELIACO' && order.consumerId !== dto.userId) {
      return Result.fail<Order>('Acesso negado: este pedido não pertence a você.');
    }

    if (dto.userRole === 'PARCEIRO') {
      const partner = await this.partnerRepository.findById(order.partnerId);
      if (!partner || partner.userId !== dto.userId) {
        return Result.fail<Order>('Acesso negado: este pedido não pertence ao seu estabelecimento.');
      }
    }

    return Result.ok<Order>(order);
  }
}
