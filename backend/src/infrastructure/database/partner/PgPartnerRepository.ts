// backend/src/infrastructure/database/partner/PgPartnerRepository.ts
import { Pool } from 'pg';
import { IPartnerRepository } from '../../../domain/partner/repositories/IPartnerRepository';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../domain/partner/Partner';

export class PgPartnerRepository implements IPartnerRepository {
  constructor(private readonly pool: Pool) {}

  async create(partner: Partner): Promise<void> {
    await this.pool.query(
      `INSERT INTO partners (id, user_id, name, cnpj, description, address, phone, type, approval_status, operational_status, rejection_reason, suspension_reason, city, state, delivery_region, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
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
      ]
    );
  }

  async findById(id: string): Promise<Partner | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, name, cnpj, description, address, phone, type, approval_status, operational_status, rejection_reason, suspension_reason, city, state, delivery_region, logo_url
       FROM partners WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPartner(result.rows[0]);
  }

  async findAllByUserId(userId: string): Promise<Partner[]> {
    const result = await this.pool.query(
      `SELECT id, user_id, name, cnpj, description, address, phone, type, approval_status, operational_status, rejection_reason, suspension_reason, city, state, delivery_region, logo_url
       FROM partners WHERE user_id = $1 ORDER BY name ASC`,
      [userId]
    );

    return result.rows.map(row => this.mapRowToPartner(row));
  }

  async findAll(): Promise<Partner[]> {
    const result = await this.pool.query(
      `SELECT id, user_id, name, cnpj, description, address, phone, type, approval_status, operational_status, rejection_reason, suspension_reason, city, state, delivery_region, logo_url
       FROM partners ORDER BY name ASC`
    );

    return result.rows.map(row => this.mapRowToPartner(row));
  }

  async update(partner: Partner): Promise<void> {
    await this.pool.query(
      `UPDATE partners 
       SET name = $1, cnpj = $2, description = $3, address = $4, phone = $5, type = $6, approval_status = $7, operational_status = $8, rejection_reason = $9, suspension_reason = $10, city = $11, state = $12, delivery_region = $13, logo_url = $14, updated_at = CURRENT_TIMESTAMP
       WHERE id = $15`,
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
        partner.id,
      ]
    );
  }

  private mapRowToPartner(row: any): Partner {
    return Partner.create(
      {
        userId:            row.user_id,
        name:              row.name,
        cnpj:              row.cnpj || undefined,
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
    ).getValue();
  }
}
