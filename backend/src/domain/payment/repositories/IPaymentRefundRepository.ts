// backend/src/domain/payment/repositories/IPaymentRefundRepository.ts
import { PaymentRefund } from '../entities/PaymentRefund';

export interface IPaymentRefundRepository {
  save(refund: PaymentRefund): Promise<void>;
  findById(id: string): Promise<PaymentRefund | null>;
  findByPaymentId(paymentId: string): Promise<PaymentRefund[]>;
}
