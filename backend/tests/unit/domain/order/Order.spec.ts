// backend/tests/unit/domain/order/Order.spec.ts
import { Order } from '../../../../src/domain/order/entities/Order';
import { OrderItem } from '../../../../src/domain/order/entities/OrderItem';
import { OrderStatus } from '../../../../src/domain/order/value-objects/OrderStatus';

describe('Order Aggregate & OrderItem Domain Tests', () => {
  const createValidItem = (price = 25.5, quantity = 2) => {
    const itemResult = OrderItem.create({
      productId: 'prod-123',
      productName: 'Pão de Queijo Artesanal Sem Glúten',
      unitPrice: price,
      quantity,
    });
    expect(itemResult.isSuccess).toBe(true);
    return itemResult.getValue();
  };

  describe('OrderItem', () => {
    it('deve criar um OrderItem válido com total calculado corretamente', () => {
      const item = createValidItem(15.0, 3);
      expect(item.productId).toBe('prod-123');
      expect(item.productName).toBe('Pão de Queijo Artesanal Sem Glúten');
      expect(item.unitPrice).toBe(15.0);
      expect(item.quantity).toBe(3);
      expect(item.totalPrice).toBe(45.0);
    });

    it('deve falhar ao criar OrderItem com productId vazio', () => {
      const result = OrderItem.create({
        productId: '   ',
        productName: 'Pão de Queijo',
        unitPrice: 10,
        quantity: 1,
      });
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('O ID do produto é obrigatório');
    });

    it('deve falhar ao criar OrderItem com quantidade negativa ou zero', () => {
      const resultZero = OrderItem.create({
        productId: 'prod-1',
        productName: 'Pão de Queijo',
        unitPrice: 10,
        quantity: 0,
      });
      expect(resultZero.isFailure).toBe(true);

      const resultNeg = OrderItem.create({
        productId: 'prod-1',
        productName: 'Pão de Queijo',
        unitPrice: 10,
        quantity: -2,
      });
      expect(resultNeg.isFailure).toBe(true);
    });

    it('deve falhar ao criar OrderItem com nome vazio ou unitPrice ausente', () => {
      const emptyName = OrderItem.create({
        productId: 'prod-1',
        productName: '  ',
        unitPrice: 10,
        quantity: 1,
      });
      expect(emptyName.isFailure).toBe(true);

      const invalidPrice = OrderItem.create({
        productId: 'prod-1',
        productName: 'Pão',
        unitPrice: undefined as any,
        quantity: 1,
      });
      expect(invalidPrice.isFailure).toBe(true);

      const nonIntQty = OrderItem.create({
        productId: 'prod-1',
        productName: 'Pão',
        unitPrice: 10,
        quantity: 1.5,
      });
      expect(nonIntQty.isFailure).toBe(true);
    });

    it('deve acessar propriedades getters de OrderItem', () => {
      const item = OrderItem.create(
        {
          orderId: 'order-123',
          productId: 'prod-123',
          productName: 'Bolo',
          unitPrice: 20,
          quantity: 2,
          totalPrice: 40,
        },
        'item-uuid'
      ).getValue();

      expect(item.id).toBe('item-uuid');
      expect(item.orderId).toBe('order-123');
      expect(item.productId).toBe('prod-123');
      expect(item.productName).toBe('Bolo');
      expect(item.unitPrice).toBe(20);
      expect(item.quantity).toBe(2);
      expect(item.totalPrice).toBe(40);
    });
  });

  describe('Order', () => {
    it('deve criar um Order válido com totais calculados (subtotal + entrega)', () => {
      const item1 = createValidItem(20.0, 2); // 40.0
      const item2 = createValidItem(15.5, 1); // 15.5

      const orderResult = Order.create({
        consumerId: 'user-consumer-1',
        partnerId: 'partner-estab-1',
        items: [item1, item2],
        deliveryFee: 10.0,
        allergenCheckVerdict: 'SAFE',
        notes: 'Sem talheres plásticos',
      });

      expect(orderResult.isSuccess).toBe(true);
      const order = orderResult.getValue();
      expect(order.status).toBe(OrderStatus.CREATED);
      expect(order.subtotalAmount).toBe(55.5);
      expect(order.deliveryFee).toBe(10.0);
      expect(order.totalAmount).toBe(65.5);
      expect(order.allergenCheckVerdict).toBe('SAFE');
      expect(order.notes).toBe('Sem talheres plásticos');
      expect(order.consumerId).toBe('user-consumer-1');
      expect(order.partnerId).toBe('partner-estab-1');
      expect(order.items.length).toBe(2);
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });

    it('deve falhar ao criar pedido com parâmetros inválidos', () => {
      const item = createValidItem();

      expect(Order.create({ consumerId: '', partnerId: 'p1', items: [item], allergenCheckVerdict: 'SAFE' }).isFailure).toBe(true);
      expect(Order.create({ consumerId: 'c1', partnerId: '  ', items: [item], allergenCheckVerdict: 'SAFE' }).isFailure).toBe(true);
      expect(Order.create({ consumerId: 'c1', partnerId: 'p1', items: [], allergenCheckVerdict: 'SAFE' }).isFailure).toBe(true);
      expect(Order.create({ consumerId: 'c1', partnerId: 'p1', items: [item], deliveryFee: -5, allergenCheckVerdict: 'SAFE' }).isFailure).toBe(true);
    });

    it('deve permitir o fluxo completo de transição de status', () => {
      const item = createValidItem(30.0, 1);
      const order = Order.create({
        consumerId: 'consumer-1',
        partnerId: 'partner-1',
        items: [item],
        allergenCheckVerdict: 'SAFE',
      }).getValue();

      expect(order.status).toBe(OrderStatus.CREATED);

      // Aguardando pagamento
      expect(order.markAwaitingPayment().isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.AWAITING_PAYMENT);

      // Pago
      expect(order.markAsPaid().isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.PAID);

      // Parceiro aceitou
      expect(order.confirm().isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.CONFIRMED);

      // Preparando
      expect(order.startPreparing().isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.PREPARING);

      // Pronto para retirada
      expect(order.markReadyForPickup().isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.READY_FOR_PICKUP);

      // Saiu para entrega
      expect(order.markOutForDelivery().isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.OUT_FOR_DELIVERY);

      // Entregue
      expect(order.markDelivered().isSuccess).toBe(true);
      expect(order.status).toBe(OrderStatus.DELIVERED);
    });

    it('deve impedir transições inválidas de status', () => {
      const item = createValidItem();
      const order = Order.create({
        consumerId: 'c1',
        partnerId: 'p1',
        items: [item],
        allergenCheckVerdict: 'SAFE',
      }).getValue();

      // Não pode confirmar sem estar pago
      expect(order.confirm().isFailure).toBe(true);
      // Não pode iniciar preparo sem confirmar
      expect(order.startPreparing().isFailure).toBe(true);
      // Não pode marcar pronto sem estar preparando
      expect(order.markReadyForPickup().isFailure).toBe(true);
      // Não pode marcar saindo para entrega sem estar preparando ou pronto
      expect(order.markOutForDelivery().isFailure).toBe(true);
      // Não pode marcar entregue sem ter despachado ou ficado pronto
      expect(order.markDelivered().isFailure).toBe(true);

      // Marcar awaiting payment quando já não é CREATED
      order.markAwaitingPayment();
      expect(order.markAwaitingPayment().isFailure).toBe(true);
    });

    it('deve permitir cancelamento pelo celíaco antes do aceite do parceiro com sinalização de reembolso', () => {
      const item = createValidItem(50.0, 1);
      const order = Order.create({
        consumerId: 'consumer-1',
        partnerId: 'partner-1',
        items: [item],
        allergenCheckVerdict: 'SAFE',
      }).getValue();

      // Pedido foi pago via PIX/Cartão
      order.markAsPaid();
      expect(order.status).toBe(OrderStatus.PAID);

      // Celíaco solicita cancelamento antes de CONFIRMED
      const cancelResult = order.cancel('Mudei de ideia', true);
      expect(cancelResult.isSuccess).toBe(true);
      expect(cancelResult.getValue().requiresRefund).toBe(true);
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancelReason).toBe('Mudei de ideia');
      expect(order.cancelledAt).toBeInstanceOf(Date);
    });

    it('deve BLOQUEAR cancelamento pelo celíaco se o parceiro já tiver confirmado ou iniciado preparo', () => {
      const item = createValidItem(50.0, 1);
      const order = Order.create({
        consumerId: 'consumer-1',
        partnerId: 'partner-1',
        items: [item],
        allergenCheckVerdict: 'SAFE',
      }).getValue();

      order.markAsPaid();
      order.confirm(); // Estabelecimento confirmou!

      const cancelResult = order.cancel('Quero cancelar', true);
      expect(cancelResult.isFailure).toBe(true);
      expect(cancelResult.getError()).toContain(
        'O cancelamento não é mais permitido pelo consumidor pois o estabelecimento já confirmou ou iniciou o pedido'
      );
      expect(order.status).toBe(OrderStatus.CONFIRMED);
    });

    it('deve rejeitar cancelamento com motivo vazio ou em pedidos já finalizados', () => {
      const item = createValidItem();
      const order = Order.create({
        consumerId: 'c1',
        partnerId: 'p1',
        items: [item],
        allergenCheckVerdict: 'SAFE',
      }).getValue();

      // Motivo vazio
      expect(order.cancel('', false).isFailure).toBe(true);

      // Pedido já entregue
      order.markAsPaid();
      order.confirm();
      order.startPreparing();
      order.markReadyForPickup();
      order.markDelivered();
      expect(order.cancel('Quero cancelar', false).isFailure).toBe(true);

      // Pedido já cancelado
      const newOrder = Order.create({
        consumerId: 'c1',
        partnerId: 'p1',
        items: [item],
        allergenCheckVerdict: 'SAFE',
      }).getValue();
      expect(newOrder.cancel('Motivo 1', false).isSuccess).toBe(true);
      expect(newOrder.cancel('Motivo 2', false).isFailure).toBe(true);
    });
  });
});
