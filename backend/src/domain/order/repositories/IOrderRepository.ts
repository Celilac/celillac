// backend/src/domain/order/repositories/IOrderRepository.ts
import { Order } from '../entities/Order';

export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByConsumerId(consumerId: string): Promise<Order[]>;
  findByPartnerId(partnerId: string): Promise<Order[]>;
  findPendingExpired(partnerTimeoutMinutes: number, paymentTimeoutMinutes: number): Promise<Order[]>;
}
