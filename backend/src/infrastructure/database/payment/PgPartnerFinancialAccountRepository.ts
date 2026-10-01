// backend/src/infrastructure/database/payment/PgPartnerFinancialAccountRepository.ts
import { Pool } from 'pg';
import { IPartnerFinancialAccountRepository } from '../../../domain/payment/repositories/IPartnerFinancialAccountRepository';
import {
  PartnerFinancialAccount,
  PixKeyType,
  BankAccountType,
} from '../../../domain/payment/entities/PartnerFinancialAccount';

export class PgPartnerFinancialAccountRepository implements IPartnerFinancialAccountRepository {
  constructor(private readonly pool: Pool) {}

  async save(account: PartnerFinancialAccount): Promise<void> {
    const existing = await this.pool.query(
      'SELECT id FROM partner_financial_accounts WHERE id = $1',
      [account.id]
    );

    if (existing.rows.length === 0) {
      await this.pool.query(
        `INSERT INTO partner_financial_accounts (
          id, partner_id, gateway_subaccount_id, pix_key, pix_key_type,
          bank_code, agency_number, account_number, account_type, is_verified,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          account.id,
          account.partnerId,
          account.gatewaySubaccountId || null,
          account.pixKey,
          account.pixKeyType,
          account.bankCode || null,
          account.agencyNumber || null,
          account.accountNumber || null,
          account.accountType || null,
          account.isVerified,
          account.createdAt,
          account.updatedAt,
        ]
      );
    } else {
      await this.pool.query(
        `UPDATE partner_financial_accounts SET
          gateway_subaccount_id = $2,
          pix_key = $3,
          pix_key_type = $4,
          bank_code = $5,
          agency_number = $6,
          account_number = $7,
          account_type = $8,
          is_verified = $9,
          updated_at = $10
        WHERE id = $1`,
        [
          account.id,
          account.gatewaySubaccountId || null,
          account.pixKey,
          account.pixKeyType,
          account.bankCode || null,
          account.agencyNumber || null,
          account.accountNumber || null,
          account.accountType || null,
          account.isVerified,
          account.updatedAt,
        ]
      );
    }
  }

  async findByPartnerId(partnerId: string): Promise<PartnerFinancialAccount | null> {
    const res = await this.pool.query(
      'SELECT * FROM partner_financial_accounts WHERE partner_id = $1 LIMIT 1',
      [partnerId]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToAccount(res.rows[0]);
  }

  async findBySubaccountId(subaccountId: string): Promise<PartnerFinancialAccount | null> {
    const res = await this.pool.query(
      'SELECT * FROM partner_financial_accounts WHERE gateway_subaccount_id = $1 LIMIT 1',
      [subaccountId]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToAccount(res.rows[0]);
  }

  private mapRowToAccount(row: any): PartnerFinancialAccount | null {
    const res = PartnerFinancialAccount.create(
      {
        partnerId: row.partner_id,
        gatewaySubaccountId: row.gateway_subaccount_id || undefined,
        pixKey: row.pix_key,
        pixKeyType: row.pix_key_type as PixKeyType,
        bankCode: row.bank_code || undefined,
        agencyNumber: row.agency_number || undefined,
        accountNumber: row.account_number || undefined,
        accountType: (row.account_type as BankAccountType) || undefined,
        isVerified: row.is_verified,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    );

    return res.isSuccess ? res.getValue() : null;
  }
}
