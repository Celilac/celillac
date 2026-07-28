// backend/tests/unit/application/partner/RegisterPartnerUseCase.spec.ts
import { RegisterPartnerUseCase } from '../../../../src/application/partner/RegisterPartnerUseCase';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';
import { PartnerType } from '../../../../src/domain/partner/Partner';

describe('RegisterPartnerUseCase', () => {
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: RegisterPartnerUseCase;

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
    };
    useCase = new RegisterPartnerUseCase(partnerRepository, userRepository);
  });

  it('deve registrar um parceiro com sucesso se usuário for do papel PARCEIRO', async () => {
    const user = User.create({
      email: makeValidEmail('carlos@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.PARCEIRO,
    }, 'user-1').getValue();

    userRepository.findById.mockResolvedValue(user);
    partnerRepository.findAllByUserId.mockResolvedValue([]);

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Padaria CeliLac',
      cnpj: '12.345.678/0001-95',
      description: 'Livre de glúten',
      address: 'Rua Principal, 100',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
    });

    expect(result.isSuccess).toBe(true);
    expect(partnerRepository.create).toHaveBeenCalled();
    const data = result.getValue();
    expect(data.name).toBe('Padaria CeliLac');
    expect(data.approvalStatus).toBe('DRAFT'); // Inicia em rascunho
    expect(data.operationalStatus).toBe('INACTIVE'); // Inicia inativo operacionalmente
  });

  it('deve falhar se o usuário não tiver papel de PARCEIRO', async () => {
    const user = User.create({
      email: makeValidEmail('ana@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO, // Papel incorreto
    }, 'user-1').getValue();

    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Padaria CeliLac',
      description: 'Livre de glúten',
      address: 'Rua Principal, 100',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('papel de PARCEIRO');
    expect(partnerRepository.create).not.toHaveBeenCalled();
  });
});
