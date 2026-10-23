// backend/src/infrastructure/database/order/PgOrderRepository.ts
import { Pool } from 'pg';
import { IOrderRepository } from '../../../domain/order/repositories/IOrderRepository';
import { Order } from '../../../domain/order/entities/Order';
import { OrderItem } from '../../../domain/order/entities/OrderItem';
import { OrderStatus } from '../../../domain/order/value-objects/OrderStatus';

export class PgOrderRepository implements IOrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query('SELECT id FROM orders WHERE id = $1', [order.id]);

      if (existing.rows.length === 0) {
        // Insert order
        await client.query(
          `INSERT INTO orders (
            id, consumer_id, partner_id, status, subtotal_amount, delivery_fee,
            total_amount, allergen_check_verdict, notes, cancelled_at, cancel_reason,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            order.id,
            order.consumerId,
            order.partnerId,
            order.status,
            order.subtotalAmount,
            order.deliveryFee,
            order.totalAmount,
            order.allergenCheckVerdict,
            order.notes || null,
            order.cancelledAt || null,
            order.cancelReason || null,
            order.createdAt,
            order.updatedAt,
          ]
        );

        // Insert items
        for (const item of order.items) {
          await client.query(
            `INSERT INTO order_items (
              id, order_id, product_id, product_name, unit_price, quantity, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              item.id,
              order.id,
              item.productId,
              item.productName,
              item.unitPrice,
              item.quantity,
              item.totalPrice,
            ]
          );
        }
      } else {
        // Update order
        await client.query(
          `UPDATE orders SET
            status = $2,
            subtotal_amount = $3,
            delivery_fee = $4,
            total_amount = $5,
            allergen_check_verdict = $6,
            notes = $7,
            cancelled_at = $8,
            cancel_reason = $9,
            updated_at = $10
          WHERE id = $1`,
          [
            order.id,
            order.status,
            order.subtotalAmount,
            order.deliveryFee,
            order.totalAmount,
            order.allergenCheckVerdict,
            order.notes || null,
            order.cancelledAt || null,
            order.cancelReason || null,
            order.updatedAt,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Order | null> {
    const orderRes = await this.pool.query(
      `SELECT o.*, p.method AS payment_method, p.change_for
       FROM orders o
       LEFT JOIN (
         SELECT DISTINCT ON (order_id) order_id, method, change_for
         FROM payments ORDER BY order_id, created_at DESC
       ) p ON p.order_id = o.id
       WHERE o.id = $1`,
      [id]
    );
    if (orderRes.rows.length === 0) {
      return null;
    }

    const itemsRes = await this.pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    return this.mapRowToOrder(orderRes.rows[0], itemsRes.rows);
  }

  async findByConsumerId(consumerId: string): Promise<Order[]> {
    const orderRes = await this.pool.query(
      `SELECT o.*, p.method AS payment_method, p.change_for
       FROM orders o
       LEFT JOIN (
         SELECT DISTINCT ON (order_id) order_id, method, change_for
         FROM payments ORDER BY order_id, created_at DESC
       ) p ON p.order_id = o.id
       WHERE o.consumer_id = $1
       ORDER BY o.created_at DESC`,
      [consumerId]
    );

    if (orderRes.rows.length === 0) {
      return [];
    }

    const orderIds = orderRes.rows.map((r) => r.id);
    const itemsRes = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = ANY($1::uuid[])',
      [orderIds]
    );

    return this.assembleOrders(orderRes.rows, itemsRes.rows);
  }

  async findByPartnerId(partnerId: string): Promise<Order[]> {
    const orderRes = await this.pool.query(
      `SELECT o.*, p.method AS payment_method, p.change_for
       FROM orders o
       LEFT JOIN (
         SELECT DISTINCT ON (order_id) order_id, method, change_for
         FROM payments ORDER BY order_id, created_at DESC
       ) p ON p.order_id = o.id
       WHERE o.partner_id = $1
       ORDER BY o.created_at DESC`,
      [partnerId]
    );

    if (orderRes.rows.length === 0) {
      return [];
    }

    const orderIds = orderRes.rows.map((r) => r.id);
    const itemsRes = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = ANY($1::uuid[])',
      [orderIds]
    );

    return this.assembleOrders(orderRes.rows, itemsRes.rows);
  }

  async findPendingExpired(partnerTimeoutMinutes: number, paymentTimeoutMinutes: number): Promise<Order[]> {
    const orderRes = await this.pool.query(
      `SELECT o.*, p.method AS payment_method, p.change_for
       FROM orders o
       LEFT JOIN (
         SELECT DISTINCT ON (order_id) order_id, method, change_for
         FROM payments ORDER BY order_id, created_at DESC
       ) p ON p.order_id = o.id
       WHERE (
         (
           (o.status = 'PAID' OR (o.status IN ('CREATED', 'AWAITING_PAYMENT') AND p.method IN ('CASH_ON_DELIVERY', 'CARD_ON_DELIVERY')))
           AND COALESCE(o.updated_at, o.created_at) <= (NOW() - ($1 * INTERVAL '1 minute'))
         )
         OR
         (
           o.status IN ('CREATED', 'AWAITING_PAYMENT')
           AND (p.method IS NULL OR p.method NOT IN ('CASH_ON_DELIVERY', 'CARD_ON_DELIVERY'))
           AND COALESCE(o.updated_at, o.created_at) <= (NOW() - ($2 * INTERVAL '1 minute'))
         )
       )
       ORDER BY o.created_at ASC`,
      [partnerTimeoutMinutes, paymentTimeoutMinutes]
    );

    if (orderRes.rows.length === 0) {
      return [];
    }

    const orderIds = orderRes.rows.map((r) => r.id);
    const itemsRes = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = ANY($1::uuid[])',
      [orderIds]
    );

    return this.assembleOrders(orderRes.rows, itemsRes.rows);
  }

  private assembleOrders(orderRows: any[], itemRows: any[]): Order[] {
    const itemsByOrderId = new Map<string, any[]>();
    for (const itemRow of itemRows) {
      const list = itemsByOrderId.get(itemRow.order_id) || [];
      list.push(itemRow);
      itemsByOrderId.set(itemRow.order_id, list);
    }

    const orders: Order[] = [];
    for (const orderRow of orderRows) {
      const items = itemsByOrderId.get(orderRow.id) || [];
      const order = this.mapRowToOrder(orderRow, items);
      if (order) orders.push(order);
    }

    return orders;
  }

  private mapRowToOrder(orderRow: any, itemRows: any[]): Order | null {
    const orderItems: OrderItem[] = [];

    for (const row of itemRows) {
      const itemResult = OrderItem.create(
        {
          orderId: row.order_id,
          productId: row.product_id,
          productName: row.product_name,
          unitPrice: parseFloat(row.unit_price),
          quantity: parseInt(row.quantity, 10),
          totalPrice: parseFloat(row.total_price),
        },
        row.id
      );

      if (itemResult.isSuccess) {
        orderItems.push(itemResult.getValue());
      }
    }

    const orderResult = Order.create(
      {
        consumerId: orderRow.consumer_id,
        partnerId: orderRow.partner_id,
        status: orderRow.status as OrderStatus,
        items: orderItems,
        deliveryFee: parseFloat(orderRow.delivery_fee),
        allergenCheckVerdict: orderRow.allergen_check_verdict as 'SAFE' | 'WARNING',
        notes: orderRow.notes || undefined,
        paymentMethod: orderRow.payment_method || undefined,
        changeFor: orderRow.change_for ? parseFloat(orderRow.change_for) : undefined,
        cancelledAt: orderRow.cancelled_at ? new Date(orderRow.cancelled_at) : undefined,
        cancelReason: orderRow.cancel_reason || undefined,
        createdAt: new Date(orderRow.created_at),
        updatedAt: new Date(orderRow.updated_at),
      },
      orderRow.id
    );

    return orderResult.isSuccess ? orderResult.getValue() : null;
  }
}
