// backend/src/application/order/ListConsumerOrdersUseCase.ts
import { Result } from '../../domain/Result';
import { Order } from '../../domain/order/entities/Order';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';

export class ListConsumerOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(consumerId: string): Promise<Result<Order[]>> {
    if (!consumerId || consumerId.trim() === '') {
      return Result.fail<Order[]>('ID do consumidor é obrigatório.');
    }
    const orders = await this.orderRepository.findByConsumerId(consumerId);
    return Result.ok<Order[]>(orders);
  }
}
