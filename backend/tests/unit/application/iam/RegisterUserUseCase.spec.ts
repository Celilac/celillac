// backend/tests/unit/application/iam/RegisterUserUseCase.spec.ts
import { RegisterUserUseCase } from '../../../../src/application/iam/RegisterUserUseCase';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { IEmailService } from '../../../../src/domain/services/IEmailService';
import { SendEmailVerificationCodeUseCase } from '../../../../src/application/iam/SendEmailVerificationCodeUseCase';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';

describe('RegisterUserUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let emailService: jest.Mocked<IEmailService>;
  let sendVerificationUseCase: jest.Mocked<SendEmailVerificationCodeUseCase>;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    emailService = {
      sendVerificationCode: jest.fn().mockResolvedValue(undefined),
      sendAdminApprovalNotification: jest.fn().mockResolvedValue(undefined),
      sendNewUserRegisteredAdminNotification: jest.fn().mockResolvedValue(undefined),
    };

    sendVerificationUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new RegisterUserUseCase(userRepository, sendVerificationUseCase, emailService);
    process.env.ADMIN_NOTIFICATION_EMAIL = 'celilac@zohomail.com';
  });

  afterEach(() => {
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
  });

  it('deve registrar um novo usuário consumidor com sucesso, enviar OTP e notificar administradores', async () => {
    const activeAdmin = User.create(
      {
        email: Email.create('admin1@celilac.com.br').getValue(),
        passwordHash: PasswordHash.fromHash('$2a$10$abcdefghijklmnopqrstuvwxyz123456').getValue(),
        role: UserRole.ADMIN,
        fullName: 'Admin Principal',
        accountStatus: 'ACTIVE',
      },
      'admin-id-1',
    ).getValue();

    userRepository.findAll.mockResolvedValue([activeAdmin]);

    const result = await useCase.execute({
      email: 'novo.consumidor@exemplo.com',
      password: 'StrongPassword@123',
      role: UserRole.CELIACO,
      fullName: 'Novo Consumidor',
    });

    expect(result.isSuccess).toBe(true);
    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(sendVerificationUseCase.execute).toHaveBeenCalledWith(result.getValue().id);

    // Aguarda microtasks assíncronas do envio de notificação
    await new Promise((resolve) => setImmediate(resolve));

    expect(emailService.sendNewUserRegisteredAdminNotification).toHaveBeenCalledTimes(2);
    expect(emailService.sendNewUserRegisteredAdminNotification).toHaveBeenCalledWith(
      'celilac@zohomail.com',
      expect.objectContaining({
        fullName: 'Novo Consumidor',
        email: 'novo.consumidor@exemplo.com',
        role: UserRole.CELIACO,
      }),
    );
    expect(emailService.sendNewUserRegisteredAdminNotification).toHaveBeenCalledWith(
      'evertoncoimbra@gmail.com',
      expect.objectContaining({
        fullName: 'Novo Consumidor',
        email: 'novo.consumidor@exemplo.com',
        role: UserRole.CELIACO,
      }),
    );
  });

  it('deve registrar um novo parceiro comercial e notificar administradores com papel PARCEIRO', async () => {
    const result = await useCase.execute({
      email: 'padaria.artesanal@parceiro.com',
      password: 'StrongPassword@123',
      role: UserRole.PARCEIRO,
      fullName: 'Padaria Artesanal',
    });

    expect(result.isSuccess).toBe(true);
    expect(userRepository.save).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setImmediate(resolve));

    expect(emailService.sendNewUserRegisteredAdminNotification).toHaveBeenCalledWith(
      'celilac@zohomail.com',
      expect.objectContaining({
        fullName: 'Padaria Artesanal',
        email: 'padaria.artesanal@parceiro.com',
        role: UserRole.PARCEIRO,
      }),
    );
    expect(emailService.sendNewUserRegisteredAdminNotification).toHaveBeenCalledWith(
      'evertoncoimbra@gmail.com',
      expect.objectContaining({
        fullName: 'Padaria Artesanal',
        email: 'padaria.artesanal@parceiro.com',
        role: UserRole.PARCEIRO,
      }),
    );
  });

  it('deve rejeitar e-mail duplicado', async () => {
    const existing = User.create({
      email: Email.create('existente@exemplo.com').getValue(),
      passwordHash: PasswordHash.fromHash('$2a$10$abcdefghijklmnopqrstuvwxyz123456').getValue(),
      role: UserRole.CELIACO,
    }).getValue();

    userRepository.findByEmail.mockResolvedValue(existing);

    const result = await useCase.execute({
      email: 'existente@exemplo.com',
      password: 'StrongPassword@123',
      role: UserRole.CELIACO,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Este e-mail já está em uso.');
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(emailService.sendNewUserRegisteredAdminNotification).not.toHaveBeenCalled();
  });
});
