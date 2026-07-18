// backend/src/infrastructure/database/catalog/PgProductCatalogRepository.ts
import { Pool } from 'pg';
import { IProductCatalogRepository, PaginatedResult, SearchProductQuery } from '../../../domain/catalog/repositories/IProductCatalogRepository';
import { Product, AnalysisStatus } from '../../../domain/catalog/Product';
import { AllergenType, ALLERGEN_SEARCH_TERMS } from '../../../domain/food-profile/value-objects/AllergenType';

export class PgProductCatalogRepository implements IProductCatalogRepository {
  constructor(private readonly pool: Pool) {}

  async create(product: Product): Promise<void> {
    await this.pool.query(
      `INSERT INTO products (id, name, brand, ingredients, has_gluten, cross_contamination, analysis_status, partner_id, price, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        product.id,
        product.name,
        product.brand,
        product.ingredients,
        product.hasGluten,
        product.crossContamination,
        product.analysisStatus,
        product.partnerId || null,
        product.price,
        product.category,
        product.imageUrl || null,
      ]
    );
  }

  async search(query: SearchProductQuery): Promise<PaginatedResult<Product>> {
    const { term, page, limit, avoidAllergens, partnerId } = query;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const queryParams: any[] = [];

    if (term) {
      queryParams.push(`%${term}%`);
      conditions.push(`(name ILIKE $${queryParams.length} OR brand ILIKE $${queryParams.length})`);
    }

    if (partnerId) {
      queryParams.push(partnerId);
      conditions.push(`partner_id = $${queryParams.length}`);
    }

    if (avoidAllergens && avoidAllergens.length > 0) {
      const exclusions: string[] = [];
      for (const allergen of avoidAllergens) {
        const upperAllergen = allergen.toUpperCase() as AllergenType;
        const terms = ALLERGEN_SEARCH_TERMS[upperAllergen];
        if (!terms) continue;

        const allergenConditions: string[] = [];

        if (upperAllergen === AllergenType.GLUTEN) {
          allergenConditions.push('has_gluten = TRUE');
        }

        for (const t of terms) {
          queryParams.push(`%${t}%`);
          allergenConditions.push(`ingredients ILIKE $${queryParams.length}`);
          allergenConditions.push(`cross_contamination ILIKE $${queryParams.length}`);
        }

        if (allergenConditions.length > 0) {
          exclusions.push(`(${allergenConditions.join(' OR ')})`);
        }
      }

      if (exclusions.length > 0) {
        conditions.push(`NOT (${exclusions.join(' OR ')})`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Conta total
    const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Busca dados com paginação
    const dataQuery = `
      SELECT id, name, brand, ingredients, has_gluten, cross_contamination, analysis_status, partner_id, price, category, image_url
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
          partnerId:          row.partner_id || undefined,
          price:              row.price ? parseFloat(row.price) : 0,
          category:           row.category,
          imageUrl:           row.image_url || undefined,
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
