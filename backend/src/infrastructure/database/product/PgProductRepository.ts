import { Pool } from 'pg';
import { IProductRepository } from '../../../domain/allergen-engine/repositories/IProductRepository';
import { ProductSnapshot, ProductCertificationSnapshot } from '../../../domain/allergen-engine/ProductSnapshot';

export class PgProductRepository implements IProductRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<ProductSnapshot | null> {
    const query = `
      SELECT id, name, ingredients, has_gluten, cross_contamination,
             declared_allergens, cross_contamination_details, information_origin
      FROM products
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    const certsQuery = `
      SELECT certification_type, certifying_entity, certificate_code, valid_until, verification_status
      FROM product_certifications
      WHERE product_id = $1
    `;
    const certsResult = await this.pool.query(certsQuery, [id]);
    const certifications: ProductCertificationSnapshot[] = certsResult.rows.map((c) => ({
      certificationType: c.certification_type,
      certifyingEntity:  c.certifying_entity,
      certificateCode:   c.certificate_code,
      validUntil:        c.valid_until ? (c.valid_until instanceof Date ? c.valid_until.toISOString().slice(0, 10) : String(c.valid_until)) : undefined,
      isVerified:        c.verification_status === 'VERIFIED_BY_CELILAC',
    }));

    return {
      id:                         row.id,
      name:                       row.name,
      ingredients:                row.ingredients,
      hasGluten:                  row.has_gluten,
      crossContamination:         row.cross_contamination,
      declaredAllergens:          typeof row.declared_allergens === 'string' ? JSON.parse(row.declared_allergens) : (row.declared_allergens || {}),
      crossContaminationDetails:  typeof row.cross_contamination_details === 'string' ? JSON.parse(row.cross_contamination_details) : (row.cross_contamination_details || undefined),
      certifications,
      informationOrigin:          row.information_origin,
    };
  }
}
