// backend/tests/unit/infrastructure/notifications/SseOrderNotificationHub.spec.ts
import { SseOrderNotificationHub } from '../../../../src/infrastructure/notifications/SseOrderNotificationHub';
import { OrderNotificationDTO } from '../../../../src/domain/order/services/IOrderNotificationService';

describe('SseOrderNotificationHub', () => {
  let hub: SseOrderNotificationHub;

  beforeEach(() => {
    hub = new SseOrderNotificationHub(100); // 100ms para testes
  });

  afterEach(() => {
    hub.clear();
  });

  const createMockWriter = () => {
    return {
      write: jest.fn().mockReturnValue(true),
    };
  };

  const samplePayload: OrderNotificationDTO = {
    orderId: 'order_123',
    partnerId: 'partner_abc',
    consumerId: 'user_consumer_1',
    totalAmount: 79.9,
    status: 'PAID',
    confirmedAt: '2026-09-30T14:00:00.000Z',
  };

  it('deve adicionar e remover clientes corretamente mantendo o contador de conexões', () => {
    const mockWriter = createMockWriter();
    expect(hub.getClientsCount()).toBe(0);

    hub.addClient({
      id: 'conn_1',
      userId: 'user_1',
      partnerId: 'partner_abc',
      res: mockWriter,
    });

    expect(hub.getClientsCount()).toBe(1);

    hub.removeClient('conn_1');
    expect(hub.getClientsCount()).toBe(0);
  });

  it('deve notificar apenas o parceiro comercial destinatário do pedido em notifyPaymentConfirmed', () => {
    const partnerWriter = createMockWriter();
    const otherPartnerWriter = createMockWriter();
    const adminWriter = createMockWriter();

    hub.addClient({
      id: 'conn_partner_target',
      userId: 'user_partner_1',
      partnerId: 'partner_abc',
      res: partnerWriter,
    });

    hub.addClient({
      id: 'conn_other_partner',
      userId: 'user_partner_2',
      partnerId: 'partner_xyz',
      res: otherPartnerWriter,
    });

    hub.addClient({
      id: 'conn_admin',
      userId: 'user_admin',
      userRole: 'ADMIN',
      res: adminWriter,
    });

    hub.notifyPaymentConfirmed('partner_abc', samplePayload);

    // O parceiro correto deve receber o evento formatado em SSE
    expect(partnerWriter.write).toHaveBeenCalledTimes(1);
    const partnerMessage = partnerWriter.write.mock.calls[0][0];
    expect(partnerMessage).toContain('event: order:payment_confirmed\n');
    expect(partnerMessage).toContain('"orderId":"order_123"');
    expect(partnerMessage).toContain('"totalAmount":79.9');

    // Administradores também recebem
    expect(adminWriter.write).toHaveBeenCalledTimes(1);

    // Outros parceiros NÃO devem receber (isolamento multi-tenant)
    expect(otherPartnerWriter.write).not.toHaveBeenCalled();
  });

  it('deve suportar parceiros com múltiplos estabelecimentos via partnerIds', () => {
    const multiPartnerWriter = createMockWriter();

    hub.addClient({
      id: 'conn_multi',
      userId: 'user_multi',
      partnerIds: ['partner_1', 'partner_abc', 'partner_3'],
      res: multiPartnerWriter,
    });

    hub.notifyPaymentConfirmed('partner_abc', samplePayload);

    expect(multiPartnerWriter.write).toHaveBeenCalledTimes(1);
  });

  it('deve disparar notifyOrderStatusChanged para o consumidor ou parceiro correto', () => {
    const consumerWriter = createMockWriter();
    const partnerWriter = createMockWriter();
    const thirdPartyWriter = createMockWriter();

    hub.addClient({
      id: 'conn_consumer',
      userId: 'user_consumer_1',
      res: consumerWriter,
    });

    hub.addClient({
      id: 'conn_partner',
      userId: 'user_partner',
      partnerId: 'partner_abc',
      res: partnerWriter,
    });

    hub.addClient({
      id: 'conn_stranger',
      userId: 'user_stranger',
      res: thirdPartyWriter,
    });

    const statusPayload: OrderNotificationDTO = {
      ...samplePayload,
      status: 'PREPARING',
    };

    hub.notifyOrderStatusChanged('user_consumer_1', statusPayload);

    expect(consumerWriter.write).toHaveBeenCalledTimes(1);
    expect(consumerWriter.write.mock.calls[0][0]).toContain('event: order:status_updated\n');
    expect(consumerWriter.write.mock.calls[0][0]).toContain('"status":"PREPARING"');

    expect(partnerWriter.write).not.toHaveBeenCalled();
    expect(thirdPartyWriter.write).not.toHaveBeenCalled();
  });

  it('deve remover automaticamente o cliente se o write falhar com exceção (conexão quebrada)', () => {
    const brokenWriter = {
      write: jest.fn().mockImplementation(() => {
        throw new Error('Socket closed unexpectedly');
      }),
    };

    hub.addClient({
      id: 'broken_client',
      userId: 'user_1',
      partnerId: 'partner_abc',
      res: brokenWriter,
    });

    expect(hub.getClientsCount()).toBe(1);

    hub.notifyPaymentConfirmed('partner_abc', samplePayload);

    // O cliente deve ter sido expurgado
    expect(hub.getClientsCount()).toBe(0);
  });

  it('deve transmitir notificação para todos os clientes conectados em broadcastTestNotification', () => {
    const writer1 = createMockWriter();
    const writer2 = createMockWriter();

    hub.addClient({
      id: 'conn_1',
      userId: 'user_1',
      res: writer1,
    });

    hub.addClient({
      id: 'conn_2',
      userId: 'user_2',
      res: writer2,
    });

    hub.broadcastTestNotification({
      orderId: 'order_test_broadcast',
      status: 'CONFIRMED',
      totalAmount: 35.0,
    });

    expect(writer1.write).toHaveBeenCalledTimes(1);
    expect(writer2.write).toHaveBeenCalledTimes(1);
    expect(writer1.write.mock.calls[0][0]).toContain('event: order:status_updated\n');
    expect(writer1.write.mock.calls[0][0]).toContain('"orderId":"order_test_broadcast"');
    expect(writer1.write.mock.calls[0][0]).toContain('"status":"CONFIRMED"');
  });
});
