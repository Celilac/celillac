// backend/tests/unit/application/partner/ReactivatePartnerUseCase.spec.ts
import { ReactivatePartnerUseCase } from '../../../../src/application/partner/ReactivatePartnerUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('ReactivatePartnerUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: ReactivatePartnerUseCase;

  const makeValidEmail = (email: string) => Email.create(email).getValue();
  const makeValidHash = () => PasswordHash.fromHash('$2a$10$hashdemo').getValue();

  let mockPartner: Partner;
  let admin: User;

  beforeEach(() => {
    mockPartner = Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: '',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.SUSPENDED,
      operationalStatus: PartnerOperationalStatus.INACTIVE,
      suspensionReason: 'Irregularidade temporária',
    }, 'partner-1').getValue();

    admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

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
    useCase = new ReactivatePartnerUseCase(partnerRepository, userRepository);
  });

  it('deve reativar o parceiro suspenso quando solicitado por ADMIN (11.7)', async () => {
    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({ partnerId: 'partner-1', adminUserId: 'user-admin' });

    expect(result.isSuccess).toBe(true);
    expect(mockPartner.approvalStatus).toBe(PartnerApprovalStatus.APPROVED);
    expect(mockPartner.operationalStatus).toBe(PartnerOperationalStatus.ACTIVE);
    expect(mockPartner.suspensionReason).toBeUndefined();
    expect(partnerRepository.update).toHaveBeenCalledWith(mockPartner);
  });

  it('deve falhar se o solicitante não for ADMIN (apenas administração reativa — 14.2)', async () => {
    const owner = User.create({
      email: makeValidEmail('dono@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.PARCEIRO,
    }, 'user-owner').getValue();
    userRepository.findById.mockResolvedValue(owner);

    const result = await useCase.execute({ partnerId: 'partner-1', adminUserId: 'user-owner' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Apenas administradores');
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro não estiver suspenso', async () => {
    const approvedPartner = Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: '',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
    }, 'partner-2').getValue();

    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(approvedPartner);

    const result = await useCase.execute({ partnerId: 'partner-2', adminUserId: 'user-admin' });

    expect(result.isFailure).toBe(true);
  });

  it('deve falhar se o parceiro não for encontrado', async () => {
    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ partnerId: 'partner-inexistente', adminUserId: 'user-admin' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });
});
