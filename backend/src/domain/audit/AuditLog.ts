// backend/src/domain/audit/AuditLog.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export interface AuditLogProps {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  changes: Record<string, any>;
  reason?: string;
  createdAt?: Date;
}

export class AuditLog extends Entity<AuditLogProps> {
  private constructor(props: AuditLogProps, id?: string) {
    super(props, id);
  }

  get entityType(): string {
    return this.props.entityType;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  get action(): string {
    return this.props.action;
  }

  get actorId(): string | undefined {
    return this.props.actorId;
  }

  get actorRole(): string | undefined {
    return this.props.actorRole;
  }

  get changes(): Record<string, any> {
    return this.props.changes;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  public static create(props: AuditLogProps, id?: string): Result<AuditLog> {
    if (!props.entityType || props.entityType.trim() === '') {
      return Result.fail<AuditLog>('O tipo da entidade para auditoria é obrigatório.');
    }
    if (!props.entityId || props.entityId.trim() === '') {
      return Result.fail<AuditLog>('O ID da entidade para auditoria é obrigatório.');
    }
    if (!props.action || props.action.trim() === '') {
      return Result.fail<AuditLog>('A ação para auditoria é obrigatória.');
    }

    return Result.ok<AuditLog>(
      new AuditLog(
        {
          ...props,
          createdAt: props.createdAt ?? new Date(),
        },
        id,
      ),
    );
  }
}
