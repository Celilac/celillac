import { Review } from '../../../../../src/domain/reviews/Review';

describe('Review Entity', () => {
  it('deve criar uma avaliação válida com nota 5', () => {
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
  });

  it('deve falhar se a nota for menor que 1', () => {
    const reviewOrError = Review.create({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 0,
    });

    expect(reviewOrError.isFailure).toBe(true);
    expect(reviewOrError.error).toBe('A avaliação deve ser entre 1 e 5 estrelas.');
  });

  it('deve falhar se a nota for maior que 5', () => {
    const reviewOrError = Review.create({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 6,
    });

    expect(reviewOrError.isFailure).toBe(true);
    expect(reviewOrError.error).toBe('A avaliação deve ser entre 1 e 5 estrelas.');
  });
});
