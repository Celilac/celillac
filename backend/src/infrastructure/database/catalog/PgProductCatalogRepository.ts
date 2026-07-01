// backend/src/infrastructure/database/catalog/PgProductCatalogRepository.ts
import { Pool } from 'pg';
import { IProductCatalogRepository, PaginatedResult, SearchProductQuery } from '../../../domain/catalog/repositories/IProductCatalogRepository';
import { Product, AnalysisStatus } from '../../../domain/catalog/Product';

export class PgProductCatalogRepository implements IProductCatalogRepository {
  constructor(private readonly pool: Pool) {}

  async create(product: Product): Promise<void> {
    await this.pool.query(
      `INSERT INTO products (id, name, brand, ingredients, has_gluten, cross_contamination, analysis_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        product.id,
        product.name,
        product.brand,
        product.ingredients,
        product.hasGluten,
        product.crossContamination,
        product.analysisStatus,
      ]
    );
  }

  async search(query: SearchProductQuery): Promise<PaginatedResult<Product>> {
    const { term, page, limit } = query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams: any[] = [];

    if (term) {
      whereClause = 'WHERE name ILIKE $1 OR brand ILIKE $1';
      queryParams.push(`%${term}%`);
    }

    // Conta total
    const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Busca dados com paginação
    const dataQuery = `
      SELECT id, name, brand, ingredients, has_gluten, cross_contamination, analysis_status
      FROM products
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    const dataParams = [...queryParams, limit, offset];
    const dataResult = await this.pool.query(dataQuery, dataParams);

    const data = dataResult.rows.map((row) =>
      Product.create(
        {
          name:               row.name,
          brand:              row.brand,
          ingredients:        row.ingredients,
          hasGluten:          row.has_gluten,
          crossContamination: row.cross_contamination,
          analysisStatus:     row.analysis_status as AnalysisStatus,
        },
        row.id
      ).getValue()
    );

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
