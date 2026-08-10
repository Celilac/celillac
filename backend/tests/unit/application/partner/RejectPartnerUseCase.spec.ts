// backend/tests/unit/application/partner/RejectPartnerUseCase.spec.ts
import { RejectPartnerUseCase } from '../../../../src/application/partner/RejectPartnerUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('RejectPartnerUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: RejectPartnerUseCase;

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
      approvalStatus: PartnerApprovalStatus.PENDING_REVIEW,
      operationalStatus: PartnerOperationalStatus.INACTIVE,
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
    useCase = new RejectPartnerUseCase(partnerRepository, userRepository);
  });

  it('deve rejeitar o parceiro pendente com motivo, quando solicitado por ADMIN (16.4)', async () => {
    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      adminUserId: 'user-admin',
      reason: 'Documentação do CNPJ não enviada.',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockPartner.approvalStatus).toBe(PartnerApprovalStatus.REJECTED);
    expect(mockPartner.rejectionReason).toBe('Documentação do CNPJ não enviada.');
    expect(partnerRepository.update).toHaveBeenCalledWith(mockPartner);
  });

  it('deve falhar se o solicitante não for ADMIN', async () => {
    const normalUser = User.create({
      email: makeValidEmail('celiaco@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO,
    }, 'user-normal').getValue();
    userRepository.findById.mockResolvedValue(normalUser);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      adminUserId: 'user-normal',
      reason: 'Qualquer motivo',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Apenas administradores');
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar (regra de domínio) sem motivo informado', async () => {
    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      adminUserId: 'user-admin',
      reason: '',
    });

    expect(result.isFailure).toBe(true);
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro não estiver pendente de revisão', async () => {
    const draftPartner = Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: '',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.DRAFT,
    }, 'partner-2').getValue();

    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(draftPartner);

    const result = await useCase.execute({
      partnerId: 'partner-2',
      adminUserId: 'user-admin',
      reason: 'Motivo qualquer',
    });

    expect(result.isFailure).toBe(true);
  });

  it('deve falhar se o parceiro não for encontrado', async () => {
    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      partnerId: 'partner-inexistente',
      adminUserId: 'user-admin',
      reason: 'Motivo qualquer',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });

  it('deve falhar se o usuário administrador não for encontrado', async () => {
    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      adminUserId: 'user-inexistente',
      reason: 'Motivo qualquer',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Usuário administrador não encontrado.');
  });
});
