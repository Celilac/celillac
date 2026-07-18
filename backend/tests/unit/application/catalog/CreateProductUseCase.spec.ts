// backend/tests/unit/application/catalog/CreateProductUseCase.spec.ts
import { CreateProductUseCase } from '../../../../src/application/catalog/CreateProductUseCase';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Partner, PartnerType } from '../../../../src/domain/partner/Partner';

describe('CreateProductUseCase', () => {
  let repository: jest.Mocked<IProductCatalogRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let useCase: CreateProductUseCase;

  const mockActivePartner = Partner.create({
    userId: 'user-1',
    name: 'Padaria SemG',
    address: 'Rua Central, 100',
    description: 'Cozinha sem contaminação',
    phone: '1234-5678',
    type: PartnerType.RESTAURANT,
    isActive: true,
  }, 'partner-1').getValue();

  const mockInactivePartner = Partner.create({
    userId: 'user-2',
    name: 'Confeitaria Doce',
    address: 'Rua Central, 101',
    description: 'Doces artesanais',
    phone: '1234-5678',
    type: PartnerType.INDEPENDENT_PRODUCER,
    isActive: false, // Inativo
  }, 'partner-2').getValue();

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      search: jest.fn(),
    };
    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
    };
    useCase = new CreateProductUseCase(repository, partnerRepository);
  });

  it('deve criar um produto com sucesso se o parceiro for ativo', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-1',
      price: 15.50,
      category: 'Biscoitos',
      imageUrl: 'http://image.com/biscoito.jpg',
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.create).toHaveBeenCalled();
    const product = result.getValue();
    expect(product.analysisStatus).toBe('ANALISADO');
    expect(product.price).toBe(15.50);
    expect(product.category).toBe('Biscoitos');
    expect(product.imageUrl).toBe('http://image.com/biscoito.jpg');
    expect(product.partnerId).toBe('partner-1');
  });

  it('deve falhar se o partnerId for nulo ou vazio', async () => {
    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('parceiro comercial (partnerId) é obrigatório');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro comercial não existir no banco', async () => {
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-inexistente',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Parceiro comercial não encontrado');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro comercial estiver inativo', async () => {
    partnerRepository.findById.mockResolvedValue(mockInactivePartner);

    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-2',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('parceiro comercial está inativo ou suspenso');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve falhar se os dados do produto forem inválidos', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: '',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('nome do produto é obrigatório');
    expect(repository.create).not.toHaveBeenCalled();
  });
});
