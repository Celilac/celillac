// backend/src/infrastructure/database/payment/PgPaymentRefundRepository.ts
import { Pool } from 'pg';
import { IPaymentRefundRepository } from '../../../domain/payment/repositories/IPaymentRefundRepository';
import { PaymentRefund } from '../../../domain/payment/entities/PaymentRefund';

export class PgPaymentRefundRepository implements IPaymentRefundRepository {
  constructor(private readonly pool: Pool) {}

  async save(refund: PaymentRefund): Promise<void> {
    const existing = await this.pool.query('SELECT id FROM payment_refunds WHERE id = $1', [refund.id]);

    if (existing.rows.length === 0) {
      await this.pool.query(
        `INSERT INTO payment_refunds (id, payment_id, gateway_refund_id, refund_amount, reason, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          refund.id,
          refund.paymentId,
          refund.gatewayRefundId || null,
          refund.refundAmount,
          refund.reason,
          refund.status,
          refund.createdAt,
        ]
      );
    } else {
      await this.pool.query(
        `UPDATE payment_refunds SET
           gateway_refund_id = $2,
           status = $3
         WHERE id = $1`,
        [refund.id, refund.gatewayRefundId || null, refund.status]
      );
    }
  }

  async findById(id: string): Promise<PaymentRefund | null> {
    const res = await this.pool.query('SELECT * FROM payment_refunds WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToRefund(res.rows[0]);
  }

  async findByPaymentId(paymentId: string): Promise<PaymentRefund[]> {
    const res = await this.pool.query(
      'SELECT * FROM payment_refunds WHERE payment_id = $1 ORDER BY created_at DESC',
      [paymentId]
    );
    return res.rows.map((row) => this.mapRowToRefund(row)).filter(Boolean) as PaymentRefund[];
  }

  private mapRowToRefund(row: any): PaymentRefund | null {
    const result = PaymentRefund.create(
      {
        paymentId: row.payment_id,
        gatewayRefundId: row.gateway_refund_id || undefined,
        refundAmount: parseFloat(row.refund_amount),
        reason: row.reason,
        status: row.status,
        createdAt: new Date(row.created_at),
      },
      row.id
    );

    return result.isSuccess ? result.getValue() : null;
  }
}
