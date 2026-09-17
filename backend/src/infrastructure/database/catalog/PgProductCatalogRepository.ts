// backend/src/infrastructure/database/catalog/PgProductCatalogRepository.ts
import { Pool } from 'pg';
import { IProductCatalogRepository, PaginatedResult, SearchProductQuery } from '../../../domain/catalog/repositories/IProductCatalogRepository';
import { Product, AnalysisStatus, CommercialOrigin, PublicationStatus } from '../../../domain/catalog/Product';
import { ProductImageType } from '../../../domain/catalog/ProductImage';
import { AllergenType, ALLERGEN_SEARCH_TERMS } from '../../../domain/food-profile/value-objects/AllergenType';

export class PgProductCatalogRepository implements IProductCatalogRepository {
  constructor(private readonly pool: Pool) {}

  async create(product: Product): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO products (
          id, name, brand, ingredients, has_gluten, cross_contamination, analysis_status,
          partner_id, price, category, image_url, is_active,
          short_description, net_content, unit_of_measure, sku, ean,
          commercial_origin, may_contain_traces, composition_notes, publication_status,
          declared_allergens, cross_contamination_details, dietary_features, information_origin, nutritional_info
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
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
          product.isActive,
          product.shortDescription || null,
          product.netContent !== undefined ? product.netContent : null,
          product.unitOfMeasure || null,
          product.sku || null,
          product.ean || null,
          product.commercialOrigin,
          product.mayContainTraces,
          product.compositionNotes || null,
          product.publicationStatus,
          JSON.stringify(product.declaredAllergens || {}),
          product.crossContaminationDetails ? JSON.stringify(product.crossContaminationDetails) : null,
          product.dietaryFeatures || [],
          product.informationOrigin || 'PARTNER_DECLARED',
          product.nutritionalInfo ? JSON.stringify(product.nutritionalInfo) : null,
        ]
      );

      // Persiste as imagens da galeria funcional
      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          await client.query(
            `INSERT INTO product_images (
              id, product_id, url, image_type, caption, display_order, is_cover
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              img.id,
              product.id,
              img.url,
              img.imageType,
              img.caption || null,
              img.displayOrder,
              img.isCover,
            ]
          );
        }
      }

      // Persiste os selos e certificações oficiais da Fase 3
      if (product.certifications && product.certifications.length > 0) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        for (const cert of product.certifications) {
          const safeImageId = cert.imageId && uuidRegex.test(cert.imageId) ? cert.imageId : null;

          await client.query(
            `INSERT INTO product_certifications (
              id, product_id, certification_type, certifying_entity, certificate_code,
              valid_until, image_id, verification_status, verification_notes
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              cert.id,
              product.id,
              cert.certificationType,
              cert.certifyingEntity,
              cert.certificateCode || null,
              cert.validUntil || null,
              safeImageId,
              cert.verificationStatus || 'DECLARED_BY_PARTNER',
              cert.verificationNotes || null,
            ]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.pool.query(
      `SELECT id, name, brand, ingredients, has_gluten, cross_contamination, analysis_status,
              partner_id, price, category, image_url, is_active,
              short_description, net_content, unit_of_measure, sku, ean,
              commercial_origin, may_contain_traces, composition_notes, publication_status,
              declared_allergens, cross_contamination_details, dietary_features, information_origin, nutritional_info
       FROM products WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Busca as imagens vinculadas ordenadas
    const imagesResult = await this.pool.query(
      `SELECT id, product_id, url, image_type, caption, display_order, is_cover
       FROM product_images
       WHERE product_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [id]
    );

    const images = imagesResult.rows.map((imgRow) => ({
      id: imgRow.id,
      productId: imgRow.product_id,
      url: imgRow.url,
      imageType: imgRow.image_type as ProductImageType,
      caption: imgRow.caption || undefined,
      displayOrder: parseInt(imgRow.display_order, 10),
      isCover: Boolean(imgRow.is_cover),
    }));

    // Busca as certificações vinculadas
    const certsResult = await this.pool.query(
      `SELECT id, product_id, certification_type, certifying_entity, certificate_code,
              valid_until, image_id, verification_status, verification_notes, created_at, updated_at
       FROM product_certifications
       WHERE product_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    const certifications = certsResult.rows.map((cRow) => ({
      id: cRow.id,
      productId: cRow.product_id,
      certificationType: cRow.certification_type,
      certifyingEntity: cRow.certifying_entity,
      certificateCode: cRow.certificate_code || undefined,
      validUntil: cRow.valid_until ? (cRow.valid_until instanceof Date ? cRow.valid_until.toISOString().split('T')[0] : String(cRow.valid_until).split('T')[0]) : undefined,
      imageId: cRow.image_id || undefined,
      verificationStatus: cRow.verification_status,
      verificationNotes: cRow.verification_notes || undefined,
    }));

    const declaredAllergens = typeof row.declared_allergens === 'string'
      ? JSON.parse(row.declared_allergens)
      : (row.declared_allergens || {});

    const crossContaminationDetails = typeof row.cross_contamination_details === 'string'
      ? JSON.parse(row.cross_contamination_details)
      : (row.cross_contamination_details || undefined);

    const dietaryFeatures = typeof row.dietary_features === 'string'
      ? JSON.parse(row.dietary_features)
      : (row.dietary_features || []);

    const nutritionalInfo = typeof row.nutritional_info === 'string'
      ? JSON.parse(row.nutritional_info)
      : (row.nutritional_info || undefined);

    return Product.create(
      {
        name:                      row.name,
        brand:                     row.brand,
        ingredients:               row.ingredients,
        hasGluten:                 row.has_gluten,
        crossContamination:        row.cross_contamination,
        analysisStatus:            row.analysis_status as AnalysisStatus,
        partnerId:                 row.partner_id || undefined,
        price:                     row.price ? parseFloat(row.price) : 0,
        category:                  row.category,
        imageUrl:                  row.image_url || undefined,
        isActive:                  row.is_active,
        shortDescription:          row.short_description || undefined,
        netContent:                row.net_content !== null && row.net_content !== undefined ? parseFloat(row.net_content) : undefined,
        unitOfMeasure:             row.unit_of_measure || undefined,
        sku:                       row.sku || undefined,
        ean:                       row.ean || undefined,
        commercialOrigin:          (row.commercial_origin as CommercialOrigin) || 'OWN_MANUFACTURE',
        mayContainTraces:          row.may_contain_traces || '',
        compositionNotes:          row.composition_notes || undefined,
        publicationStatus:         (row.publication_status as PublicationStatus) || 'PUBLISHED',
        images,
        declaredAllergens,
        crossContaminationDetails,
        dietaryFeatures,
        informationOrigin:         row.information_origin || 'PARTNER_DECLARED',
        nutritionalInfo,
        certifications,
      },
      row.id
    ).getValue();
  }

  async update(product: Product): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE products
         SET name = $1, brand = $2, ingredients = $3, has_gluten = $4, cross_contamination = $5,
             analysis_status = $6, partner_id = $7, price = $8, category = $9, image_url = $10,
             is_active = $11, short_description = $12, net_content = $13, unit_of_measure = $14,
             sku = $15, ean = $16, commercial_origin = $17, may_contain_traces = $18,
             composition_notes = $19, publication_status = $20,
             declared_allergens = $21, cross_contamination_details = $22,
             dietary_features = $23, information_origin = $24, nutritional_info = $25,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $26`,
        [
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
          product.isActive,
          product.shortDescription || null,
          product.netContent !== undefined ? product.netContent : null,
          product.unitOfMeasure || null,
          product.sku || null,
          product.ean || null,
          product.commercialOrigin,
          product.mayContainTraces,
          product.compositionNotes || null,
          product.publicationStatus,
          JSON.stringify(product.declaredAllergens || {}),
          product.crossContaminationDetails ? JSON.stringify(product.crossContaminationDetails) : null,
          product.dietaryFeatures || [],
          product.informationOrigin || 'PARTNER_DECLARED',
          product.nutritionalInfo ? JSON.stringify(product.nutritionalInfo) : null,
          product.id,
        ]
      );

      // Sincroniza a galeria de imagens
      await client.query(`DELETE FROM product_images WHERE product_id = $1`, [product.id]);
      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          await client.query(
            `INSERT INTO product_images (
              id, product_id, url, image_type, caption, display_order, is_cover
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              img.id,
              product.id,
              img.url,
              img.imageType,
              img.caption || null,
              img.displayOrder,
              img.isCover,
            ]
          );
        }
      }

      // Sincroniza os selos e certificações oficiais
      await client.query(`DELETE FROM product_certifications WHERE product_id = $1`, [product.id]);
      if (product.certifications && product.certifications.length > 0) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        for (const cert of product.certifications) {
          const safeImageId = cert.imageId && uuidRegex.test(cert.imageId) ? cert.imageId : null;

          await client.query(
            `INSERT INTO product_certifications (
              id, product_id, certification_type, certifying_entity, certificate_code,
              valid_until, image_id, verification_status, verification_notes
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              cert.id,
              product.id,
              cert.certificationType,
              cert.certifyingEntity,
              cert.certificateCode || null,
              cert.validUntil || null,
              safeImageId,
              cert.verificationStatus || 'DECLARED_BY_PARTNER',
              cert.verificationNotes || null,
            ]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async search(query: SearchProductQuery): Promise<PaginatedResult<Product>> {
    const { term, page, limit, avoidAllergens, partnerId } = query;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const queryParams: any[] = [];

    // Por padrão na busca pública, retornamos apenas produtos ativos e publicados
    conditions.push('products.is_active = TRUE');

    // Regra de ocultação lógica de produtos de parceiros não aprovados/inativos
    conditions.push(`(products.partner_id IS NULL OR (partners.approval_status = 'APPROVED' AND partners.operational_status IN ('ACTIVE', 'TEMPORARILY_CLOSED')))`);

    if (term) {
      queryParams.push(`%${term}%`);
      conditions.push(`(products.name ILIKE $${queryParams.length} OR products.brand ILIKE $${queryParams.length} OR products.sku ILIKE $${queryParams.length})`);
    }

    if (partnerId) {
      queryParams.push(partnerId);
      conditions.push(`products.partner_id = $${queryParams.length}`);
    }

    if (avoidAllergens && avoidAllergens.length > 0) {
      const exclusions: string[] = [];
      for (const allergen of avoidAllergens) {
        const upperAllergen = allergen.toUpperCase() as AllergenType;
        const terms = ALLERGEN_SEARCH_TERMS[upperAllergen];
        if (!terms) continue;

        const allergenConditions: string[] = [];

        if (upperAllergen === AllergenType.GLUTEN) {
          allergenConditions.push('products.has_gluten = TRUE');
        }

        for (const t of terms) {
          queryParams.push(`%${t}%`);
          allergenConditions.push(`products.ingredients ILIKE $${queryParams.length}`);
          allergenConditions.push(`products.cross_contamination ILIKE $${queryParams.length}`);
          allergenConditions.push(`products.may_contain_traces ILIKE $${queryParams.length}`);
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

    // Conta total usando DISTINCT para evitar contagem duplicada pelo LEFT JOIN
    const countQuery = `
      SELECT COUNT(DISTINCT products.id) 
      FROM products 
      LEFT JOIN partners ON products.partner_id = partners.id
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Busca dados com paginação qualificando as colunas e usando JOIN
    const dataQuery = `
      SELECT products.id, products.name, products.brand, products.ingredients, products.has_gluten,
             products.cross_contamination, products.analysis_status, products.partner_id,
             products.price, products.category, products.image_url, products.is_active,
             products.short_description, products.net_content, products.unit_of_measure,
             products.sku, products.ean, products.commercial_origin, products.may_contain_traces,
             products.composition_notes, products.publication_status,
             products.declared_allergens, products.cross_contamination_details,
             products.dietary_features, products.information_origin, products.nutritional_info
      FROM products
      LEFT JOIN partners ON products.partner_id = partners.id
      ${whereClause}
      ORDER BY products.name ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    const dataParams = [...queryParams, limit, offset];
    const dataResult = await this.pool.query(dataQuery, dataParams);

    const data = dataResult.rows.map((row) => {
      const declaredAllergens = typeof row.declared_allergens === 'string'
        ? JSON.parse(row.declared_allergens)
        : (row.declared_allergens || {});

      const crossContaminationDetails = typeof row.cross_contamination_details === 'string'
        ? JSON.parse(row.cross_contamination_details)
        : (row.cross_contamination_details || undefined);

      const dietaryFeatures = typeof row.dietary_features === 'string'
        ? JSON.parse(row.dietary_features)
        : (row.dietary_features || []);

      const nutritionalInfo = typeof row.nutritional_info === 'string'
        ? JSON.parse(row.nutritional_info)
        : (row.nutritional_info || undefined);

      return Product.create(
        {
          name:                      row.name,
          brand:                     row.brand,
          ingredients:               row.ingredients,
          hasGluten:                 row.has_gluten,
          crossContamination:        row.cross_contamination,
          analysisStatus:            row.analysis_status as AnalysisStatus,
          partnerId:                 row.partner_id || undefined,
          price:                     row.price ? parseFloat(row.price) : 0,
          category:                  row.category,
          imageUrl:                  row.image_url || undefined,
          isActive:                  row.is_active,
          shortDescription:          row.short_description || undefined,
          netContent:                row.net_content !== null && row.net_content !== undefined ? parseFloat(row.net_content) : undefined,
          unitOfMeasure:             row.unit_of_measure || undefined,
          sku:                       row.sku || undefined,
          ean:                       row.ean || undefined,
          commercialOrigin:          (row.commercial_origin as CommercialOrigin) || 'OWN_MANUFACTURE',
          mayContainTraces:          row.may_contain_traces || '',
          compositionNotes:          row.composition_notes || undefined,
          publicationStatus:         (row.publication_status as PublicationStatus) || 'PUBLISHED',
          declaredAllergens,
          crossContaminationDetails,
          dietaryFeatures,
          informationOrigin:         row.information_origin || 'PARTNER_DECLARED',
          nutritionalInfo,
        },
        row.id
      ).getValue();
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
