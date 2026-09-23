// backend/tests/unit/application/iam/RequestPasswordResetUseCase.spec.ts
import { RequestPasswordResetUseCase } from '../../../../src/application/iam/RequestPasswordResetUseCase';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { FakeEmailService } from '../../../../src/infrastructure/services/FakeEmailService';

describe('RequestPasswordResetUseCase', () => {
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

  let fakeEmailService: FakeEmailService;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    fakeEmailService = new FakeEmailService();
    useCase = new RequestPasswordResetUseCase(
      mockUserRepository as any,
      mockPasswordResetRepository as any,
      fakeEmailService,
    );
  });

  it('deve gerar código e enviar e-mail quando o usuário existe', async () => {
    const user = User.create(
      {
        email: Email.create('usuario@celilac.dev').getValue(),
        passwordHash: PasswordHash.fromHash('hash_atual').getValue(),
        role: UserRole.CELIACO,
        fullName: 'Usuario CeLiLac',
      },
      'usr-123',
    ).getValue();

    mockUserRepository.findByEmail.mockResolvedValue(user);

    const result = await useCase.execute({ email: 'usuario@celilac.dev' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().message).toContain('Se o endereço de e-mail estiver cadastrado');
    expect(mockPasswordResetRepository.invalidatePreviousCodes).toHaveBeenCalledWith('usr-123');
    expect(mockPasswordResetRepository.save).toHaveBeenCalled();
    expect(fakeEmailService.sentEmails).toHaveLength(1);
    expect(fakeEmailService.sentEmails[0].to).toBe('usuario@celilac.dev');
    expect(fakeEmailService.sentEmails[0].subject).toContain('Recuperação de Senha');
  });

  it('deve retornar mensagem genérica de sucesso sem enviar e-mail quando o usuário não existe (anti-enumeração)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ email: 'inexistente@celilac.dev' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().message).toContain('Se o endereço de e-mail estiver cadastrado');
    expect(mockPasswordResetRepository.save).not.toHaveBeenCalled();
    expect(fakeEmailService.sentEmails).toHaveLength(0);
  });

  it('deve rejeitar se o e-mail estiver em branco ou for inválido', async () => {
    const resEmpty = await useCase.execute({ email: '' });
    expect(resEmpty.isFailure).toBe(true);

    const resInvalid = await useCase.execute({ email: 'invalido' });
    expect(resInvalid.isFailure).toBe(true);
  });

  it('deve repassar falha caso PasswordReset.create retorne erro', async () => {
    const user = User.create(
      {
        email: Email.create('usuario@celilac.dev').getValue(),
        passwordHash: PasswordHash.fromHash('hash_atual').getValue(),
        role: UserRole.CELIACO,
      },
      '', // userId vazio para forçar falha no PasswordReset.create
    ).getValue();

    mockUserRepository.findByEmail.mockResolvedValue(user);

    const result = await useCase.execute({ email: 'usuario@celilac.dev' });
    expect(result.isFailure).toBe(true);
  });
});
