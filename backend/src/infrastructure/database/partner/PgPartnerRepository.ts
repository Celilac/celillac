// backend/src/infrastructure/database/partner/PgPartnerRepository.ts
import { Pool } from 'pg';
import { IPartnerRepository } from '../../../domain/partner/repositories/IPartnerRepository';
import { Partner } from '../../../domain/partner/Partner';

export class PgPartnerRepository implements IPartnerRepository {
  constructor(private readonly pool: Pool) {}

  async create(partner: Partner): Promise<void> {
    await this.pool.query(
      `INSERT INTO partners (id, user_id, name, cnpj, description, address, phone, type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        partner.id,
        partner.userId,
        partner.name,
        partner.cnpj || null,
        partner.description,
        partner.address,
        partner.phone,
        partner.type,
        partner.isActive,
      ]
    );
  }

  async findById(id: string): Promise<Partner | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, name, cnpj, description, address, phone, type, is_active 
       FROM partners WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPartner(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<Partner | null> {
    const result = await this.pool.query(
      `SELECT id, user_id, name, cnpj, description, address, phone, type, is_active 
       FROM partners WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPartner(result.rows[0]);
  }

  async update(partner: Partner): Promise<void> {
    await this.pool.query(
      `UPDATE partners 
       SET name = $1, cnpj = $2, description = $3, address = $4, phone = $5, type = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        partner.name,
        partner.cnpj || null,
        partner.description,
        partner.address,
        partner.phone,
        partner.type,
        partner.isActive,
        partner.id,
      ]
    );
  }

  private mapRowToPartner(row: any): Partner {
    return Partner.create(
      {
        userId:      row.user_id,
        name:        row.name,
        cnpj:        row.cnpj || undefined,
        description: row.description,
        address:     row.address,
        phone:       row.phone,
        type:        row.type,
        isActive:    row.is_active,
      },
      row.id
    ).getValue();
  }
}
