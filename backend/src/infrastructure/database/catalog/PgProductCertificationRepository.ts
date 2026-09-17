// backend/src/infrastructure/database/catalog/PgProductCertificationRepository.ts
import { Pool } from 'pg';
import {
  IProductCertificationRepository,
  AdminCertificationListItem,
  ListCertificationsFilters,
  PaginatedCertificationsResult,
} from '../../../domain/catalog/repositories/IProductCertificationRepository';
import { ProductCertification, CertificationVerificationStatus } from '../../../domain/catalog/ProductCertification';

export class PgProductCertificationRepository implements IProductCertificationRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<ProductCertification | null> {
    const query = `
      SELECT id, product_id, certification_type, certifying_entity,
             certificate_code, valid_until, image_id, verification_status,
             verification_notes, created_at, updated_at
      FROM product_certifications
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const certResult = ProductCertification.create(
      {
        productId:          row.product_id,
        certificationType:  row.certification_type,
        certifyingEntity:   row.certifying_entity,
        certificateCode:    row.certificate_code || undefined,
        validUntil:         row.valid_until ? (row.valid_until instanceof Date ? row.valid_until.toISOString().slice(0, 10) : String(row.valid_until)) : undefined,
        imageId:            row.image_id || undefined,
        verificationStatus: row.verification_status,
        verificationNotes:  row.verification_notes || undefined,
        createdAt:          row.created_at ? new Date(row.created_at).toISOString() : undefined,
        updatedAt:          row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      },
      row.id
    );

    if (certResult.isFailure) {
      return null;
    }

    return certResult.getValue();
  }

  async findItemDetailsById(id: string): Promise<AdminCertificationListItem | null> {
    const query = `
      SELECT 
        pc.id,
        pc.product_id,
        p.name AS product_name,
        p.brand AS product_brand,
        p.partner_id,
        part.name AS partner_name,
        pc.certification_type,
        pc.certifying_entity,
        pc.certificate_code,
        pc.valid_until,
        pc.image_id,
        pi.url AS image_url,
        pc.verification_status,
        pc.verification_notes,
        pc.created_at,
        pc.updated_at
      FROM product_certifications pc
      INNER JOIN products p ON p.id = pc.product_id
      LEFT JOIN partners part ON part.id = p.partner_id
      LEFT JOIN product_images pi ON pi.id = pc.image_id
      WHERE pc.id = $1
    `;
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return this.mapRowToListItem(row);
  }

  async listForAdmin(filters: ListCertificationsFilters): Promise<PaginatedCertificationsResult> {
    const { status, productId, page, limit } = filters;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`pc.verification_status = $${paramIndex++}`);
      values.push(status);
    }

    if (productId) {
      conditions.push(`pc.product_id = $${paramIndex++}`);
      values.push(productId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM product_certifications pc
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    const listQuery = `
      SELECT 
        pc.id,
        pc.product_id,
        p.name AS product_name,
        p.brand AS product_brand,
        p.partner_id,
        part.name AS partner_name,
        pc.certification_type,
        pc.certifying_entity,
        pc.certificate_code,
        pc.valid_until,
        pc.image_id,
        pi.url AS image_url,
        pc.verification_status,
        pc.verification_notes,
        pc.created_at,
        pc.updated_at
      FROM product_certifications pc
      INNER JOIN products p ON p.id = pc.product_id
      LEFT JOIN partners part ON part.id = p.partner_id
      LEFT JOIN product_images pi ON pi.id = pc.image_id
      ${whereClause}
      ORDER BY 
        CASE WHEN pc.verification_status = 'DECLARED_BY_PARTNER' THEN 0 ELSE 1 END,
        pc.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);
    const listResult = await this.pool.query(listQuery, values);

    const items = listResult.rows.map(row => this.mapRowToListItem(row));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateStatus(
    id: string,
    status: CertificationVerificationStatus,
    notes?: string,
    adminId?: string
  ): Promise<void> {
    const query = `
      UPDATE product_certifications
      SET verification_status = $1,
          verification_notes = $2,
          updated_at = NOW()
      WHERE id = $3
    `;
    await this.pool.query(query, [status, notes || null, id]);
  }

  private mapRowToListItem(row: any): AdminCertificationListItem {
    return {
      id:                  row.id,
      productId:           row.product_id,
      productName:         row.product_name || 'Produto sem nome',
      productBrand:        row.product_brand || 'Marca não informada',
      partnerId:           row.partner_id || undefined,
      partnerName:         row.partner_name || undefined,
      certificationType:   row.certification_type,
      certifyingEntity:    row.certifying_entity,
      certificateCode:     row.certificate_code || undefined,
      validUntil:          row.valid_until ? (row.valid_until instanceof Date ? row.valid_until.toISOString().slice(0, 10) : String(row.valid_until)) : undefined,
      imageId:             row.image_id || undefined,
      imageUrl:            row.image_url || undefined,
      verificationStatus:  row.verification_status,
      verificationNotes:   row.verification_notes || undefined,
      createdAt:           row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt:           row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}
