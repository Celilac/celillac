// backend/tests/unit/domain/iam/PasswordReset.spec.ts
import { PasswordReset } from '../../../../src/domain/iam/PasswordReset';

describe('PasswordReset Domain Entity', () => {
  it('deve criar uma entidade PasswordReset válida', () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const result = PasswordReset.create({
      userId: 'user-uuid-1',
      code: '123456',
      expiresAt,
    });

    expect(result.isSuccess).toBe(true);
    const reset = result.getValue();
    expect(reset.userId).toBe('user-uuid-1');
    expect(reset.code).toBe('123456');
    expect(reset.expiresAt).toBe(expiresAt);
    expect(reset.isUsed).toBe(false);
    expect(reset.createdAt).toBeInstanceOf(Date);
    expect(reset.isExpired()).toBe(false);
  });

  it('deve rejeitar criação sem userId', () => {
    const result = PasswordReset.create({
      userId: '',
      code: '123456',
      expiresAt: new Date(),
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('userId');
  });

  it('deve rejeitar código que não possua exatamente 6 dígitos', () => {
    const result1 = PasswordReset.create({
      userId: 'user-1',
      code: '12345',
      expiresAt: new Date(),
    });
    expect(result1.isFailure).toBe(true);

    const result2 = PasswordReset.create({
      userId: 'user-1',
      code: '1234567',
      expiresAt: new Date(),
    });
    expect(result2.isFailure).toBe(true);
  });

  it('deve identificar quando o código está expirado', () => {
    const expiredDate = new Date(Date.now() - 10000);
    const reset = PasswordReset.create({
      userId: 'user-1',
      code: '123456',
      expiresAt: expiredDate,
    }).getValue();

    expect(reset.isExpired()).toBe(true);
  });

  it('deve permitir marcar o código como utilizado', () => {
    const reset = PasswordReset.create({
      userId: 'user-1',
      code: '123456',
      expiresAt: new Date(Date.now() + 10000),
    }).getValue();

    expect(reset.isUsed).toBe(false);
    reset.markAsUsed();
    expect(reset.isUsed).toBe(true);
  });

  it('deve gerar código aleatório de 6 dígitos numéricos', () => {
    const code = PasswordReset.generateCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });
});
