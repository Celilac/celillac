// backend/tests/unit/application/catalog/CreateProductUseCase.spec.ts
import { CreateProductUseCase } from '../../../../src/application/catalog/CreateProductUseCase';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';

describe('CreateProductUseCase', () => {
  let repository: jest.Mocked<IProductCatalogRepository>;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      search: jest.fn(),
    };
    useCase = new CreateProductUseCase(repository);
  });

  it('deve criar um produto com sucesso', async () => {
    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.create).toHaveBeenCalled();
    const product = result.getValue();
    expect(product.analysisStatus).toBe('ANALISADO');
  });

  it('deve falhar se os dados do produto forem inválidos', async () => {
    const result = await useCase.execute({
      name: '',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('nome do produto é obrigatório');
    expect(repository.create).not.toHaveBeenCalled();
  });
});
