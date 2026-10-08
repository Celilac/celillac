// backend/src/domain/order/value-objects/OrderExpirationPolicy.ts
import { OrderStatus } from './OrderStatus';
import { Order } from '../entities/Order';

export interface OrderExpirationEvaluation {
  isExpired: boolean;
  reason?: string;
  type?: 'PARTNER_TIMEOUT' | 'PAYMENT_TIMEOUT';
}

export class OrderExpirationPolicy {
  public static readonly DEFAULT_PARTNER_TIMEOUT_MINUTES = 15;
  public static readonly DEFAULT_PAYMENT_TIMEOUT_MINUTES = 10;

  public static readonly REASON_PARTNER_TIMEOUT =
    'Cancelamento automático: Estabelecimento não respondeu dentro do prazo limite (15 min).';

  public static readonly REASON_PAYMENT_TIMEOUT =
    'Cancelamento automático: Prazo para seleção e conclusão do pagamento expirou (10 min).';

  /**
   * Avalia se um pedido está expirado por inação do parceiro comercial
   * ou por demora do cliente na seleção/conclusão do pagamento.
   */
  public static evaluate(
    order: Order,
    partnerTimeoutMinutes: number = OrderExpirationPolicy.DEFAULT_PARTNER_TIMEOUT_MINUTES,
    paymentTimeoutMinutes: number = OrderExpirationPolicy.DEFAULT_PAYMENT_TIMEOUT_MINUTES,
    now: Date = new Date()
  ): OrderExpirationEvaluation {
    const status = order.status;

    // Pedidos já finalizados ou já cancelados não expiram
    if (
      status === OrderStatus.DELIVERED ||
      status === OrderStatus.CANCELLED ||
      status === OrderStatus.CONFIRMED ||
      status === OrderStatus.PREPARING ||
      status === OrderStatus.READY_FOR_PICKUP ||
      status === OrderStatus.OUT_FOR_DELIVERY
    ) {
      return { isExpired: false };
    }

    const partnerTimeoutMs = partnerTimeoutMinutes * 60 * 1000;
    const paymentTimeoutMs = paymentTimeoutMinutes * 60 * 1000;
    const nowTime = now.getTime();

    // 1. Cenário: Pedido pago online ou com pagamento na entrega já selecionado aguardando aceite do parceiro
    // Se o pedido está PAID, ele está 100% nas mãos do parceiro aceitar.
    if (status === OrderStatus.PAID) {
      const referenceTime = order.updatedAt ? order.updatedAt.getTime() : order.createdAt.getTime();
      if (nowTime - referenceTime >= partnerTimeoutMs) {
        return {
          isExpired: true,
          type: 'PARTNER_TIMEOUT',
          reason: `Cancelamento automático: Estabelecimento não respondeu dentro do prazo limite (${partnerTimeoutMinutes} min).`,
        };
      }
      return { isExpired: false };
    }

    // Se o pedido possui pagamento na entrega (CASH_ON_DELIVERY ou CARD_ON_DELIVERY),
    // ele já foi submetido pelo cliente e está aguardando o parceiro aceitar na cozinha.
    const isDeliveryPayment =
      order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod === 'CARD_ON_DELIVERY';

    if (isDeliveryPayment && (status === OrderStatus.CREATED || status === OrderStatus.AWAITING_PAYMENT)) {
      const referenceTime = order.updatedAt ? order.updatedAt.getTime() : order.createdAt.getTime();
      if (nowTime - referenceTime >= partnerTimeoutMs) {
        return {
          isExpired: true,
          type: 'PARTNER_TIMEOUT',
          reason: `Cancelamento automático: Estabelecimento não respondeu dentro do prazo limite (${partnerTimeoutMinutes} min).`,
        };
      }
      return { isExpired: false };
    }

    // 2. Cenário: Pedido em aberto sem seleção/conclusão de pagamento pelo cliente (CREATED ou AWAITING_PAYMENT online)
    if (status === OrderStatus.CREATED || status === OrderStatus.AWAITING_PAYMENT) {
      const referenceTime = order.updatedAt ? order.updatedAt.getTime() : order.createdAt.getTime();
      if (nowTime - referenceTime >= paymentTimeoutMs) {
        return {
          isExpired: true,
          type: 'PAYMENT_TIMEOUT',
          reason: `Cancelamento automático: Prazo para seleção e conclusão do pagamento expirou (${paymentTimeoutMinutes} min).`,
        };
      }
    }

    return { isExpired: false };
  }
}
