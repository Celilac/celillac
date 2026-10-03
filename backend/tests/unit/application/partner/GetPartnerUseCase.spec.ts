// backend/tests/unit/application/partner/GetPartnerUseCase.spec.ts
import { GetPartnerUseCase } from '../../../../src/application/partner/GetPartnerUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('GetPartnerUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: GetPartnerUseCase;

  const makeValidEmail = (email: string) => Email.create(email).getValue();
  const makeValidHash = () => PasswordHash.fromHash('$2a$10$hashdemo').getValue();

  const makePartner = (approvalStatus: PartnerApprovalStatus, operationalStatus: PartnerOperationalStatus) =>
    Partner.create({
      userId: 'user-owner',
      name: 'Sabor Celíaco',
      address: 'Rua das Flores, 123',
      description: 'Restaurante sem glúten',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      approvalStatus,
      operationalStatus,
      rejectionReason: approvalStatus === PartnerApprovalStatus.REJECTED ? 'Documentação incompleta' : undefined,
      suspensionReason: approvalStatus === PartnerApprovalStatus.SUSPENDED ? 'Reclamação grave' : undefined,
    }, 'partner-1').getValue();

  beforeEach(() => {
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
    useCase = new GetPartnerUseCase(partnerRepository, userRepository);
  });

  it('deve devolver o cadastro completo, com motivo de rejeição, para o próprio dono', async () => {
    const partner = makePartner(PartnerApprovalStatus.REJECTED, PartnerOperationalStatus.INACTIVE);
    partnerRepository.findById.mockResolvedValue(partner);

    const result = await useCase.execute({ partnerId: 'partner-1', requesterId: 'user-owner' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().approvalStatus).toBe(PartnerApprovalStatus.REJECTED);
    expect(result.getValue().rejectionReason).toBe('Documentação incompleta');
  });

  it('deve devolver o cadastro completo, com motivo de suspensão, para um ADMIN', async () => {
    const partner = makePartner(PartnerApprovalStatus.SUSPENDED, PartnerOperationalStatus.INACTIVE);
    const admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

    partnerRepository.findById.mockResolvedValue(partner);
    userRepository.findById.mockResolvedValue(admin);

    const result = await useCase.execute({ partnerId: 'partner-1', requesterId: 'user-admin' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().suspensionReason).toBe('Reclamação grave');
  });

  it('deve recusar acesso de um visitante anônimo a um parceiro em rascunho (RN-PARTNER-04)', async () => {
    const partner = makePartner(PartnerApprovalStatus.DRAFT, PartnerOperationalStatus.INACTIVE);
    partnerRepository.findById.mockResolvedValue(partner);

    const result = await useCase.execute({ partnerId: 'partner-1' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });

  it('deve recusar acesso de um visitante anônimo a um parceiro pendente de revisão (RN-PARTNER-05)', async () => {
    const partner = makePartner(PartnerApprovalStatus.PENDING_REVIEW, PartnerOperationalStatus.INACTIVE);
    partnerRepository.findById.mockResolvedValue(partner);

    const result = await useCase.execute({ partnerId: 'partner-1' });

    expect(result.isFailure).toBe(true);
  });

  it('deve recusar acesso de um visitante anônimo a um parceiro rejeitado, sem vazar o motivo (RN-PARTNER-07)', async () => {
    const partner = makePartner(PartnerApprovalStatus.REJECTED, PartnerOperationalStatus.INACTIVE);
    partnerRepository.findById.mockResolvedValue(partner);

    const result = await useCase.execute({ partnerId: 'partner-1' });

    expect(result.isFailure).toBe(true);
  });

  it('deve recusar acesso de um visitante anônimo a um parceiro suspenso, sem vazar o motivo (RN-PARTNER-08)', async () => {
    const partner = makePartner(PartnerApprovalStatus.SUSPENDED, PartnerOperationalStatus.INACTIVE);
    partnerRepository.findById.mockResolvedValue(partner);

    const result = await useCase.execute({ partnerId: 'partner-1' });

    expect(result.isFailure).toBe(true);
  });

  it('deve recusar acesso de outro usuário autenticado (não dono, não admin) a parceiro não público', async () => {
    const partner = makePartner(PartnerApprovalStatus.PENDING_REVIEW, PartnerOperationalStatus.INACTIVE);
    const otherUser = User.create({
      email: makeValidEmail('outro@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO,
    }, 'user-other').getValue();

    partnerRepository.findById.mockResolvedValue(partner);
    userRepository.findById.mockResolvedValue(otherUser);

    const result = await useCase.execute({ partnerId: 'partner-1', requesterId: 'user-other' });

    expect(result.isFailure).toBe(true);
  });

  it('deve recusar acesso público a parceiro aprovado mas operacionalmente inativo (RN-PARTNER-09)', async () => {
    const partner = makePartner(PartnerApprovalStatus.APPROVED, PartnerOperationalStatus.INACTIVE);
    partnerRepository.findById.mockResolvedValue(partner);

    const result = await useCase.execute({ partnerId: 'partner-1' });

    expect(result.isFailure).toBe(true);
  });

  it('deve permitir acesso público a parceiro aprovado e ativo, sem expor campos administrativos', async () => {
    const partner = makePartner(PartnerApprovalStatus.APPROVED, PartnerOperationalStatus.ACTIVE);
    partnerRepository.findById.mockResolvedValue(partner);

    const result = await useCase.execute({ partnerId: 'partner-1' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().rejectionReason).toBeUndefined();
    expect(result.getValue().suspensionReason).toBeUndefined();
  });

  it('deve permitir acesso público a parceiro aprovado e temporariamente fechado', async () => {
    const partner = makePartner(PartnerApprovalStatus.APPROVED, PartnerOperationalStatus.TEMPORARILY_CLOSED);
    partnerRepository.findById.mockResolvedValue(partner);

    const result = await useCase.execute({ partnerId: 'partner-1' });

    expect(result.isSuccess).toBe(true);
  });

  it('deve falhar se o parceiro não for encontrado', async () => {
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ partnerId: 'partner-inexistente' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });
});
