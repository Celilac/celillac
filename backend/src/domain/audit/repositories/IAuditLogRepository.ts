// backend/src/domain/audit/repositories/IAuditLogRepository.ts
import { AuditLog } from '../AuditLog';

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<void>;
  findByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
}
