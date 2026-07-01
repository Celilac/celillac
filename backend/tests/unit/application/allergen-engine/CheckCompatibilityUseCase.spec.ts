// backend/tests/unit/application/allergen-engine/CheckCompatibilityUseCase.spec.ts
import { CheckCompatibilityUseCase } from '../../../../src/application/allergen-engine/CheckCompatibilityUseCase';
import { IFoodProfileRepository } from '../../../../src/domain/food-profile/repositories/IFoodProfileRepository';
import { IProductRepository } from '../../../../src/domain/allergen-engine/repositories/IProductRepository';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { ProductSnapshot } from '../../../../src/domain/allergen-engine/ProductSnapshot';
import { RiskLevel } from '../../../../src/domain/allergen-engine/RiskLevel';

describe('CheckCompatibilityUseCase', () => {
  let profileRepository: jest.Mocked<IFoodProfileRepository>;
  let productRepository: jest.Mocked<IProductRepository>;
  let useCase: CheckCompatibilityUseCase;

  beforeEach(() => {
    profileRepository = {
      save: jest.fn(),
      update: jest.fn(),
      findByUserId: jest.fn(),
    };
    productRepository = {
      findById: jest.fn(),
    };
    useCase = new CheckCompatibilityUseCase(profileRepository, productRepository);
  });

  it('deve retornar erro se o perfil não for encontrado', async () => {
    profileRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'user-id', productId: 'prod-id' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Perfil alimentar não encontrado para o usuário.');
  });

  it('deve retornar erro se o produto não for encontrado', async () => {
    profileRepository.findByUserId.mockResolvedValue(FoodProfile.create({ userId: 'user-id', restrictions: [] }).getValue());
    productRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'user-id', productId: 'prod-id' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Produto não encontrado.');
  });

  it('deve verificar a compatibilidade e retornar o relatório (SAFE)', async () => {
    profileRepository.findByUserId.mockResolvedValue(FoodProfile.create({ userId: 'user-id', restrictions: [] }).getValue());
    const mockProduct: ProductSnapshot = {
      id: 'prod-id',
      name: 'Arroz',
      ingredients: 'Arroz cru',
      hasGluten: false,
      crossContamination: '',
    };
    productRepository.findById.mockResolvedValue(mockProduct);

    const result = await useCase.execute({ userId: 'user-id', productId: 'prod-id' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().isCompatible).toBe(true);
    expect(result.getValue().riskLevel).toBe(RiskLevel.SAFE);
  });
});
