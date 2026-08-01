// backend/src/infrastructure/database/admin/PgReportRepository.ts
import { Pool } from 'pg';
import { IReportRepository } from '../../../domain/admin/repositories/IReportRepository';
import { Report } from '../../../domain/admin/Report';
import { ReportStatus } from '../../../domain/admin/value-objects/ReportStatus';
import { ReportReason } from '../../../domain/admin/value-objects/ReportReason';

interface ReportRow {
  id: string;
  reporter_id: string;
  product_id: string | null;
  partner_id: string | null;
  reason: string;
  details: string | null;
  is_food_safety_risk: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class PgReportRepository implements IReportRepository {
  constructor(private readonly pool: Pool) {}

  async save(report: Report): Promise<void> {
    await this.pool.query(
      `INSERT INTO product_reports (id, reporter_id, product_id, partner_id, reason, details, is_food_safety_risk, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        report.id,
        report.reporterId,
        report.productId || null,
        report.partnerId || null,
        report.reason,
        report.details || null,
        report.isFoodSafetyRisk,
        report.status,
        report.createdAt,
        report.updatedAt,
      ]
    );
  }

  async update(report: Report): Promise<void> {
    await this.pool.query(
      `UPDATE product_reports 
       SET status = $1, updated_at = $2 
       WHERE id = $3`,
      [report.status, report.updatedAt, report.id]
    );
  }

  async findById(id: string): Promise<Report | null> {
    const result = await this.pool.query(
      'SELECT * FROM product_reports WHERE id = $1 LIMIT 1',
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToReport(result.rows[0]);
  }

  async findAll(filters?: { status?: ReportStatus; isFoodSafetyRisk?: boolean }): Promise<Report[]> {
    let query = 'SELECT * FROM product_reports';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    if (filters?.isFoodSafetyRisk !== undefined) {
      params.push(filters.isFoodSafetyRisk);
      conditions.push(`is_food_safety_risk = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY is_food_safety_risk DESC, created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapRowToReport(row));
  }

  private mapRowToReport(row: ReportRow): Report {
    return Report.create(
      {
        reporterId: row.reporter_id,
        productId: row.product_id || undefined,
        partnerId: row.partner_id || undefined,
        reason: row.reason as ReportReason,
        details: row.details || undefined,
        isFoodSafetyRisk: row.is_food_safety_risk,
        status: row.status as ReportStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      row.id
    ).getValue();
  }
}
