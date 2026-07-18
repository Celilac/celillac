// backend/tests/unit/application/partner/ApprovePartnerUseCase.spec.ts
import { ApprovePartnerUseCase } from '../../../../src/application/partner/ApprovePartnerUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { Partner, PartnerType } from '../../../../src/domain/partner/Partner';

describe('ApprovePartnerUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: ApprovePartnerUseCase;

  const makeValidEmail = (email: string) => Email.create(email).getValue();
  const makeValidHash = () => PasswordHash.fromHash('$2a$10$hashdemo').getValue();

  const mockPartner = Partner.create({
    userId: 'user-2',
    name: 'Sabor Celíaco',
    cnpj: '12.345.678/0001-95',
    address: 'Rua das Flores, 123',
    description: 'Restaurante sem glúten',
    phone: '1234-5678',
    type: PartnerType.RESTAURANT,
    isActive: false, // Começa inativo
  }, 'partner-1').getValue();

  beforeEach(() => {
    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
    };
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    useCase = new ApprovePartnerUseCase(partnerRepository, userRepository);
  });

  it('deve ativar o parceiro com sucesso se o solicitante for ADMIN', async () => {
    const admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      adminUserId: 'user-admin',
      isActive: true, // Aprovar
    });

    expect(result.isSuccess).toBe(true);
    expect(partnerRepository.update).toHaveBeenCalled();
    expect(mockPartner.isActive).toBe(true);
  });

  it('deve inativar o parceiro com sucesso se o solicitante for ADMIN', async () => {
    const admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      adminUserId: 'user-admin',
      isActive: false, // Suspender
    });

    expect(result.isSuccess).toBe(true);
    expect(partnerRepository.update).toHaveBeenCalled();
    expect(mockPartner.isActive).toBe(false);
  });

  it('deve falhar se o usuário solicitante não for ADMIN', async () => {
    const normalUser = User.create({
      email: makeValidEmail('celiaco@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO,
    }, 'user-normal').getValue();

    userRepository.findById.mockResolvedValue(normalUser);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      adminUserId: 'user-normal',
      isActive: true,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Apenas administradores');
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro não for encontrado', async () => {
    const admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      partnerId: 'partner-inexistente',
      adminUserId: 'user-admin',
      isActive: true,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });
});
