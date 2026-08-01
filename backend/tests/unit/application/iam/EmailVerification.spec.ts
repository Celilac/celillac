// backend/tests/unit/application/iam/EmailVerification.spec.ts
import { EmailVerification } from '../../../../src/domain/iam/EmailVerification';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { SendEmailVerificationCodeUseCase } from '../../../../src/application/iam/SendEmailVerificationCodeUseCase';
import { VerifyEmailCodeUseCase } from '../../../../src/application/iam/VerifyEmailCodeUseCase';
import { FakeEmailService } from '../../../../src/infrastructure/services/FakeEmailService';

describe('Verificação de E-mail por Código OTP', () => {
  const makeUser = (isVerified = false) => {
    return User.create(
      {
        email: Email.create('usuario.teste@celilac.dev').getValue(),
        passwordHash: PasswordHash.fromHash('hash_senha').getValue(),
        role: UserRole.CELIACO,
        fullName: 'Usuário Teste OTP',
        isEmailVerified: isVerified,
      },
      'usr-uuid-otp-123',
    ).getValue();
  };

  const mockUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
  };

  const mockVerificationRepository = {
    save: jest.fn(),
    findLatestPendingByUserId: jest.fn(),
    findByUserIdAndCode: jest.fn(),
    invalidatePreviousCodes: jest.fn(),
  };

  let emailService: FakeEmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    emailService = new FakeEmailService();
  });

  it('deve gerar código numérico de 6 dígitos válido', () => {
    const code = EmailVerification.generateCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('deve enviar código de verificação via SendEmailVerificationCodeUseCase', async () => {
    const user = makeUser(false);
    mockUserRepository.findById.mockResolvedValue(user);

    const useCase = new SendEmailVerificationCodeUseCase(
      mockUserRepository as any,
      mockVerificationRepository as any,
      emailService,
    );

    const result = await useCase.execute(user.id);

    expect(result.isSuccess).toBe(true);
    expect(mockVerificationRepository.invalidatePreviousCodes).toHaveBeenCalledWith(user.id);
    expect(mockVerificationRepository.save).toHaveBeenCalled();
    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].to).toBe('usuario.teste@celilac.dev');
    expect(emailService.sentEmails[0].subject).toContain('verificação');
  });

  it('deve validar o código OTP e atualizar o status do e-mail para verificado', async () => {
    const user = makeUser(false);
    mockUserRepository.findById.mockResolvedValue(user);

    const verification = EmailVerification.create(
      {
        userId: user.id,
        code: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Válido por 10 min
      },
      'verif-123',
    ).getValue();

    mockVerificationRepository.findByUserIdAndCode.mockResolvedValue(verification);

    const useCase = new VerifyEmailCodeUseCase(
      mockUserRepository as any,
      mockVerificationRepository as any,
    );

    const result = await useCase.execute({
      userId: user.id,
      code: '123456',
    });

    expect(result.isSuccess).toBe(true);
    expect(verification.isUsed).toBe(true);
    expect(user.isEmailVerified).toBe(true);
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });

  it('deve rejeitar se o código de verificação estiver expirado', async () => {
    const user = makeUser(false);
    mockUserRepository.findById.mockResolvedValue(user);

    const expiredVerification = EmailVerification.create(
      {
        userId: user.id,
        code: '654321',
        expiresAt: new Date(Date.now() - 1000), // Já expirado
      },
      'verif-exp',
    ).getValue();

    mockVerificationRepository.findByUserIdAndCode.mockResolvedValue(expiredVerification);

    const useCase = new VerifyEmailCodeUseCase(
      mockUserRepository as any,
      mockVerificationRepository as any,
    );

    const result = await useCase.execute({
      userId: user.id,
      code: '654321',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('expirou');
  });
});
