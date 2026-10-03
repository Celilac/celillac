// backend/tests/unit/application/partner/ListAdminPartnersUseCase.spec.ts
import { ListAdminPartnersUseCase } from '../../../../src/application/partner/ListAdminPartnersUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { Partner, PartnerType, PartnerApprovalStatus } from '../../../../src/domain/partner/Partner';

describe('ListAdminPartnersUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: ListAdminPartnersUseCase;

  const makeValidEmail = (email: string) => Email.create(email).getValue();
  const makeValidHash = () => PasswordHash.fromHash('$2a$10$hashdemo').getValue();

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
    useCase = new ListAdminPartnersUseCase(partnerRepository, userRepository);
  });

  it('deve listar todos os parceiros, inclusive nÃ£o pÃºblicos, para ADMIN (11.12)', async () => {
    const admin = User.create({
      email: makeValidEmail('admin@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'user-admin').getValue();

    const draft = Partner.create({
      userId: 'user-1', name: 'Rascunho', address: 'Rua A', description: '', phone: '111',
      type: PartnerType.RESTAURANT, approvalStatus: PartnerApprovalStatus.DRAFT,
    }, 'partner-1').getValue();
    const approved = Partner.create({
      userId: 'user-2', name: 'Aprovado', address: 'Rua B', description: '', phone: '222',
      type: PartnerType.MARKET, approvalStatus: PartnerApprovalStatus.APPROVED,
    }, 'partner-2').getValue();

    userRepository.findById.mockResolvedValue(admin);
    partnerRepository.findAll.mockResolvedValue([draft, approved]);

    const result = await useCase.execute({ adminUserId: 'user-admin' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
  });

  it('deve recusar acesso a usuÃ¡rio que nÃ£o Ã© ADMIN', async () => {
    const normalUser = User.create({
      email: makeValidEmail('celiaco@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO,
    }, 'user-normal').getValue();

    userRepository.findById.mockResolvedValue(normalUser);

    const result = await useCase.execute({ adminUserId: 'user-normal' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Apenas administradores');
    expect(partnerRepository.findAll).not.toHaveBeenCalled();
  });

  it('deve falhar se o usuÃ¡rio administrador nÃ£o for encontrado', async () => {
    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ adminUserId: 'user-inexistente' });

    expect(result.isFailure).toBe(true);
    expect(partnerRepository.findAll).not.toHaveBeenCalled();
  });
});



