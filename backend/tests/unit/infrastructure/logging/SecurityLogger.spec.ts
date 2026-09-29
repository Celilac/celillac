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
});
