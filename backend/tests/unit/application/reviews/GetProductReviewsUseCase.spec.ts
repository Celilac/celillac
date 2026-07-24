import { GetProductReviewsUseCase } from '../../../../src/application/reviews/GetProductReviewsUseCase';
import { IReviewRepository } from '../../../../src/domain/reviews/repositories/IReviewRepository';
import { Review } from '../../../../src/domain/reviews/Review';

describe('GetProductReviewsUseCase', () => {
  let getProductReviewsUseCase: GetProductReviewsUseCase;
  let mockReviewRepo: jest.Mocked<IReviewRepository>;

  beforeEach(() => {
    mockReviewRepo = {
      save: jest.fn(),
      findByUserAndProduct: jest.fn(),
      findByProduct: jest.fn(),
      findByUserAndPartner: jest.fn(),
      findByPartner: jest.fn(),
    };

    getProductReviewsUseCase = new GetProductReviewsUseCase(mockReviewRepo);
  });

  it('deve retornar as avaliações de um produto e a média calculada', async () => {
    const r1 = Review.create({ userId: 'u1', productId: 'p1', rating: 5 }).getValue();
    const r2 = Review.create({ userId: 'u2', productId: 'p1', rating: 4 }).getValue();
    
    mockReviewRepo.findByProduct.mockResolvedValue([r1, r2]);

    const result = await getProductReviewsUseCase.execute('p1');

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.productId).toBe('p1');
    expect(data.totalReviews).toBe(2);
    expect(data.averageRating).toBe(4.5);
    expect(data.reviews).toHaveLength(2);
  });

  it('deve retornar média 0 se não houver avaliações', async () => {
    mockReviewRepo.findByProduct.mockResolvedValue([]);

    const result = await getProductReviewsUseCase.execute('p1');

    expect(result.isSuccess).toBe(true);
    const data = result.getValue();
    expect(data.totalReviews).toBe(0);
    expect(data.averageRating).toBe(0);
  });
});
