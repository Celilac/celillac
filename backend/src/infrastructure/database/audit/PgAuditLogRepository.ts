// backend/src/infrastructure/database/audit/PgAuditLogRepository.ts
import { Pool } from 'pg';
import { IAuditLogRepository } from '../../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../../domain/audit/AuditLog';

export class PgAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly pool: Pool) {}

  async save(log: AuditLog): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, actor_role, changes, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [
        log.id,
        log.entityType,
        log.entityId,
        log.action,
        log.actorId || null,
        log.actorRole || null,
        JSON.stringify(log.changes),
        log.reason || null,
        log.createdAt,
      ],
    );
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const result = await this.pool.query(
      `SELECT id, entity_type, entity_id, action, actor_id, actor_role, changes, reason, created_at
       FROM audit_logs
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY created_at DESC`,
      [entityType, entityId],
    );

    return result.rows.map((row) =>
      AuditLog.create(
        {
          entityType: row.entity_type,
          entityId: row.entity_id,
          action: row.action,
          actorId: row.actor_id ?? undefined,
          actorRole: row.actor_role ?? undefined,
          changes: row.changes ?? {},
          reason: row.reason ?? undefined,
          createdAt: new Date(row.created_at),
        },
        row.id,
      ).getValue(),
    );
  }
}
