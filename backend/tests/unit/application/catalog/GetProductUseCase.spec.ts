// backend/tests/unit/application/catalog/GetProductUseCase.spec.ts
import { GetProductUseCase } from '../../../../src/application/catalog/GetProductUseCase';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { IFoodProfileRepository } from '../../../../src/domain/food-profile/repositories/IFoodProfileRepository';
import { Product } from '../../../../src/domain/catalog/Product';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';

describe('GetProductUseCase', () => {
  let repository: jest.Mocked<IProductCatalogRepository>;
  let foodProfileRepository: jest.Mocked<IFoodProfileRepository>;
  let useCase: GetProductUseCase;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      search: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    foodProfileRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    useCase = new GetProductUseCase(repository, foodProfileRepository);
  });

  it('deve buscar um produto por ID e retornar seus detalhes', async () => {
    const product = Product.create({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha de arroz, chocolate',
      hasGluten: false,
      crossContamination: '',
      partnerId: 'partner-1',
    }, 'prod-1').getValue();

    repository.findById.mockResolvedValue(product);

    const result = await useCase.execute({ id: 'prod-1' });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.id).toBe('prod-1');
    expect(data.name).toBe('Biscoito');
    expect(data.compatibilityReport).toBeUndefined();
  });

  it('deve calcular compatibilidade alimentar se userIdForCompatibility for fornecido', async () => {
    const product = Product.create({
      name: 'Pão sem Glúten',
      brand: 'Marca SemG',
      ingredients: 'Farinha de arroz, água, sal',
      hasGluten: false,
      crossContamination: 'Pode conter traços de leite',
    }, 'prod-1').getValue();

    repository.findById.mockResolvedValue(product);

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
      id: 'prod-1',
      userIdForCompatibility: 'user-1',
    });

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.compatibilityReport).toBeDefined();
    expect(data.compatibilityReport?.riskLevel).toBe('WARNING');
    expect(data.compatibilityReport?.isCompatible).toBe(false);
  });

  it('deve falhar se o produto não existir', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ id: 'prod-inexistente' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Produto não encontrado.');
  });
});
