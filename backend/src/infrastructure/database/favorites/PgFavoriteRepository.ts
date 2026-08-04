// backend/src/infrastructure/database/favorites/PgFavoriteRepository.ts
import { Pool } from 'pg';
import { IFavoriteRepository, FavoriteWithDetails } from '../../../domain/favorites/repositories/IFavoriteRepository';
import { Favorite } from '../../../domain/favorites/Favorite';

interface FavoriteRow {
  id:                 string;
  user_id:            string;
  product_id:         string | null;
  partner_id:         string | null;
  created_at:         Date;
  product_name?:      string | null;
  product_brand?:     string | null;
  product_category?:  string | null;
  product_image_url?: string | null;
  product_price?:     number | null;
  partner_name?:      string | null;
  partner_type?:      string | null;
  partner_city?:      string | null;
  partner_state?:     string | null;
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

  async findByUser(userId: string): Promise<FavoriteWithDetails[]> {
    const result = await this.pool.query(
      `SELECT 
         uf.id,
         uf.user_id,
         uf.product_id,
         uf.partner_id,
         uf.created_at,
         pr.name AS product_name,
         pr.brand AS product_brand,
         pr.category AS product_category,
         pr.image_url AS product_image_url,
         pr.price AS product_price,
         pa.name AS partner_name,
         pa.type AS partner_type,
         pa.city AS partner_city,
         pa.state AS partner_state
       FROM user_favorites uf
       LEFT JOIN products pr ON uf.product_id = pr.id
       LEFT JOIN partners pa ON uf.partner_id = pa.id
       WHERE uf.user_id = $1 
       ORDER BY uf.created_at DESC`,
      [userId]
    );

    return result.rows.map(row => {
      const favorite = this.mapRowToFavorite(row);
      const product = row.product_id && row.product_name ? {
        id: row.product_id,
        name: row.product_name,
        brand: row.product_brand || undefined,
        category: row.product_category || undefined,
        imageUrl: row.product_image_url || undefined,
        price: row.product_price ? Number(row.product_price) : undefined,
      } : undefined;

      const partner = row.partner_id && row.partner_name ? {
        id: row.partner_id,
        name: row.partner_name,
        type: row.partner_type || undefined,
        city: row.partner_city || undefined,
        state: row.partner_state || undefined,
      } : undefined;

      return {
        favorite,
        product,
        partner,
      };
    });
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
