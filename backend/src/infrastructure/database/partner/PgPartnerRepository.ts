// backend/src/infrastructure/database/partner/PgPartnerRepository.ts
import { Pool } from 'pg';
import { IPartnerRepository } from '../../../domain/partner/repositories/IPartnerRepository';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus, LegalNature, DocumentType } from '../../../domain/partner/Partner';

const PARTNER_SELECT_COLUMNS = `
  id, user_id, name, cnpj, description, address, phone, type, 
  approval_status, operational_status, rejection_reason, suspension_reason, 
  city, state, delivery_region, logo_url,
  legal_nature, document_number, document_type, document_url, company_name, responsible_name
`;

export class PgPartnerRepository implements IPartnerRepository {
  constructor(private readonly pool: Pool) {}

  async create(partner: Partner): Promise<void> {
    await this.pool.query(
      `INSERT INTO partners (
        id, user_id, name, cnpj, description, address, phone, type, 
        approval_status, operational_status, rejection_reason, suspension_reason, 
        city, state, delivery_region, logo_url,
        legal_nature, document_number, document_type, document_url, company_name, responsible_name
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        partner.id,
        partner.userId,
        partner.name,
        partner.cnpj || null,
        partner.description,
        partner.address,
        partner.phone,
        partner.type,
        partner.approvalStatus,
        partner.operationalStatus,
        partner.rejectionReason || null,
        partner.suspensionReason || null,
        partner.city || null,
        partner.state || null,
        partner.deliveryRegion || null,
        partner.logoUrl || null,
        partner.legalNature,
        partner.documentNumber || null,
        partner.documentType,
        partner.documentUrl || null,
        partner.companyName || null,
        partner.responsibleName || null,
      ]
    );
  }

  async findById(id: string): Promise<Partner | null> {
    const result = await this.pool.query(
      `SELECT ${PARTNER_SELECT_COLUMNS} FROM partners WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPartner(result.rows[0]);
  }

  async findByCnpj(cnpj: string): Promise<Partner | null> {
    return this.findByDocumentNumber(cnpj);
  }

  async findByDocumentNumber(documentNumber: string): Promise<Partner | null> {
    const clean = documentNumber.replace(/\D/g, '');
    if (!clean) return null;

    const result = await this.pool.query(
      `SELECT ${PARTNER_SELECT_COLUMNS}
       FROM partners 
       WHERE regexp_replace(COALESCE(document_number, cnpj, ''), '\\D', '', 'g') = $1 
       LIMIT 1`,
      [clean]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPartner(result.rows[0]);
  }

  async findAllByUserId(userId: string): Promise<Partner[]> {
    const result = await this.pool.query(
      `SELECT ${PARTNER_SELECT_COLUMNS} FROM partners WHERE user_id = $1 ORDER BY name ASC`,
      [userId]
    );

    return result.rows.map(row => this.mapRowToPartner(row));
  }

  async findAll(): Promise<Partner[]> {
    const result = await this.pool.query(
      `SELECT ${PARTNER_SELECT_COLUMNS} FROM partners ORDER BY name ASC`
    );

    return result.rows.map(row => this.mapRowToPartner(row));
  }

  async update(partner: Partner): Promise<void> {
    await this.pool.query(
      `UPDATE partners 
       SET name = $1, cnpj = $2, description = $3, address = $4, phone = $5, type = $6, 
           approval_status = $7, operational_status = $8, rejection_reason = $9, suspension_reason = $10, 
           city = $11, state = $12, delivery_region = $13, logo_url = $14,
           legal_nature = $15, document_number = $16, document_type = $17, document_url = $18, 
           company_name = $19, responsible_name = $20,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $21`,
      [
        partner.name,
        partner.cnpj || null,
        partner.description,
        partner.address,
        partner.phone,
        partner.type,
        partner.approvalStatus,
        partner.operationalStatus,
        partner.rejectionReason || null,
        partner.suspensionReason || null,
        partner.city || null,
        partner.state || null,
        partner.deliveryRegion || null,
        partner.logoUrl || null,
        partner.legalNature,
        partner.documentNumber || null,
        partner.documentType,
        partner.documentUrl || null,
        partner.companyName || null,
        partner.responsibleName || null,
        partner.id,
      ]
    );
  }

  private mapRowToPartner(row: any): Partner {
    return Partner.reconstitute(
      {
        userId:            row.user_id,
        name:              row.name,
        cnpj:              row.cnpj || undefined,
        legalNature:       (row.legal_nature as LegalNature) || 'PJ',
        documentNumber:    row.document_number || row.cnpj || undefined,
        documentType:      (row.document_type as DocumentType) || (row.legal_nature === 'PF' ? 'CPF' : 'CNPJ'),
        documentUrl:       row.document_url || undefined,
        companyName:       row.company_name || undefined,
        responsibleName:   row.responsible_name || undefined,
        description:       row.description,
        address:           row.address,
        phone:             row.phone,
        type:              row.type as PartnerType,
        approvalStatus:    row.approval_status as PartnerApprovalStatus,
        operationalStatus: row.operational_status as PartnerOperationalStatus,
        rejectionReason:   row.rejection_reason || undefined,
        suspensionReason:  row.suspension_reason || undefined,
        city:              row.city || undefined,
        state:             row.state || undefined,
        deliveryRegion:    row.delivery_region || undefined,
        logoUrl:           row.logo_url || undefined,
      },
      row.id
    );
  }
}

