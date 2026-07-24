import { Review } from '../Review';

export interface IReviewRepository {
  save(review: Review): Promise<void>;
  findByUserAndProduct(userId: string, productId: string): Promise<Review | null>;
  findByProduct(productId: string): Promise<Review[]>;
  findByUserAndPartner(userId: string, partnerId: string): Promise<Review | null>;
  findByPartner(partnerId: string): Promise<Review[]>;
}
