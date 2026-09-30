// backend/tests/unit/infrastructure/logging/SecurityLogger.spec.ts
import { SecurityLogger } from '../../../../src/infrastructure/logging/SecurityLogger';

describe('SecurityLogger (A09: Auditoria & Observabilidade)', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('deve registrar tentativa falha de login com e-mail anonimizado', () => {
    SecurityLogger.logLoginFailed('192.168.1.10', 'usuario.sensivel@dominio.com', 'Mozilla/5.0');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logCall = warnSpy.mock.calls[0][0];
    expect(logCall).toContain('SECURITY_LOGIN_FAILED');
    expect(logCall).toContain('us***@dominio.com');
    expect(logCall).toContain('192.168.1.10');
  });

  it('deve registrar tentativa falha de OTP', () => {
    SecurityLogger.logOtpFailed('10.0.0.1', 'user@teste.com', 'PASSWORD_RESET');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logCall = warnSpy.mock.calls[0][0];
    expect(logCall).toContain('SECURITY_OTP_FAILED');
    expect(logCall).toContain('PASSWORD_RESET');
  });

  it('deve registrar violação de BOLA / IDOR com nível ERROR', () => {
    SecurityLogger.logBolaViolation('203.0.113.5', 'attacker-1', 'FoodProfile', 'victim-2', '/food-profile/victim-2');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logCall = errorSpy.mock.calls[0][0];
    expect(logCall).toContain('SECURITY_BOLA_VIOLATION');
    expect(logCall).toContain('attacker-1');
    expect(logCall).toContain('victim-2');
  });

  it('deve registrar bloqueio de bot de IA', () => {
    SecurityLogger.logBotBlocked('198.51.100.1', 'GPTBot/1.0', '/api/products', 'GPTBot');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logCall = warnSpy.mock.calls[0][0];
    expect(logCall).toContain('SECURITY_BOT_BLOCKED');
    expect(logCall).toContain('GPTBot');
  });

  it('deve registrar tentativa de checkout com mascaramento de dados', () => {
    SecurityLogger.logPaymentCheckoutAttempt({
      ip: '10.0.0.5',
      actorId: 'user-consumer-1',
      orderId: 'order-123',
      amount: 45.9,
      paymentMethod: 'CREDIT_CARD',
      idempotencyKey: 'key-abc-123',
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logCall = warnSpy.mock.calls[0][0];
    expect(logCall).toContain('PAYMENT_CHECKOUT_ATTEMPT');
    expect(logCall).toContain('user-consumer-1');
    expect(logCall).toContain('order-123');
  });

  it('deve registrar processamento de pagamento via webhook', () => {
    SecurityLogger.logPaymentProcessed({
      orderId: 'order-456',
      paymentId: 'pay-789',
      status: 'PAID',
      gatewayTransactionId: 'pay_asaas_001',
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logCall = warnSpy.mock.calls[0][0];
    expect(logCall).toContain('PAYMENT_PROCESSED');
    expect(logCall).toContain('pay-789');
    expect(logCall).toContain('PAID');
  });

  it('deve registrar estorno financeiro', () => {
    SecurityLogger.logPaymentRefunded({
      orderId: 'order-456',
      paymentId: 'pay-789',
      refundAmount: 50.0,
      reason: 'Cancelamento antes do envio.',
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logCall = warnSpy.mock.calls[0][0];
    expect(logCall).toContain('PAYMENT_REFUNDED');
    expect(logCall).toContain('pay-789');
    expect(logCall).toContain('50');
  });

  it('deve registrar configuração de conta financeira mascarando a chave PIX', () => {
    SecurityLogger.logPartnerFinancialAccountConfigured({
      ip: '172.16.0.2',
      actorId: 'partner-user-1',
      partnerId: 'partner-100',
      pixKeyType: 'EMAIL',
      pixKey: 'contato@padariasaudavel.com.br',
      bankCode: '001',
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logCall = warnSpy.mock.calls[0][0];
    expect(logCall).toContain('PARTNER_FINANCIAL_ACCOUNT_CONFIGURED');
    expect(logCall).toContain('co***@padariasaudavel.com.br');
    expect(logCall).toContain('001');
  });
});
