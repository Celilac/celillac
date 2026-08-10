// backend/tests/unit/application/partner/UpdatePartnerUseCase.spec.ts
import { UpdatePartnerUseCase } from '../../../../src/application/partner/UpdatePartnerUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { Partner, PartnerType, PartnerApprovalStatus } from '../../../../src/domain/partner/Partner';

describe('UpdatePartnerUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: UpdatePartnerUseCase;

  const makeValidEmail = (email: string) => Email.create(email).getValue();
  const makeValidHash = () => PasswordHash.fromHash('$2a$10$hashdemo').getValue();

  let mockPartner: Partner;

  beforeEach(() => {
    mockPartner = Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: 'Descrição antiga',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
    }, 'partner-1').getValue();

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
    useCase = new UpdatePartnerUseCase(partnerRepository, userRepository);
  });

  it('deve permitir que o dono atualize um campo não crítico, mantendo aprovação', async () => {
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      userId: 'user-owner',
      description: 'Nova descrição do local',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockPartner.description).toBe('Nova descrição do local');
    expect(mockPartner.approvalStatus).toBe(PartnerApprovalStatus.APPROVED);
    expect(partnerRepository.update).toHaveBeenCalledWith(mockPartner);
  });

  it('deve regredir para PENDING_REVIEW ao alterar campo crítico de parceiro aprovado (9.8/15.4)', async () => {
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      userId: 'user-owner',
      address: 'Av. Paulista, 500',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockPartner.approvalStatus).toBe(PartnerApprovalStatus.PENDING_REVIEW);
  });

  it('deve permitir que um ADMIN edite o parceiro mesmo sem ser o dono', async () => {
    const admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

    partnerRepository.findById.mockResolvedValue(mockPartner);
    userRepository.findById.mockResolvedValue(admin);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      userId: 'user-admin',
      description: 'Ajuste administrativo',
    });

    expect(result.isSuccess).toBe(true);
  });

  it('deve recusar edição por usuário que não é dono nem admin', async () => {
    const otherUser = User.create({
      email: makeValidEmail('outro@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO,
    }, 'user-other').getValue();

    partnerRepository.findById.mockResolvedValue(mockPartner);
    userRepository.findById.mockResolvedValue(otherUser);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      userId: 'user-other',
      description: 'Tentativa indevida',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Acesso negado');
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve propagar falha de validação de domínio (ex.: tipo inválido)', async () => {
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({
      partnerId: 'partner-1',
      userId: 'user-owner',
      type: 'INVALID' as any,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Tipo de parceiro inválido');
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro não for encontrado', async () => {
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      partnerId: 'partner-inexistente',
      userId: 'user-owner',
      description: 'Qualquer coisa',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });
});
