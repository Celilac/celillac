// backend/src/infrastructure/database/product/PgProductRepository.ts
import { Pool } from 'pg';
import { IProductRepository } from '../../../domain/allergen-engine/repositories/IProductRepository';
import { ProductSnapshot } from '../../../domain/allergen-engine/ProductSnapshot';

export class PgProductRepository implements IProductRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<ProductSnapshot | null> {
    const query = `
      SELECT id, name, ingredients, has_gluten, cross_contamination
      FROM products
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id:                 row.id,
      name:               row.name,
      ingredients:        row.ingredients,
      hasGluten:          row.has_gluten,
      crossContamination: row.cross_contamination,
    };
  }
}
