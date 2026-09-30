// backend/src/domain/order/value-objects/OrderStatus.ts

export enum OrderStatus {
  CREATED = 'CREATED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class OrderCancellationPolicy {
  /**
   * O celíaco só pode cancelar unilateralmente com estorno automático
   * se o parceiro ainda NÃO tiver confirmado ou iniciado o preparo do pedido.
   */
  public static canConsumerCancel(status: OrderStatus): boolean {
    return [
      OrderStatus.CREATED,
      OrderStatus.AWAITING_PAYMENT,
      OrderStatus.PAID,
    ].includes(status);
  }

  /**
   * Verifica se o cancelamento requer reembolso financeiro
   * (isto é, se o pagamento já havia sido capturado).
   */
  public static requiresRefund(status: OrderStatus): boolean {
    return status === OrderStatus.PAID;
  }
}
