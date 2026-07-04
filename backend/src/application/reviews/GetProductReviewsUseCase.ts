import { IReviewRepository } from '../../domain/reviews/repositories/IReviewRepository';
import { Result } from '../../domain/Result';

export interface GetProductReviewsResponse {
  productId: string;
  totalReviews: number;
  averageRating: number;
  reviews: Array<{
    id: string;
    userId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
  }>;
}

export class GetProductReviewsUseCase {
  constructor(private reviewRepo: IReviewRepository) {}

  public async execute(productId: string): Promise<Result<GetProductReviewsResponse>> {
    if (!productId) {
      return Result.fail<GetProductReviewsResponse>('ID do produto é obrigatório.');
    }

    const reviews = await this.reviewRepo.findByProduct(productId);
    
    const totalReviews = reviews.length;
    let averageRating = 0;

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    const response: GetProductReviewsResponse = {
      productId,
      totalReviews,
      averageRating,
      reviews: reviews.map(r => ({
        id: r.id,
        userId: r.userId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };

    return Result.ok<GetProductReviewsResponse>(response);
  }
}
