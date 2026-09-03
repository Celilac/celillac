// backend/tests/unit/application/catalog/CreateCategoryUseCase.spec.ts
import { CreateCategoryUseCase } from '../../../../src/application/catalog/CreateCategoryUseCase';
import { ICategoryRepository } from '../../../../src/domain/catalog/repositories/ICategoryRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Category } from '../../../../src/domain/catalog/Category';
import { Partner, PartnerType } from '../../../../src/domain/partner/Partner';

describe('CreateCategoryUseCase', () => {
  let categoryRepository: jest.Mocked<ICategoryRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let useCase: CreateCategoryUseCase;

  const mockPartner = Partner.create({
    userId: 'user-partner-1',
    name: 'Padaria Sem Glúten',
    description: 'Padaria artesanal sem glúten e sem lactose',
    address: 'Rua das Flores, 123',
    phone: '11999998888',
    type: PartnerType.RESTAURANT,
  }, 'partner-1').getValue();

  beforeEach(() => {
    categoryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByNormalizedName: jest.fn(),
      update: jest.fn(),
      listAvailableForPartner: jest.fn(),
      listPublicCategories: jest.fn(),
      listAllForAdmin: jest.fn(),
    };

    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockPartner),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    useCase = new CreateCategoryUseCase(categoryRepository, partnerRepository);
  });

  it('should register a new category in PENDING_APPROVAL and RESTRICTED status', async () => {
    categoryRepository.findByNormalizedName.mockResolvedValue(null);

    const result = await useCase.execute({
      name: 'Tortas & Bolos Artesanais',
      partnerId: 'partner-1',
      userId: 'user-partner-1',
      userRole: 'PARCEIRO',
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.name).toBe('Tortas & Bolos Artesanais');
    expect(dto.status).toBe('PENDING_APPROVAL');
    expect(dto.visibility).toBe('RESTRICTED');
    expect(dto.partnerId).toBe('partner-1');
    expect(categoryRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should return existing category if already present with same normalized name', async () => {
    const existing = Category.create({
      name: 'Padaria & Confeitaria',
      status: 'APPROVED',
      visibility: 'GLOBAL',
    }, 'cat-global-1').getValue();

    categoryRepository.findByNormalizedName.mockResolvedValue(existing);

    const result = await useCase.execute({
      name: 'padaria & confeitaria',
      partnerId: 'partner-1',
      userId: 'user-partner-1',
      userRole: 'PARCEIRO',
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.id).toBe('cat-global-1');
    expect(dto.name).toBe('Padaria & Confeitaria');
    expect(categoryRepository.create).not.toHaveBeenCalled();
  });

  it('should fail if partner does not exist', async () => {
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      name: 'Nova Categoria',
      partnerId: 'non-existent-partner',
      userId: 'user-partner-1',
      userRole: 'PARCEIRO',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Estabelecimento comercial não encontrado');
  });

  it('should fail if user is not the partner owner and not admin', async () => {
    const result = await useCase.execute({
      name: 'Nova Categoria',
      partnerId: 'partner-1',
      userId: 'different-user',
      userRole: 'PARCEIRO',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('não tem permissão');
  });
});
