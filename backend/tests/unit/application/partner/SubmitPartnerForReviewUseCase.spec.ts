// backend/tests/unit/application/partner/SubmitPartnerForReviewUseCase.spec.ts
import { SubmitPartnerForReviewUseCase } from '../../../../src/application/partner/SubmitPartnerForReviewUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('SubmitPartnerForReviewUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: SubmitPartnerForReviewUseCase;

  const makeValidEmail = (email: string) => Email.create(email).getValue();
  const makeValidHash = () => PasswordHash.fromHash('$2a$10$hashdemo').getValue();

  let mockPartner: Partner;

  beforeEach(() => {
    mockPartner = Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: 'Restaurante sem glúten',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.DRAFT,
      operationalStatus: PartnerOperationalStatus.INACTIVE,
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
    };
    useCase = new SubmitPartnerForReviewUseCase(partnerRepository, userRepository);
  });

  it('deve permitir que o dono submeta o parceiro para revisão (16.2)', async () => {
    partnerRepository.findById.mockResolvedValue(mockPartner);

    const result = await useCase.execute({ partnerId: 'partner-1', userId: 'user-owner' });

    expect(result.isSuccess).toBe(true);
    expect(mockPartner.approvalStatus).toBe(PartnerApprovalStatus.PENDING_REVIEW);
    expect(partnerRepository.update).toHaveBeenCalledWith(mockPartner);
  });

  it('deve permitir que um ADMIN submeta o parceiro em nome do dono', async () => {
    const admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

    partnerRepository.findById.mockResolvedValue(mockPartner);
    userRepository.findById.mockResolvedValue(admin);

    const result = await useCase.execute({ partnerId: 'partner-1', userId: 'user-admin' });

    expect(result.isSuccess).toBe(true);
  });

  it('deve recusar submissão por usuário que não é dono nem admin', async () => {
    const otherUser = User.create({
      email: makeValidEmail('outro@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO,
    }, 'user-other').getValue();

    partnerRepository.findById.mockResolvedValue(mockPartner);
    userRepository.findById.mockResolvedValue(otherUser);

    const result = await useCase.execute({ partnerId: 'partner-1', userId: 'user-other' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Acesso negado');
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro não for encontrado', async () => {
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ partnerId: 'partner-inexistente', userId: 'user-owner' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });

  it('deve falhar (regra de domínio) se o parceiro incompleto for submetido', async () => {
    const incompletePartner = Partner.create({
      userId: 'user-owner',
      name: 'Nome Temp',
      address: 'Endereço Temp',
      description: '',
      phone: '1234',
      type: PartnerType.RESTAURANT,
    }, 'partner-2').getValue();
    (incompletePartner as any).props.phone = '  ';

    partnerRepository.findById.mockResolvedValue(incompletePartner);

    const result = await useCase.execute({ partnerId: 'partner-2', userId: 'user-owner' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('telefone');
    expect(partnerRepository.update).not.toHaveBeenCalled();
  });

  it('deve falhar (regra de domínio) ao submeter um parceiro já aprovado sem alteração crítica', async () => {
    const approvedPartner = Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: '',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus: PartnerApprovalStatus.APPROVED,
    }, 'partner-3').getValue();

    partnerRepository.findById.mockResolvedValue(approvedPartner);

    const result = await useCase.execute({ partnerId: 'partner-3', userId: 'user-owner' });

    expect(result.isFailure).toBe(true);
  });
});
