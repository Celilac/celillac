// backend/src/infrastructure/database/favorites/PgFavoriteRepository.ts
import { Pool } from 'pg';
import { IFavoriteRepository } from '../../../domain/favorites/repositories/IFavoriteRepository';
import { Favorite } from '../../../domain/favorites/Favorite';

interface FavoriteRow {
  id:         string;
  user_id:    string;
  product_id: string | null;
  partner_id: string | null;
  created_at: Date;
}

export class PgFavoriteRepository implements IFavoriteRepository {
  constructor(private readonly pool: Pool) {}

  async save(favorite: Favorite): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_favorites (id, user_id, product_id, partner_id, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, product_id) DO NOTHING`, // Evita duplicados em inserções paralelas
      [
        favorite.id,
        favorite.userId,
        favorite.productId || null,
        favorite.partnerId || null,
        favorite.createdAt,
      ]
    );
  }

  async delete(userId: string, targetId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM user_favorites 
       WHERE user_id = $1 AND (product_id = $2 OR partner_id = $2)`,
      [userId, targetId]
    );
  }

  async findByUser(userId: string): Promise<Favorite[]> {
    const result = await this.pool.query(
      `SELECT * FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => this.mapRowToFavorite(row));
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<Favorite | null> {
    const result = await this.pool.query(
      `SELECT * FROM user_favorites WHERE user_id = $1 AND product_id = $2 LIMIT 1`,
      [userId, productId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToFavorite(result.rows[0]);
  }

  async findByUserAndPartner(userId: string, partnerId: string): Promise<Favorite | null> {
    const result = await this.pool.query(
      `SELECT * FROM user_favorites WHERE user_id = $1 AND partner_id = $2 LIMIT 1`,
      [userId, partnerId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToFavorite(result.rows[0]);
  }

  private mapRowToFavorite(row: FavoriteRow): Favorite {
    return Favorite.create(
      {
        userId: row.user_id,
        productId: row.product_id || undefined,
        partnerId: row.partner_id || undefined,
        createdAt: row.created_at,
      },
      row.id
    ).getValue();
  }
}
