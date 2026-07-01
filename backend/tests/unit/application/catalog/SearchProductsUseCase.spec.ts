// backend/tests/unit/application/catalog/SearchProductsUseCase.spec.ts
import { SearchProductsUseCase } from '../../../../src/application/catalog/SearchProductsUseCase';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { Product } from '../../../../src/domain/catalog/Product';

describe('SearchProductsUseCase', () => {
  let repository: jest.Mocked<IProductCatalogRepository>;
  let useCase: SearchProductsUseCase;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      search: jest.fn(),
    };
    useCase = new SearchProductsUseCase(repository);
  });

  it('deve buscar produtos e retornar os dados paginados', async () => {
    const product = Product.create({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
    }).getValue();

    repository.search.mockResolvedValue({
      data: [product],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await useCase.execute({ query: 'biscoito' });

    expect(result.isSuccess).toBe(true);
    const paginated = result.getValue();
    expect(paginated.total).toBe(1);
    expect(paginated.data).toHaveLength(1);
    expect(paginated.data[0].name).toBe('Biscoito');
    expect(repository.search).toHaveBeenCalledWith({ term: 'biscoito', page: 1, limit: 20 });
  });

  it('deve aplicar valores default para paginação e termo', async () => {
    repository.search.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(repository.search).toHaveBeenCalledWith({ term: '', page: 1, limit: 20 });
  });
});
