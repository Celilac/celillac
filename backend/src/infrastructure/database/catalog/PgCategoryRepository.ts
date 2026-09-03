// backend/src/infrastructure/database/catalog/PgCategoryRepository.ts
import { Pool } from 'pg';
import { ICategoryRepository, AdminCategoryFilter } from '../../../domain/catalog/repositories/ICategoryRepository';
import { Category, CategoryStatus, CategoryVisibility } from '../../../domain/catalog/Category';

export class PgCategoryRepository implements ICategoryRepository {
  constructor(private readonly pool: Pool) {}

  private mapRowToCategory(row: any): Category {
    return Category.create(
      {
        name: row.name,
        partnerId: row.partner_id || undefined,
        createdByUserId: row.created_by_user_id || undefined,
        status: row.status as CategoryStatus,
        visibility: row.visibility as CategoryVisibility,
        rejectionReason: row.rejection_reason || undefined,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      },
      row.id
    ).getValue();
  }

  async create(category: Category): Promise<void> {
    await this.pool.query(
      `INSERT INTO product_categories (
        id, name, normalized_name, partner_id, created_by_user_id, status, visibility, rejection_reason, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        category.id,
        category.name,
        category.normalizedName,
        category.partnerId || null,
        category.createdByUserId || null,
        category.status,
        category.visibility,
        category.rejectionReason || null,
        category.createdAt,
        category.updatedAt,
      ]
    );
  }

  async findById(id: string): Promise<Category | null> {
    const result = await this.pool.query(
      `SELECT id, name, normalized_name, partner_id, created_by_user_id, status, visibility, rejection_reason, created_at, updated_at
       FROM product_categories
       WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCategory(result.rows[0]);
  }

  async findByNormalizedName(normalizedName: string, partnerId?: string): Promise<Category | null> {
    const result = await this.pool.query(
      `SELECT id, name, normalized_name, partner_id, created_by_user_id, status, visibility, rejection_reason, created_at, updated_at
       FROM product_categories
       WHERE normalized_name = $1
         AND (visibility = 'GLOBAL' OR partner_id = $2 OR ($2 IS NULL AND partner_id IS NULL))
       LIMIT 1`,
      [normalizedName, partnerId || null]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCategory(result.rows[0]);
  }

  async update(category: Category): Promise<void> {
    await this.pool.query(
      `UPDATE product_categories
       SET name = $1,
           normalized_name = $2,
           partner_id = $3,
           status = $4,
           visibility = $5,
           rejection_reason = $6,
           updated_at = $7
       WHERE id = $8`,
      [
        category.name,
        category.normalizedName,
        category.partnerId || null,
        category.status,
        category.visibility,
        category.rejectionReason || null,
        category.updatedAt,
        category.id,
      ]
    );
  }

  async listAvailableForPartner(partnerId?: string): Promise<Category[]> {
    let query: string;
    let params: any[] = [];

    if (partnerId) {
      query = `
        SELECT id, name, normalized_name, partner_id, created_by_user_id, status, visibility, rejection_reason, created_at, updated_at
        FROM product_categories
        WHERE (visibility = 'GLOBAL' AND status = 'APPROVED')
           OR (partner_id = $1)
        ORDER BY name ASC
      `;
      params = [partnerId];
    } else {
      query = `
        SELECT id, name, normalized_name, partner_id, created_by_user_id, status, visibility, rejection_reason, created_at, updated_at
        FROM product_categories
        WHERE visibility = 'GLOBAL' AND status = 'APPROVED'
        ORDER BY name ASC
      `;
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapRowToCategory(row));
  }

  async listPublicCategories(): Promise<Category[]> {
    const result = await this.pool.query(
      `SELECT id, name, normalized_name, partner_id, created_by_user_id, status, visibility, rejection_reason, created_at, updated_at
       FROM product_categories
       WHERE status = 'APPROVED' AND visibility = 'GLOBAL'
       ORDER BY name ASC`
    );
    return result.rows.map((row) => this.mapRowToCategory(row));
  }

  async listAllForAdmin(filter?: AdminCategoryFilter): Promise<Category[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter?.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }

    if (filter?.visibility) {
      params.push(filter.visibility);
      conditions.push(`visibility = $${params.length}`);
    }

    if (filter?.partnerId) {
      params.push(filter.partnerId);
      conditions.push(`partner_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT id, name, normalized_name, partner_id, created_by_user_id, status, visibility, rejection_reason, created_at, updated_at
      FROM product_categories
      ${whereClause}
      ORDER BY CASE WHEN status = 'PENDING_APPROVAL' THEN 0 ELSE 1 END, created_at DESC
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapRowToCategory(row));
  }
}
