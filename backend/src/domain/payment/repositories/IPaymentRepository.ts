// backend/src/domain/payment/repositories/IPaymentRepository.ts
import { Payment } from '../entities/Payment';

export interface IPaymentRepository {
  save(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByGatewayTransactionId(gatewayTransactionId: string): Promise<Payment | null>;
}
