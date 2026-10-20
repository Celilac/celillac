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
      findByCnpj: jest.fn().mockResolvedValue(null),
      findByDocumentNumber: jest.fn().mockResolvedValue(null),
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
    useCase = new RegisterPartnerUseCase(partnerRepository, userRepository);
  });

  it('deve registrar um parceiro com sucesso se usuário for do papel PARCEIRO, enviando automaticamente para PENDING_REVIEW', async () => {
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
      logoUrl: 'data:image/webp;base64,sample-logo',
    });

    expect(result.isSuccess).toBe(true);
    expect(partnerRepository.create).toHaveBeenCalled();
    const data = result.getValue();
    expect(data.name).toBe('Padaria CeliLac');
    expect(data.logoUrl).toBe('data:image/webp;base64,sample-logo');
    expect(data.approvalStatus).toBe('PENDING_REVIEW');
    expect(data.operationalStatus).toBe('INACTIVE');
  });

  it('deve manter o parceiro como DRAFT se isDraft for explicitamente informado como true', async () => {
    const user = User.create({
      email: makeValidEmail('carlos@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.PARCEIRO,
    }, 'user-1').getValue();

    userRepository.findById.mockResolvedValue(user);
    partnerRepository.findAllByUserId.mockResolvedValue([]);

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Padaria CeliLac Rascunho',
      cnpj: '12.345.678/0001-95',
      description: 'Rascunho de parceiro',
      address: 'Rua Principal, 100',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
      isDraft: true,
    });

    expect(result.isSuccess).toBe(true);
    expect(partnerRepository.create).toHaveBeenCalled();
    const data = result.getValue();
    expect(data.approvalStatus).toBe('DRAFT');
    expect(data.operationalStatus).toBe('INACTIVE');
  });

  it('deve registrar um parceiro com sucesso se usuário for do papel ADMIN, iniciando como APPROVED e ACTIVE', async () => {
    const adminUser = User.create({
      email: makeValidEmail('admin@celilac.com.br'),
      passwordHash: makeValidHash(),
      role: UserRole.ADMIN,
    }, 'admin-1').getValue();

    userRepository.findById.mockResolvedValue(adminUser);
    partnerRepository.findAllByUserId.mockResolvedValue([]);

    const result = await useCase.execute({
      userId: 'admin-1',
      name: 'Estabelecimento Modelo Admin',
      cnpj: '12.345.678/0001-95',
      description: 'Estabelecimento cadastrado para testes e vitrine',
      address: 'Av. Brasil, 500',
      phone: '45999998888',
      type: PartnerType.RESTAURANT,
    });

    expect(result.isSuccess).toBe(true);
    expect(partnerRepository.create).toHaveBeenCalled();
    const data = result.getValue();
    expect(data.name).toBe('Estabelecimento Modelo Admin');
    expect(data.approvalStatus).toBe('APPROVED');
    expect(data.operationalStatus).toBe('ACTIVE');
  });

  it('deve falhar se o usuário não tiver papel de PARCEIRO', async () => {
    const user = User.create({
      email: makeValidEmail('ana@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.CELIACO,
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

  it('deve falhar se o usuário não for encontrado', async () => {
    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-inexistente',
      name: 'Padaria CeliLac',
      description: 'Livre de glúten',
      address: 'Rua Principal, 100',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Usuário não encontrado');
  });

  it('deve falhar se o CNPJ já estiver cadastrado em outro estabelecimento', async () => {
    const user = User.create({
      email: makeValidEmail('carlos@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.PARCEIRO,
    }, 'user-1').getValue();

    userRepository.findById.mockResolvedValue(user);
    partnerRepository.findByDocumentNumber.mockResolvedValue({ id: 'outro-parceiro' } as any);

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Padaria CeliLac Nova',
      cnpj: '12.345.678/0001-95',
      description: 'Livre de glúten',
      address: 'Rua Principal, 100',
      phone: '1234-5678',
      type: PartnerType.RESTAURANT,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Já existe um estabelecimento cadastrado com este CNPJ');
    expect(partnerRepository.create).not.toHaveBeenCalled();
  });

  it('deve registrar um parceiro como Pessoa Física (PF) com CPF e nome de responsável', async () => {
    const user = User.create({
      email: makeValidEmail('artesanal@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.PARCEIRO,
    }, 'user-pf').getValue();

    userRepository.findById.mockResolvedValue(user);
    partnerRepository.findByDocumentNumber.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-pf',
      name: 'Bolos Artesanais da Ana',
      legalNature: 'PF',
      documentNumber: '529.982.247-25',
      responsibleName: 'Ana Paula Boleira',
      documentUrl: 'https://storage.celilac.com.br/docs/ana.pdf',
      description: 'Bolos artesanais sem glúten e sem lactose',
      address: 'Rua dos Doces, 12',
      phone: '11988887777',
      type: PartnerType.INDEPENDENT_PRODUCER,
    });

    expect(result.isSuccess).toBe(true);
    expect(partnerRepository.create).toHaveBeenCalled();
    const data = result.getValue();
    expect(data.legalNature).toBe('PF');
    expect(data.documentNumber).toBe('529.982.247-25');
    expect(data.documentType).toBe('CPF');
    expect(data.responsibleName).toBe('Ana Paula Boleira');
    expect(data.documentUrl).toBe('https://storage.celilac.com.br/docs/ana.pdf');
  });

  it('deve falhar se o CPF do parceiro PF já estiver cadastrado em outro estabelecimento', async () => {
    const user = User.create({
      email: makeValidEmail('artesanal2@teste.com'),
      passwordHash: makeValidHash(),
      role: UserRole.PARCEIRO,
    }, 'user-pf-2').getValue();

    userRepository.findById.mockResolvedValue(user);
    partnerRepository.findByDocumentNumber.mockResolvedValue({ id: 'outro-parceiro-pf' } as any);

    const result = await useCase.execute({
      userId: 'user-pf-2',
      name: 'Bolos Artesanais da Ana 2',
      legalNature: 'PF',
      documentNumber: '529.982.247-25',
      description: 'Bolos',
      address: 'Rua dos Doces, 12',
      phone: '11988887777',
      type: PartnerType.INDEPENDENT_PRODUCER,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Já existe um estabelecimento cadastrado com este CPF');
    expect(partnerRepository.create).not.toHaveBeenCalled();
  });
});
