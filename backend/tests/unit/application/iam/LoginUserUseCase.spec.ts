// backend/tests/unit/application/iam/LoginUserUseCase.spec.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginUserUseCase } from '../../../../src/application/iam/LoginUserUseCase';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';

describe('LoginUserUseCase (Security & Sanitization)', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: LoginUserUseCase;
  let testUser: User;
  let passwordHash: PasswordHash;

  beforeAll(async () => {
    const rawHash = await bcrypt.hash('CorrectPassword@123', 10);
    passwordHash = PasswordHash.fromHash(rawHash).getValue();
  });

  beforeEach(() => {
    testUser = User.create(
      {
        email: Email.create('usuario.teste@celilac.com.br').getValue(),
        passwordHash,
        role: UserRole.CELIACO,
        fullName: 'Usuário Teste',
        accountStatus: 'ACTIVE',
      },
      'user-uuid-12345',
    ).getValue();

    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(testUser),
      findById: jest.fn().mockResolvedValue(testUser),
      findAll: jest.fn().mockResolvedValue([testUser]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new LoginUserUseCase(userRepository);
    process.env.JWT_SECRET = 'my_super_secure_jwt_secret_for_tests';
    process.env.JWT_EXPIRES_IN = '1d';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  it('deve realizar login com sucesso e retornar token assinado quando credenciais forem válidas', async () => {
    const result = await useCase.execute({
      email: 'usuario.teste@celilac.com.br',
      password: 'CorrectPassword@123',
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.token).toBeDefined();
    expect(data.expiresIn).toBe('1d');

    const decoded = jwt.verify(data.token, 'my_super_secure_jwt_secret_for_tests') as any;
    expect(decoded.sub).toBe('user-uuid-12345');
    expect(decoded.role).toBe(UserRole.CELIACO);
  });

  it('deve falhar com erro de credenciais inválidas se usuário não existir', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(null);

    const result = await useCase.execute({
      email: 'naoexiste@celilac.com.br',
      password: 'CorrectPassword@123',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Credenciais inválidas.');
  });

  it('deve falhar com erro de credenciais inválidas se a senha estiver incorreta', async () => {
    const result = await useCase.execute({
      email: 'usuario.teste@celilac.com.br',
      password: 'WrongPassword@123',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Credenciais inválidas.');
  });

  it('deve falhar se o usuário for ADMIN e estiver com conta aguardando aprovação', async () => {
    const pendingAdmin = User.create(
      {
        email: Email.create('admin.pendente@celilac.com.br').getValue(),
        passwordHash,
        role: UserRole.ADMIN,
        fullName: 'Admin Pendente',
        accountStatus: 'PENDING_APPROVAL',
      },
      'admin-pending-id',
    ).getValue();

    userRepository.findByEmail.mockResolvedValueOnce(pendingAdmin);

    const result = await useCase.execute({
      email: 'admin.pendente@celilac.com.br',
      password: 'CorrectPassword@123',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe(
      'Sua conta de Administrador aguarda aprovação prévia de um administrador existente.',
    );
  });

  it('deve lançar exceção crítica se JWT_SECRET não estiver definido (sem fallback vulnerável)', async () => {
    delete process.env.JWT_SECRET;

    await expect(
      useCase.execute({
        email: 'usuario.teste@celilac.com.br',
        password: 'CorrectPassword@123',
      }),
    ).rejects.toThrow('Configuração crítica ausente: JWT_SECRET não definido.');
  });
});

