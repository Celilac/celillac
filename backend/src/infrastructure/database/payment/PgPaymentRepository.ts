// backend/src/infrastructure/database/payment/PgPaymentRepository.ts
import { Pool } from 'pg';
import { IPaymentRepository } from '../../../domain/payment/repositories/IPaymentRepository';
import { Payment } from '../../../domain/payment/entities/Payment';
import { PaymentMethod, PaymentStatus } from '../../../domain/payment/value-objects/PaymentStatus';

export class PgPaymentRepository implements IPaymentRepository {
  constructor(private readonly pool: Pool) {}

  async save(payment: Payment): Promise<void> {
    const existing = await this.pool.query('SELECT id FROM payments WHERE id = $1', [payment.id]);

    if (existing.rows.length === 0) {
      await this.pool.query(
        `INSERT INTO payments (
          id, order_id, consumer_id, partner_id, gateway, gateway_transaction_id,
          method, status, gross_amount, net_partner_amount, platform_fee_amount,
          pix_qr_code, pix_copy_paste, pix_expires_at, paid_at, failure_reason,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          payment.id,
          payment.orderId,
          payment.consumerId,
          payment.partnerId,
          payment.gateway,
          payment.gatewayTransactionId || null,
          payment.method,
          payment.status,
          payment.grossAmount,
          payment.netPartnerAmount,
          payment.platformFeeAmount,
          payment.pixQrCode || null,
          payment.pixCopyPaste || null,
          payment.pixExpiresAt || null,
          payment.paidAt || null,
          payment.failureReason || null,
          payment.createdAt,
          payment.updatedAt,
        ]
      );
    } else {
      await this.pool.query(
        `UPDATE payments SET
          gateway_transaction_id = $2,
          status = $3,
          pix_qr_code = $4,
          pix_copy_paste = $5,
          pix_expires_at = $6,
          paid_at = $7,
          failure_reason = $8,
          updated_at = $9
        WHERE id = $1`,
        [
          payment.id,
          payment.gatewayTransactionId || null,
          payment.status,
          payment.pixQrCode || null,
          payment.pixCopyPaste || null,
          payment.pixExpiresAt || null,
          payment.paidAt || null,
          payment.failureReason || null,
          payment.updatedAt,
        ]
      );
    }
  }

  async findById(id: string): Promise<Payment | null> {
    const res = await this.pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToPayment(res.rows[0]);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const res = await this.pool.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [orderId]);
    if (res.rows.length === 0) return null;
    return this.mapRowToPayment(res.rows[0]);
  }

  async findByGatewayTransactionId(gatewayTransactionId: string): Promise<Payment | null> {
    const res = await this.pool.query('SELECT * FROM payments WHERE gateway_transaction_id = $1 LIMIT 1', [gatewayTransactionId]);
    if (res.rows.length === 0) return null;
    return this.mapRowToPayment(res.rows[0]);
  }

  private mapRowToPayment(row: any): Payment | null {
    const result = Payment.create(
      {
        orderId: row.order_id,
        consumerId: row.consumer_id,
        partnerId: row.partner_id,
        gateway: row.gateway,
        gatewayTransactionId: row.gateway_transaction_id || undefined,
        method: row.method as PaymentMethod,
        subtotalAmount: parseFloat(row.gross_amount) - parseFloat(row.platform_fee_amount), // compatibilidade
        status: row.status as PaymentStatus,
        pixQrCode: row.pix_qr_code || undefined,
        pixCopyPaste: row.pix_copy_paste || undefined,
        pixExpiresAt: row.pix_expires_at ? new Date(row.pix_expires_at) : undefined,
        paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
        failureReason: row.failure_reason || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    );

    return result.isSuccess ? result.getValue() : null;
  }
}
