// backend/tests/unit/application/reviews/GetPartnerReviewsUseCase.spec.ts
import { GetPartnerReviewsUseCase } from '../../../../src/application/reviews/GetPartnerReviewsUseCase';
import { IReviewRepository } from '../../../../src/domain/reviews/repositories/IReviewRepository';
import { Review } from '../../../../src/domain/reviews/Review';

describe('GetPartnerReviewsUseCase', () => {
  let mockReviewRepo: jest.Mocked<IReviewRepository>;
  let useCase: GetPartnerReviewsUseCase;

  beforeEach(() => {
    mockReviewRepo = {
      save: jest.fn(),
      findByUserAndProduct: jest.fn(),
      findByProduct: jest.fn(),
      findByUserAndPartner: jest.fn(),
      findByPartner: jest.fn(),
    };
    useCase = new GetPartnerReviewsUseCase(mockReviewRepo);
  });

  it('deve listar avaliações de um parceiro com sucesso', async () => {
    const review = Review.create({
      userId: 'user-1',
      partnerId: 'partner-1',
      rating: 4,
      comment: 'Recomendo!',
    }).getValue();

    mockReviewRepo.findByPartner.mockResolvedValue([review]);

    const result = await useCase.execute('partner-1');

    expect(result.isSuccess).toBe(true);
    const reviews = result.getValue();
    expect(reviews).toHaveLength(1);
    expect(reviews[0].comment).toBe('Recomendo!');
    expect(mockReviewRepo.findByPartner).toHaveBeenCalledWith('partner-1');
  });

  it('deve falhar se o partnerId for vazio', async () => {
    const result = await useCase.execute('  ');

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('ID do parceiro comercial é obrigatório');
    expect(mockReviewRepo.findByPartner).not.toHaveBeenCalled();
  });
});
