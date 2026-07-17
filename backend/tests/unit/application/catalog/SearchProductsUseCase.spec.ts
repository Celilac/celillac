// backend/tests/unit/application/catalog/SearchProductsUseCase.spec.ts
import { SearchProductsUseCase } from '../../../../src/application/catalog/SearchProductsUseCase';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { IFoodProfileRepository } from '../../../../src/domain/food-profile/repositories/IFoodProfileRepository';
import { Product } from '../../../../src/domain/catalog/Product';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';

describe('SearchProductsUseCase', () => {
  let repository: jest.Mocked<IProductCatalogRepository>;
  let foodProfileRepository: jest.Mocked<IFoodProfileRepository>;
  let useCase: SearchProductsUseCase;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      search: jest.fn(),
    };
    foodProfileRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    useCase = new SearchProductsUseCase(repository, foodProfileRepository);
  });

  it('deve buscar produtos e retornar os dados paginados com filtros', async () => {
    const product = Product.create({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-1',
    }).getValue();

    repository.search.mockResolvedValue({
      data: [product],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await useCase.execute({
      query: 'biscoito',
      avoidAllergens: ['GLUTEN'],
      partnerId: 'partner-1',
    });

    expect(result.isSuccess).toBe(true);
    const paginated = result.getValue();
    expect(paginated.total).toBe(1);
    expect(paginated.data[0].partnerId).toBe('partner-1');
    expect(repository.search).toHaveBeenCalledWith({
      term: 'biscoito',
      page: 1,
      limit: 20,
      avoidAllergens: ['GLUTEN'],
      partnerId: 'partner-1',
    });
  });

  it('deve calcular compatibilidade alimentar se userIdForCompatibility for fornecido', async () => {
    const product = Product.create({
      name: 'Pão sem Glúten',
      brand: 'Marca SemG',
      ingredients: 'Farinha de arroz, água, sal',
      hasGluten: false,
      crossContamination: 'Pode conter traços de leite',
    }).getValue();

    repository.search.mockResolvedValue({
      data: [product],
      total: 1,
      page: 1,
      limit: 20,
    });

    // Perfil com restrição à lactose (leite) nível HIGH
    const restriction = Restriction.create({
      allergen: AllergenType.LACTOSE,
      severity: SeverityLevel.HIGH,
    }).getValue();
    const profile = FoodProfile.create({
      userId: 'user-1',
      restrictions: [restriction],
    }).getValue();

    foodProfileRepository.findByUserId.mockResolvedValue(profile);

    const result = await useCase.execute({
      query: 'pão',
      userIdForCompatibility: 'user-1',
    });

    expect(result.isSuccess).toBe(true);
    const paginated = result.getValue();
    expect(paginated.data[0].compatibilityReport).toBeDefined();
    
    // Risco deve ser WARNING pois leite (lactose) está na contaminação cruzada para severidade HIGH
    expect(paginated.data[0].compatibilityReport?.riskLevel).toBe('WARNING');
    expect(paginated.data[0].compatibilityReport?.isCompatible).toBe(false);
  });

  it('deve aplicar exclusão de alérgenos se onlyCompatible for true', async () => {
    repository.search.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    // Perfil com restrição à lactose
    const restriction = Restriction.create({
      allergen: AllergenType.LACTOSE,
      severity: SeverityLevel.HIGH,
    }).getValue();
    const profile = FoodProfile.create({
      userId: 'user-1',
      restrictions: [restriction],
    }).getValue();

    foodProfileRepository.findByUserId.mockResolvedValue(profile);

    await useCase.execute({
      userIdForCompatibility: 'user-1',
      onlyCompatible: true,
    });

    expect(repository.search).toHaveBeenCalledWith(expect.objectContaining({
      avoidAllergens: ['LACTOSE'],
    }));
  });
});
