import { Review } from '../../../../src/domain/reviews/Review';

describe('Review Entity', () => {
  it('deve criar uma avaliação válida de produto com nota 5', () => {
    const reviewOrError = Review.create({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 5,
      comment: 'Ótimo produto',
    });

    expect(reviewOrError.isSuccess).toBe(true);
    const review = reviewOrError.getValue();
    expect(review.rating).toBe(5);
    expect(review.comment).toBe('Ótimo produto');
    expect(review.productId).toBe('prod-1');
    expect(review.partnerId).toBeUndefined();
  });

  it('deve criar uma avaliação válida de parceiro comercial', () => {
    const reviewOrError = Review.create({
      userId: 'user-1',
      partnerId: 'partner-1',
      rating: 4,
      comment: 'Excelente estabelecimento',
    });

    expect(reviewOrError.isSuccess).toBe(true);
    const review = reviewOrError.getValue();
    expect(review.rating).toBe(4);
    expect(review.comment).toBe('Excelente estabelecimento');
    expect(review.partnerId).toBe('partner-1');
    expect(review.productId).toBeUndefined();
  });

  it('deve falhar se não houver associação a produto nem a parceiro', () => {
    const reviewOrError = Review.create({
      userId: 'user-1',
      rating: 3,
    });

    expect(reviewOrError.isFailure).toBe(true);
    expect(reviewOrError.getError()).toContain('associada a um produto ou a um parceiro comercial');
  });

  it('deve falhar se a nota for menor que 1', () => {
    const reviewOrError = Review.create({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 0,
    });

    expect(reviewOrError.isFailure).toBe(true);
    expect(reviewOrError.getError()).toBe('A avaliação deve ser entre 1 e 5 estrelas.');
  });

  it('deve falhar se a nota for maior que 5', () => {
    const reviewOrError = Review.create({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 6,
    });

    expect(reviewOrError.isFailure).toBe(true);
    expect(reviewOrError.getError()).toBe('A avaliação deve ser entre 1 e 5 estrelas.');
  });
});
