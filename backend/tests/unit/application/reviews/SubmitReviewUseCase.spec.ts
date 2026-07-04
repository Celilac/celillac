import { SubmitReviewUseCase } from '../../../../../src/application/reviews/SubmitReviewUseCase';
import { IReviewRepository } from '../../../../../src/domain/reviews/repositories/IReviewRepository';
import { IProductRepository } from '../../../../../src/domain/catalog/repositories/IProductRepository';
import { Product } from '../../../../../src/domain/catalog/Product';
import { Review } from '../../../../../src/domain/reviews/Review';

describe('SubmitReviewUseCase', () => {
  let submitReviewUseCase: SubmitReviewUseCase;
  let mockReviewRepo: jest.Mocked<IReviewRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockReviewRepo = {
      save: jest.fn(),
      findByUserAndProduct: jest.fn(),
      findByProduct: jest.fn(),
    };

    mockProductRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
    };

    submitReviewUseCase = new SubmitReviewUseCase(mockReviewRepo, mockProductRepo);
  });

  it('deve submeter uma avaliação com sucesso para um produto existente', async () => {
    // Produto existe
    mockProductRepo.findById.mockResolvedValue(
      Product.create({ name: 'Pão', ingredients: 'Farinha', hasGluten: true, crossContamination: '' }).getValue()
    );

    // Usuário não avaliou ainda
    mockReviewRepo.findByUserAndProduct.mockResolvedValue(null);

    const result = await submitReviewUseCase.execute({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 4,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockReviewRepo.save).toHaveBeenCalledTimes(1);
    expect(result.getValue().rating).toBe(4);
  });

  it('deve atualizar a avaliação se o usuário já avaliou o produto', async () => {
    mockProductRepo.findById.mockResolvedValue(
      Product.create({ name: 'Pão', ingredients: 'Farinha', hasGluten: true, crossContamination: '' }).getValue()
    );

    const existingReview = Review.create({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 3,
    }, 'review-1').getValue();

    mockReviewRepo.findByUserAndProduct.mockResolvedValue(existingReview);

    const result = await submitReviewUseCase.execute({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 5,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().id).toBe('review-1'); // O ID foi preservado (upsert)
    expect(result.getValue().rating).toBe(5);
  });

  it('deve falhar se o produto não existir', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    const result = await submitReviewUseCase.execute({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 4,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Produto não encontrado no catálogo.');
  });
});
