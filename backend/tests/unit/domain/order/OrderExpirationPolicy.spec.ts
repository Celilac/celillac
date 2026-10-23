// backend/tests/unit/domain/order/OrderExpirationPolicy.spec.ts
import { Order } from '../../../../src/domain/order/entities/Order';
import { OrderItem } from '../../../../src/domain/order/entities/OrderItem';
import { OrderStatus } from '../../../../src/domain/order/value-objects/OrderStatus';
import { OrderExpirationPolicy } from '../../../../src/domain/order/value-objects/OrderExpirationPolicy';

describe('OrderExpirationPolicy & System Auto-Cancellation Domain Tests', () => {
  const createTestOrder = (
    status: OrderStatus = OrderStatus.CREATED,
    minutesAgo: number = 0,
    paymentMethod?: string
  ): Order => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: 'Pão de Queijo',
      unitPrice: 10,
      quantity: 1,
    }).getValue();

    const pastDate = new Date(Date.now() - minutesAgo * 60 * 1000);

    const orderRes = Order.create({
      consumerId: 'user-1',
      partnerId: 'partner-1',
      items: [item],
      allergenCheckVerdict: 'SAFE',
      status,
      paymentMethod,
      createdAt: pastDate,
      updatedAt: pastDate,
    });

    return orderRes.getValue();
  };

  describe('OrderExpirationPolicy.evaluate', () => {
    it('não deve expirar pedidos já entregues, confirmados ou em preparo', () => {
      const delivered = createTestOrder(OrderStatus.DELIVERED, 60);
      expect(OrderExpirationPolicy.evaluate(delivered).isExpired).toBe(false);

      const confirmed = createTestOrder(OrderStatus.CONFIRMED, 60);
      expect(OrderExpirationPolicy.evaluate(confirmed).isExpired).toBe(false);

      const preparing = createTestOrder(OrderStatus.PREPARING, 60);
      expect(OrderExpirationPolicy.evaluate(preparing).isExpired).toBe(false);

      const cancelled = createTestOrder(OrderStatus.CANCELLED, 60);
      expect(OrderExpirationPolicy.evaluate(cancelled).isExpired).toBe(false);
    });

    it('deve expirar pedido pago (PAID) se o parceiro não responder em 15 minutos (PARTNER_TIMEOUT)', () => {
      const paidOrderExpired = createTestOrder(OrderStatus.PAID, 16);
      const evalExpired = OrderExpirationPolicy.evaluate(paidOrderExpired);
      expect(evalExpired.isExpired).toBe(true);
      expect(evalExpired.type).toBe('PARTNER_TIMEOUT');
      expect(evalExpired.reason).toContain('Estabelecimento não respondeu');

      const paidOrderRecent = createTestOrder(OrderStatus.PAID, 14);
      const evalRecent = OrderExpirationPolicy.evaluate(paidOrderRecent);
      expect(evalRecent.isExpired).toBe(false);
    });

    it('deve expirar pedido com pagamento na entrega aguardando confirmação do parceiro após 15 minutos', () => {
      const deliveryOrderExpired = createTestOrder(OrderStatus.CREATED, 16, 'CASH_ON_DELIVERY');
      const evalExpired = OrderExpirationPolicy.evaluate(deliveryOrderExpired);
      expect(evalExpired.isExpired).toBe(true);
      expect(evalExpired.type).toBe('PARTNER_TIMEOUT');
      expect(evalExpired.reason).toContain('Estabelecimento não respondeu');

      const deliveryOrderCard = createTestOrder(OrderStatus.AWAITING_PAYMENT, 16, 'CARD_ON_DELIVERY');
      const evalCardExpired = OrderExpirationPolicy.evaluate(deliveryOrderCard);
      expect(evalCardExpired.isExpired).toBe(true);
      expect(evalCardExpired.type).toBe('PARTNER_TIMEOUT');
    });

    it('deve expirar pedido se o cliente demorar mais de 10 minutos para pagar/selecionar pagamento (PAYMENT_TIMEOUT)', () => {
      const createdExpired = createTestOrder(OrderStatus.CREATED, 11);
      const evalCreated = OrderExpirationPolicy.evaluate(createdExpired);
      expect(evalCreated.isExpired).toBe(true);
      expect(evalCreated.type).toBe('PAYMENT_TIMEOUT');
      expect(evalCreated.reason).toContain('Prazo para seleção e conclusão do pagamento expirou');

      const awaitingPaymentExpired = createTestOrder(OrderStatus.AWAITING_PAYMENT, 11);
      const evalAwaiting = OrderExpirationPolicy.evaluate(awaitingPaymentExpired);
      expect(evalAwaiting.isExpired).toBe(true);
      expect(evalAwaiting.type).toBe('PAYMENT_TIMEOUT');

      const createdRecent = createTestOrder(OrderStatus.CREATED, 9);
      expect(OrderExpirationPolicy.evaluate(createdRecent).isExpired).toBe(false);
    });

    it('deve respeitar limites customizados de timeout informados', () => {
      const order = createTestOrder(OrderStatus.CREATED, 6);
      // Padrão é 10min, então não expirou ainda
      expect(OrderExpirationPolicy.evaluate(order).isExpired).toBe(false);
      // Com timeout customizado de 5 minutos, expira
      const customEval = OrderExpirationPolicy.evaluate(order, 15, 5);
      expect(customEval.isExpired).toBe(true);
      expect(customEval.type).toBe('PAYMENT_TIMEOUT');
    });
  });

  describe('Order.cancel com isSystem = true', () => {
    it('deve permitir cancelamento automático de pedido CREATED pelo sistema', () => {
      const order = createTestOrder(OrderStatus.CREATED);
      const cancelRes = order.cancel('Timeout de pagamento', false, true);

      expect(cancelRes.isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(cancelRes.getValue().requiresRefund).toBe(false);
      expect(order.cancelReason).toBe('Timeout de pagamento');
    });

    it('deve permitir cancelamento de pedido PAID pelo sistema com requiresRefund = true', () => {
      const order = createTestOrder(OrderStatus.PAID);
      const cancelRes = order.cancel('Timeout de resposta do estabelecimento', false, true);

      expect(cancelRes.isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(cancelRes.getValue().requiresRefund).toBe(true);
    });

    it('não deve permitir cancelamento automático pelo sistema em pedidos já CONFIRMED ou PREPARING', () => {
      const order = createTestOrder(OrderStatus.CONFIRMED);
      const cancelRes = order.cancel('Timeout', false, true);

      expect(cancelRes.isFailure).toBe(true);
      expect(cancelRes.getError()).toContain('ainda não foram confirmados pelo estabelecimento');
    });
  });
});
