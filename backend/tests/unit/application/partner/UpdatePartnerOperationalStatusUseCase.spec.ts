// backend/tests/unit/application/partner/UpdatePartnerOperationalStatusUseCase.spec.ts
import { UpdatePartnerOperationalStatusUseCase } from '../../../../src/application/partner/UpdatePartnerOperationalStatusUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('UpdatePartnerOperationalStatusUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: UpdatePartnerOperationalStatusUseCase;

  const makeValidEmail = (email: string) => Email.create(email).getValue();
  const makeValidHash = () => PasswordHash.fromHash('$2a$10$hashdemo').getValue();

  let mockPartner: Partner;
  let owner: User;

  beforeEach(() => {
    mockPartner = Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: '',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
      operationalStatus: PartnerOperationalStatus.ACTIVE,
    }, 'partner-1').getValue();

    owner = User.create({
      email: makeValidEmail('dono@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.PARCEIRO,
    }, 'user-owner').getValue();

    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(async (_id: string) => {}),
    };
    useCase = new UpdatePartnerOperationalStatusUseCase(partnerRepository, userRepository);
  });

  it('deve permitir que o dono feche temporariamente o estabelecimento (12.7)', async () => {
    userRepository.findById.mockResolvedValue(owner);
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      userId: 'user-owner',
      status: PartnerOperationalStatus.TEMPORARILY_CLOSED,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockPartner.operationalStatus).toBe(PartnerOperationalStatus.TEMPORARILY_CLOSED);
    expect(partnerRepository.update).toHaveBeenCalledWith(mockPartner);
  });

  it('deve permitir que um ADMIN altere o status operacional', async () => {
    const admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      userId: 'user-admin',
      status: PartnerOperationalStatus.INACTIVE,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockPartner.operationalStatus).toBe(PartnerOperationalStatus.INACTIVE);
  });

  it('deve recusar alteração por usuário que não é dono nem admin', async () => {
    const otherUser = User.create({
      email: makeValidEmail('outro@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO,
    }, 'user-other').getValue();

    userRepository.findById.mockResolvedValue(otherUser);
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      userId: 'user-other',
      status: PartnerOperationalStatus.INACTIVE,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Acesso negado');
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar (regra de domínio) ao tentar alterar status operacional de parceiro suspenso (RN-PARTNER-08)', async () => {
    const suspendedPartner = Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: '',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.SUSPENDED,
    }, 'partner-2').getValue();

    userRepository.findById.mockResolvedValue(owner);
    partnerRepository.findById.mockResolvedValue(suspendedPartner);

    const result = await useCase.execute({
      partnerId: 'partner-2',
      userId: 'user-owner',
      status: PartnerOperationalStatus.ACTIVE,
    });

    expect(result.isFailure).toBe(true);
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro não for encontrado', async () => {
    userRepository.findById.mockResolvedValue(owner);
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      partnerId: 'partner-inexistente',
      userId: 'user-owner',
      status: PartnerOperationalStatus.ACTIVE,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });
});
