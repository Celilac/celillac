// backend/tests/unit/interfaces/http/controllers/payment/WebhookController.spec.ts
import { WebhookController } from '../../../../../../src/interfaces/http/controllers/payment/WebhookController';
import { Result } from '../../../../../../src/domain/Result';

describe('WebhookController (A01: Webhook Token Validation)', () => {
  let webhookController: WebhookController;
  let mockHandleAsaasWebhookUseCase: any;
  let mockReq: any;
  let mockRes: any;

  const validSecret = 'test_webhook_secret_key_123';

  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.ASAAS_WEBHOOK_SECRET = validSecret;

    mockHandleAsaasWebhookUseCase = {
      execute: jest.fn().mockResolvedValue(Result.ok({ received: true })),
    };

    webhookController = new WebhookController(mockHandleAsaasWebhookUseCase);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  afterAll(() => {
    delete process.env.ASAAS_WEBHOOK_SECRET;
  });

  it('deve rejeitar com 401 Unauthorized se o header asaas-access-token estiver ausente', async () => {
    mockReq = {
      headers: {},
      body: { event: 'PAYMENT_RECEIVED' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    await webhookController.handleAsaas(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token de webhook inválido ou ausente.' })
    );
    expect(mockHandleAsaasWebhookUseCase.execute).not.toHaveBeenCalled();
  });

  it('deve rejeitar com 401 Unauthorized se o header asaas-access-token for incorreto', async () => {
    mockReq = {
      headers: { 'asaas-access-token': 'wrong_token_tampered' },
      body: { event: 'PAYMENT_RECEIVED' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    await webhookController.handleAsaas(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token de webhook inválido ou ausente.' })
    );
    expect(mockHandleAsaasWebhookUseCase.execute).not.toHaveBeenCalled();
  });

  it('deve aceitar e processar o webhook com 200 OK quando o token for válido e idêntico ao secret', async () => {
    mockReq = {
      headers: { 'asaas-access-token': validSecret },
      body: { event: 'PAYMENT_RECEIVED', payment: { id: 'pay_123' } },
      socket: { remoteAddress: '127.0.0.1' },
    };

    await webhookController.handleAsaas(mockReq, mockRes);

    expect(mockHandleAsaasWebhookUseCase.execute).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });
  });

  it('deve responder com 400 Bad Request se o caso de uso retornar falha de validação', async () => {
    mockHandleAsaasWebhookUseCase.execute.mockResolvedValue(
      Result.fail('Evento não suportado.')
    );

    mockReq = {
      headers: { 'asaas-access-token': validSecret },
      body: { event: 'UNKNOWN_EVENT' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    await webhookController.handleAsaas(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Evento não suportado.' })
    );
  });
});
