// backend/tests/unit/application/order/OrderUseCases.spec.ts
import { CancelOrderUseCase } from '../../../../src/application/order/CancelOrderUseCase';
import { GetOrderUseCase } from '../../../../src/application/order/GetOrderUseCase';
import { ListConsumerOrdersUseCase } from '../../../../src/application/order/ListConsumerOrdersUseCase';
import { ListPartnerOrdersUseCase } from '../../../../src/application/order/ListPartnerOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../../../../src/application/order/UpdateOrderStatusUseCase';
import { IOrderRepository } from '../../../../src/domain/order/repositories/IOrderRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Order } from '../../../../src/domain/order/entities/Order';
import { OrderItem } from '../../../../src/domain/order/entities/OrderItem';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('Order Lifecycle Use Cases (Cancel, Queries, Status Transitions)', () => {
  let orderRepository: jest.Mocked<IOrderRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;

  const consumerId = 'consumer-user-1';
  const partnerUserId = 'partner-user-1';
  const partnerId = 'partner-estab-1';

  const mockPartner = Partner.create(
    {
      userId: partnerUserId,
      name: 'Pizzaria Segura',
      description: 'Pizzas sem glúten',
      address: 'Rua das Flores, 100',
      phone: '+5511999998888',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
      operationalStatus: PartnerOperationalStatus.ACTIVE,
    },
    partnerId
  ).getValue();

  const createTestOrder = (id = 'order-123') => {
    const item = OrderItem.create({
      productId: 'prod-1',
      productName: 'Pizza de Calabresa Sem Glúten',
      unitPrice: 60.0,
      quantity: 1,
    }).getValue();

    return Order.create(
      {
        consumerId,
        partnerId,
        items: [item],
        deliveryFee: 10.0,
        allergenCheckVerdict: 'SAFE',
      },
      id
    ).getValue();
  };

  beforeEach(() => {
    orderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByConsumerId: jest.fn(),
      findByPartnerId: jest.fn(),
    };

    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockPartner),
      findByCnpj: jest.fn(),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
  });

  describe('CancelOrderUseCase', () => {
    it('deve permitir cancelamento com estorno pelo celíaco se o pedido estiver pago mas ainda não confirmado', async () => {
      const order = createTestOrder();
      order.markAsPaid();
      orderRepository.findById.mockResolvedValue(order);

      const cancelUseCase = new CancelOrderUseCase(orderRepository, partnerRepository);
      const result = await cancelUseCase.execute({
        orderId: order.id,
        userId: consumerId,
        userRole: 'CELIACO',
        reason: 'Desisti da compra',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe('CANCELLED');
      expect(result.getValue().requiresRefund).toBe(true);
      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('deve impedir que outro usuário celíaco cancele pedido alheio', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const cancelUseCase = new CancelOrderUseCase(orderRepository, partnerRepository);
      const result = await cancelUseCase.execute({
        orderId: order.id,
        userId: 'intruder-consumer',
        userRole: 'CELIACO',
        reason: 'Quero cancelar',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Acesso negado: você só pode cancelar seus próprios pedidos');
    });
  });

  describe('UpdateOrderStatusUseCase', () => {
    it('deve permitir o parceiro aceitar (confirmar) e avançar as etapas do pedido', async () => {
      const order = createTestOrder();
      order.markAsPaid();
      orderRepository.findById.mockResolvedValue(order);

      const updateUseCase = new UpdateOrderStatusUseCase(orderRepository, partnerRepository);

      // 1. Confirmar pedido
      const confirmRes = await updateUseCase.execute({
        orderId: order.id,
        userId: partnerUserId,
        userRole: 'PARCEIRO',
        action: 'CONFIRM',
      });
      expect(confirmRes.isSuccess).toBe(true);
      expect(confirmRes.getValue().status).toBe('CONFIRMED');

      // 2. Iniciar preparo
      const prepRes = await updateUseCase.execute({
        orderId: order.id,
        userId: partnerUserId,
        userRole: 'PARCEIRO',
        action: 'START_PREPARING',
      });
      expect(prepRes.isSuccess).toBe(true);
      expect(prepRes.getValue().status).toBe('PREPARING');

      // 3. Pronto para retirada/entrega
      const readyRes = await updateUseCase.execute({
        orderId: order.id,
        userId: partnerUserId,
        userRole: 'PARCEIRO',
        action: 'READY_FOR_PICKUP',
      });
      expect(readyRes.isSuccess).toBe(true);
      expect(readyRes.getValue().status).toBe('READY_FOR_PICKUP');
    });

    it('deve impedir que parceiro não dono altere o status', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const updateUseCase = new UpdateOrderStatusUseCase(orderRepository, partnerRepository);
      const result = await updateUseCase.execute({
        orderId: order.id,
        userId: 'other-partner-user',
        userRole: 'PARCEIRO',
        action: 'CONFIRM',
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Acesso negado');
    });
  });

  describe('Queries (GetOrder, ListConsumerOrders, ListPartnerOrders)', () => {
    it('deve buscar detalhes do pedido para o celíaco dono', async () => {
      const order = createTestOrder();
      orderRepository.findById.mockResolvedValue(order);

      const getUseCase = new GetOrderUseCase(orderRepository, partnerRepository);
      const result = await getUseCase.execute({
        orderId: order.id,
        userId: consumerId,
        userRole: 'CELIACO',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toBe(order.id);
    });

    it('deve listar pedidos do consumidor', async () => {
      const order = createTestOrder();
      orderRepository.findByConsumerId.mockResolvedValue([order]);

      const listUseCase = new ListConsumerOrdersUseCase(orderRepository);
      const result = await listUseCase.execute(consumerId);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(1);
    });

    it('deve listar pedidos do parceiro', async () => {
      const order = createTestOrder();
      orderRepository.findByPartnerId.mockResolvedValue([order]);

      const listUseCase = new ListPartnerOrdersUseCase(orderRepository, partnerRepository);
      const result = await listUseCase.execute({
        partnerId,
        userId: partnerUserId,
        userRole: 'PARCEIRO',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(1);
    });
  });
});
