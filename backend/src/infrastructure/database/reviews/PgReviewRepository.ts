import { Pool } from 'pg';
import { IReviewRepository } from '../../../domain/reviews/repositories/IReviewRepository';
import { Review } from '../../../domain/reviews/Review';

interface ReviewRow {
  id: string;
  user_id: string;
  product_id: string | null;
  partner_id: string | null;
  rating: number;
  comment: string | null;
  created_at: Date;
}

export class PgReviewRepository implements IReviewRepository {
  constructor(private readonly pool: Pool) {}

  async save(review: Review): Promise<void> {
    await this.pool.query(
      `INSERT INTO product_reviews (id, user_id, product_id, partner_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id)
       DO UPDATE SET 
         rating = EXCLUDED.rating, 
         comment = EXCLUDED.comment, 
         created_at = EXCLUDED.created_at`,
      [
        review.id,
        review.userId,
        review.productId || null,
        review.partnerId || null,
        review.rating,
        review.comment || null,
        review.createdAt,
      ]
    );
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<Review | null> {
    const result = await this.pool.query(
      'SELECT * FROM product_reviews WHERE user_id = $1 AND product_id = $2 LIMIT 1',
      [userId, productId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToReview(result.rows[0]);
  }

  async findByUserAndPartner(userId: string, partnerId: string): Promise<Review | null> {
    const result = await this.pool.query(
      'SELECT * FROM product_reviews WHERE user_id = $1 AND partner_id = $2 LIMIT 1',
      [userId, partnerId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToReview(result.rows[0]);
  }

  async findByProduct(productId: string): Promise<Review[]> {
    const result = await this.pool.query(
      'SELECT * FROM product_reviews WHERE product_id = $1 ORDER BY created_at DESC',
      [productId]
    );

    return result.rows.map(row => this.mapRowToReview(row));
  }

  async findByPartner(partnerId: string): Promise<Review[]> {
    const result = await this.pool.query(
      'SELECT * FROM product_reviews WHERE partner_id = $1 ORDER BY created_at DESC',
      [partnerId]
    );

    return result.rows.map(row => this.mapRowToReview(row));
  }

  private mapRowToReview(row: ReviewRow): Review {
    return Review.create(
      {
        userId: row.user_id,
        productId: row.product_id || undefined,
        partnerId: row.partner_id || undefined,
        rating: row.rating,
        comment: row.comment || undefined,
        createdAt: row.created_at,
      },
      row.id
    ).getValue();
  }
}
