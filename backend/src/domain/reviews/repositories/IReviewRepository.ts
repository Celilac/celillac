import { Review } from '../Review';

export interface IReviewRepository {
  save(review: Review): Promise<void>;
  findByUserAndProduct(userId: string, productId: string): Promise<Review | null>;
  findByProduct(productId: string): Promise<Review[]>;
}
