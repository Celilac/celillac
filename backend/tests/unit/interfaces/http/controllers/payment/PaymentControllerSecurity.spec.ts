// backend/tests/unit/interfaces/http/controllers/payment/PaymentControllerSecurity.spec.ts
import { PaymentController } from '../../../../../../src/interfaces/http/controllers/payment/PaymentController';
import { Result } from '../../../../../../src/domain/Result';

describe('PaymentController Security & Flow (A01: BOLA / IDOR Protection & Controller Coverage)', () => {
  let paymentController: PaymentController;
  let mockCheckoutOrderUseCase: any;
  let mockSetupFinancialAccountUseCase: any;
  let mockPaymentRepository: any;
  let mockFinancialAccountRepository: any;
  let mockOrderRepository: any;
  let mockPartnerRepository: any;
  let mockRes: any;

  beforeEach(() => {
    mockCheckoutOrderUseCase = { execute: jest.fn() };
    mockSetupFinancialAccountUseCase = { execute: jest.fn() };
    mockPaymentRepository = { findByOrderId: jest.fn() };
    mockFinancialAccountRepository = { findByPartnerId: jest.fn() };
    mockOrderRepository = { findById: jest.fn() };
    mockPartnerRepository = { findById: jest.fn() };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    paymentController = new PaymentController(
      mockCheckoutOrderUseCase,
      mockSetupFinancialAccountUseCase,
      mockPaymentRepository,
      mockFinancialAccountRepository,
      mockOrderRepository,
      mockPartnerRepository
    );
  });

  describe('checkout', () => {
    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      const req: any = { body: {}, headers: {} };
      await paymentController.checkout(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve retornar 400 se o caso de uso falhar', async () => {
      mockCheckoutOrderUseCase.execute.mockResolvedValue(Result.fail('Saldo insuficiente'));
      const req: any = {
        user: { id: 'usr-1' },
        body: { orderId: 'ord-1', method: 'PIX' },
        headers: {},
      };
      await paymentController.checkout(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Saldo insuficiente' });
    });

    it('deve retornar 200 com resultado quando o checkout for bem sucedido', async () => {
      mockCheckoutOrderUseCase.execute.mockResolvedValue(Result.ok({ paymentId: 'pay-123', status: 'PENDING' }));
      const req: any = {
        user: { id: 'usr-1' },
        body: { orderId: 'ord-1', method: 'PIX' },
        headers: {},
      };
      await paymentController.checkout(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ paymentId: 'pay-123', status: 'PENDING' });
    });
  });

  describe('setupFinancialAccount', () => {
    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      const req: any = { params: { partnerId: 'p-1' }, body: {}, headers: {} };
      await paymentController.setupFinancialAccount(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve retornar 403 Forbidden se o caso de uso retornar Acesso negado', async () => {
      mockSetupFinancialAccountUseCase.execute.mockResolvedValue(Result.fail('Acesso negado ao parceiro.'));
      const req: any = {
        user: { id: 'usr-1', role: 'USER' },
        params: { partnerId: 'p-1' },
        body: { pixKey: '123' },
        headers: {},
      };
      await paymentController.setupFinancialAccount(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('deve retornar 400 se o caso de uso retornar erro de validação', async () => {
      mockSetupFinancialAccountUseCase.execute.mockResolvedValue(Result.fail('Chave PIX inválida.'));
      const req: any = {
        user: { id: 'usr-1', role: 'PARTNER' },
        params: { partnerId: 'p-1' },
        body: { pixKey: 'invalid' },
        headers: {},
      };
      await paymentController.setupFinancialAccount(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Chave PIX inválida.' });
    });

    it('deve retornar 200 com a conta quando o setup for bem sucedido', async () => {
      const mockAcc = { toJSON: () => ({ id: 'acc-1', partnerId: 'p-1' }) };
      mockSetupFinancialAccountUseCase.execute.mockResolvedValue(Result.ok(mockAcc));
      const req: any = {
        user: { id: 'usr-1', role: 'PARTNER' },
        params: { partnerId: 'p-1' },
        body: { pixKey: 'test@pix.com' },
        headers: {},
      };
      await paymentController.setupFinancialAccount(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockAcc.toJSON());
    });
  });

  describe('getPaymentByOrderId (BOLA Protection)', () => {
    const orderId = 'order-uuid-123';
    const consumerOwnerId = 'user-consumer-owner';
    const partnerOwnerId = 'user-partner-owner';
    const attackerId = 'user-attacker-unauthorized';

    const mockPayment = {
      toJSON: () => ({ id: 'pay-1', orderId, amount: 50.0 }),
    };

    const mockOrder = {
      id: orderId,
      consumerId: consumerOwnerId,
      partnerId: 'partner-uuid-456',
    };

    const mockPartner = {
      id: 'partner-uuid-456',
      userId: partnerOwnerId,
    };

    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      const req: any = { params: { orderId }, headers: {} };
      await paymentController.getPaymentByOrderId(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve retornar 403 Forbidden se um usuário aleatório tentar acessar o pagamento de outro pedido', async () => {
      mockPaymentRepository.findByOrderId.mockResolvedValue(mockPayment);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPartnerRepository.findById.mockResolvedValue(mockPartner);

      const req: any = {
        user: { id: attackerId, role: 'USER' },
        params: { orderId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPaymentByOrderId(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Você não tem permissão para visualizar os detalhes deste pagamento.' })
      );
    });

    it('deve retornar 200 OK se o requisitante for o consumidor dono do pedido', async () => {
      mockPaymentRepository.findByOrderId.mockResolvedValue(mockPayment);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const req: any = {
        user: { id: consumerOwnerId, role: 'USER' },
        params: { orderId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPaymentByOrderId(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayment.toJSON());
    });

    it('deve retornar 200 OK se o requisitante for o responsável pelo estabelecimento parceiro vendedor', async () => {
      mockPaymentRepository.findByOrderId.mockResolvedValue(mockPayment);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPartnerRepository.findById.mockResolvedValue(mockPartner);

      const req: any = {
        user: { id: partnerOwnerId, role: 'PARTNER' },
        params: { orderId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPaymentByOrderId(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayment.toJSON());
    });

    it('deve retornar 200 OK se o requisitante for um ADMIN do sistema', async () => {
      mockPaymentRepository.findByOrderId.mockResolvedValue(mockPayment);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const req: any = {
        user: { id: 'admin-super-user', role: 'ADMIN' },
        params: { orderId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPaymentByOrderId(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPayment.toJSON());
    });

    it('deve retornar 404 Not Found se o pagamento não existir', async () => {
      mockPaymentRepository.findByOrderId.mockResolvedValue(null);

      const req: any = {
        user: { id: consumerOwnerId, role: 'USER' },
        params: { orderId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPaymentByOrderId(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Nenhum pagamento gerado para este pedido.' })
      );
    });

    it('deve retornar 404 Not Found se o pedido associado não existir', async () => {
      mockPaymentRepository.findByOrderId.mockResolvedValue(mockPayment);
      mockOrderRepository.findById.mockResolvedValue(null);

      const req: any = {
        user: { id: consumerOwnerId, role: 'USER' },
        params: { orderId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPaymentByOrderId(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Pedido associado não encontrado.' })
      );
    });
  });

  describe('getPartnerFinancialAccount (BOLA Protection)', () => {
    const partnerId = 'partner-uuid-456';
    const partnerOwnerId = 'user-partner-owner';
    const attackerId = 'user-attacker-unauthorized';

    const mockAccount = {
      toJSON: () => ({ partnerId, pixKey: 'test@pix.com', bankCode: '001' }),
    };

    const mockPartner = {
      id: partnerId,
      userId: partnerOwnerId,
    };

    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      const req: any = { params: { partnerId }, headers: {} };
      await paymentController.getPartnerFinancialAccount(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve retornar 403 Forbidden se um usuário tentar consultar os dados bancários de outro parceiro', async () => {
      mockPartnerRepository.findById.mockResolvedValue(mockPartner);

      const req: any = {
        user: { id: attackerId, role: 'USER' },
        params: { partnerId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPartnerFinancialAccount(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acesso negado. Apenas o responsável pelo estabelecimento ou administradores podem visualizar dados financeiros.',
        })
      );
    });

    it('deve retornar 200 OK se o proprietário do estabelecimento consultar seus dados financeiros', async () => {
      mockPartnerRepository.findById.mockResolvedValue(mockPartner);
      mockFinancialAccountRepository.findByPartnerId.mockResolvedValue(mockAccount);

      const req: any = {
        user: { id: partnerOwnerId, role: 'PARTNER' },
        params: { partnerId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPartnerFinancialAccount(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockAccount.toJSON());
    });

    it('deve retornar 200 OK se um ADMIN consultar os dados financeiros do parceiro', async () => {
      mockPartnerRepository.findById.mockResolvedValue(mockPartner);
      mockFinancialAccountRepository.findByPartnerId.mockResolvedValue(mockAccount);

      const req: any = {
        user: { id: 'admin-super-user', role: 'ADMIN' },
        params: { partnerId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPartnerFinancialAccount(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockAccount.toJSON());
    });

    it('deve retornar 404 Not Found se o estabelecimento parceiro não existir', async () => {
      mockPartnerRepository.findById.mockResolvedValue(null);

      const req: any = {
        user: { id: partnerOwnerId, role: 'PARTNER' },
        params: { partnerId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPartnerFinancialAccount(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Estabelecimento parceiro não encontrado.' })
      );
    });

    it('deve retornar 404 se a conta financeira não tiver sido configurada', async () => {
      mockPartnerRepository.findById.mockResolvedValue(mockPartner);
      mockFinancialAccountRepository.findByPartnerId.mockResolvedValue(null);

      const req: any = {
        user: { id: partnerOwnerId, role: 'PARTNER' },
        params: { partnerId },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      await paymentController.getPartnerFinancialAccount(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Conta financeira ainda não configurada para este parceiro.' })
      );
    });
  });

  describe('executeImpl e Tratamento de Erros Inesperados', () => {
    it('deve responder 200 no executeImpl', async () => {
      await (paymentController as any).executeImpl({} as any, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'PaymentController ativo.' });
    });

    it('deve responder 500 no checkout quando ocorrer exceção inesperada', async () => {
      mockCheckoutOrderUseCase.execute.mockRejectedValue(new Error('Falha no banco'));
      const req: any = { user: { id: 'u1' }, body: {}, headers: {} };
      await paymentController.checkout(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('deve responder 500 no getPaymentByOrderId quando ocorrer exceção inesperada', async () => {
      mockPaymentRepository.findByOrderId.mockRejectedValue(new Error('Falha no banco'));
      const req: any = { user: { id: 'u1' }, params: { orderId: '1' }, headers: {} };
      await paymentController.getPaymentByOrderId(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('deve responder 500 no setupFinancialAccount quando ocorrer exceção inesperada', async () => {
      mockSetupFinancialAccountUseCase.execute.mockRejectedValue(new Error('Falha no gateway'));
      const req: any = { user: { id: 'u1' }, params: { partnerId: 'p1' }, body: {}, headers: {} };
      await paymentController.setupFinancialAccount(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('deve responder 500 no getPartnerFinancialAccount quando ocorrer exceção inesperada', async () => {
      mockPartnerRepository.findById.mockRejectedValue(new Error('Falha no banco'));
      const req: any = { user: { id: 'u1' }, params: { partnerId: 'p1' }, headers: {} };
      await paymentController.getPartnerFinancialAccount(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

