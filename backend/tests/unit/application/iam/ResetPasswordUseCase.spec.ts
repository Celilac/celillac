// backend/tests/unit/application/iam/ResetPasswordUseCase.spec.ts
import { ResetPasswordUseCase } from '../../../../src/application/iam/ResetPasswordUseCase';
import { PasswordReset } from '../../../../src/domain/iam/PasswordReset';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';

describe('ResetPasswordUseCase', () => {
  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
  };

  const mockPasswordResetRepository = {
    save: jest.fn(),
    findLatestPendingByUserId: jest.fn(),
    findByUserIdAndCode: jest.fn(),
    invalidatePreviousCodes: jest.fn(),
  };

  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ResetPasswordUseCase(
      mockUserRepository as any,
      mockPasswordResetRepository as any,
    );
  });

  const makeUser = () => {
    return User.create(
      {
        email: Email.create('usuario@celilac.dev').getValue(),
        passwordHash: PasswordHash.fromHash('hash_antigo').getValue(),
        role: UserRole.CELIACO,
        fullName: 'Usuario CeLiLac',
      },
      'usr-123',
    ).getValue();
  };

  it('deve redefinir a senha com sucesso com código válido e senha forte', async () => {
    const user = makeUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);

    const reset = PasswordReset.create({
      userId: user.id,
      code: '654321',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }).getValue();

    mockPasswordResetRepository.findByUserIdAndCode.mockResolvedValue(reset);

    const result = await useCase.execute({
      email: 'usuario@celilac.dev',
      code: '654321',
      newPassword: 'NovaSenhaForte@123',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().message).toContain('Senha redefinida com sucesso');
    expect(reset.isUsed).toBe(true);
    expect(mockPasswordResetRepository.save).toHaveBeenCalledWith(reset);
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    expect(user.passwordHash.value).not.toBe('hash_antigo');
  });

  it('deve rejeitar campos obrigatórios vazios ou inválidos', async () => {
    const resNoEmail = await useCase.execute({ email: '', code: '123456', newPassword: 'SenhaValida@123' });
    expect(resNoEmail.isFailure).toBe(true);

    const resNoCode = await useCase.execute({ email: 'usuario@celilac.dev', code: '', newPassword: 'SenhaValida@123' });
    expect(resNoCode.isFailure).toBe(true);

    const resNoPass = await useCase.execute({ email: 'usuario@celilac.dev', code: '123456', newPassword: '' });
    expect(resNoPass.isFailure).toBe(true);

    const resBadEmail = await useCase.execute({ email: 'invalido', code: '123456', newPassword: 'SenhaValida@123' });
    expect(resBadEmail.isFailure).toBe(true);
  });

  it('deve rejeitar se o usuário não for encontrado no banco', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    const result = await useCase.execute({
      email: 'inexistente@celilac.dev',
      code: '123456',
      newPassword: 'SenhaValida@123',
    });
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('inválido ou expirado');
  });

  it('deve rejeitar senha que não atende aos requisitos de complexidade', async () => {
    const resultFraca = await useCase.execute({
      email: 'usuario@celilac.dev',
      code: '654321',
      newPassword: '12345',
    });

    expect(resultFraca.isFailure).toBe(true);
    expect(resultFraca.getError()).toContain('mínimo 8 caracteres');
  });

  it('deve rejeitar código de recuperação inválido ou inexistente', async () => {
    const user = makeUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordResetRepository.findByUserIdAndCode.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'usuario@celilac.dev',
      code: '000000',
      newPassword: 'NovaSenhaForte@123',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('inválido ou já utilizado');
  });

  it('deve rejeitar código já utilizado', async () => {
    const user = makeUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);

    const usedReset = PasswordReset.create({
      userId: user.id,
      code: '654321',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: true,
    }).getValue();

    mockPasswordResetRepository.findByUserIdAndCode.mockResolvedValue(usedReset);

    const result = await useCase.execute({
      email: 'usuario@celilac.dev',
      code: '654321',
      newPassword: 'NovaSenhaForte@123',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('inválido ou já utilizado');
  });

  it('deve rejeitar código expirado', async () => {
    const user = makeUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);

    const expiredReset = PasswordReset.create({
      userId: user.id,
      code: '654321',
      expiresAt: new Date(Date.now() - 5000),
    }).getValue();

    mockPasswordResetRepository.findByUserIdAndCode.mockResolvedValue(expiredReset);

    const result = await useCase.execute({
      email: 'usuario@celilac.dev',
      code: '654321',
      newPassword: 'NovaSenhaForte@123',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('expirou');
  });
});
