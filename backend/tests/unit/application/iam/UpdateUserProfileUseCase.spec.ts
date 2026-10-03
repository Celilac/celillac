import { UpdateUserProfileUseCase } from '../../../../src/application/iam/UpdateUserProfileUseCase';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';

describe('UpdateUserProfileUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: UpdateUserProfileUseCase;
  let sampleUser: User;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new UpdateUserProfileUseCase(userRepository);

    sampleUser = User.create(
      {
        email: Email.create('user@celilac.com').getValue(),
        passwordHash: PasswordHash.fromHash('$2a$10$hashdemo').getValue(),
        role: UserRole.CELIACO,
      },
      'user-123',
    ).getValue();
  });

  it('deve retornar falha se usuário não existir', async () => {
    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'non-existent-id',
      fullName: 'Nome Teste',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Usuário não encontrado.');
  });

  it('deve atualizar o perfil com data de nascimento válida (>= 13 anos)', async () => {
    userRepository.findById.mockResolvedValue(sampleUser);
    userRepository.save.mockResolvedValue();

    const result = await useCase.execute({
      userId: 'user-123',
      fullName: 'Henrique Triches',
      birthDate: '2000-05-10',
    });

    expect(result.isSuccess).toBe(true);
    expect(sampleUser.fullName).toBe('Henrique Triches');
    expect(sampleUser.birthDate).toBeDefined();
    expect(sampleUser.birthDate?.getFullYear()).toBe(2000);
    expect(userRepository.save).toHaveBeenCalledWith(sampleUser);
  });

  it('deve rejeitar data de nascimento futura ou inferior a 13 anos', async () => {
    userRepository.findById.mockResolvedValue(sampleUser);

    const result = await useCase.execute({
      userId: 'user-123',
      birthDate: '2025-01-01',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('O usuário deve ter pelo menos 13 anos de idade (LGPD).');
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('deve rejeitar data de nascimento se for hoje', async () => {
    userRepository.findById.mockResolvedValue(sampleUser);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const result = await useCase.execute({
      userId: 'user-123',
      birthDate: todayStr,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('A data de nascimento não pode ser o dia de hoje.');
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('deve rejeitar whatsappPhone inválido', async () => {
    userRepository.findById.mockResolvedValue(sampleUser);

    const result = await useCase.execute({
      userId: 'user-123',
      whatsappPhone: '123',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('WhatsApp inválido');
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('deve rejeitar avatar muito grande', async () => {
    userRepository.findById.mockResolvedValue(sampleUser);

    const giantAvatar = 'data:image/png;base64,' + 'A'.repeat(15 * 1024 * 1024);
    const result = await useCase.execute({
      userId: 'user-123',
      avatarUrl: giantAvatar,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('O tamanho da foto de perfil não pode exceder 10MB.');
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('deve atualizar whatsappPhone válido', async () => {
    userRepository.findById.mockResolvedValue(sampleUser);
    userRepository.save.mockResolvedValue();

    const result = await useCase.execute({
      userId: 'user-123',
      whatsappPhone: '+5579999999999',
    });

    expect(result.isSuccess).toBe(true);
    expect(sampleUser.whatsappPhone?.value).toBe('+5579999999999');
    expect(userRepository.save).toHaveBeenCalled();
  });
});
