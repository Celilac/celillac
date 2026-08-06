// backend/tests/unit/infrastructure/database/audit/PgAuditLogRepository.spec.ts
import { PgAuditLogRepository } from '../../../../../src/infrastructure/database/audit/PgAuditLogRepository';
import { AuditLog } from '../../../../../src/domain/audit/AuditLog';
import { Pool } from 'pg';

describe('PgAuditLogRepository', () => {
  let mockPool: Partial<Pool>;
  let repository: PgAuditLogRepository;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    repository = new PgAuditLogRepository(mockPool as Pool);
  });

  it('deve salvar um registro de auditoria no banco com query SQL parametrizada', async () => {
    const log = AuditLog.create({
      entityType: 'Consumer',
      entityId: 'consumer-uuid-1',
      action: 'DEACTIVATE',
      actorId: 'admin-uuid-1',
      actorRole: 'ADMIN',
      changes: { status: 'INATIVO' },
      reason: 'Solicitação do usuário',
    }).getValue();

    await repository.save(log);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_logs'),
      [
        log.id,
        'Consumer',
        'consumer-uuid-1',
        'DEACTIVATE',
        'admin-uuid-1',
        'ADMIN',
        JSON.stringify({ status: 'INATIVO' }),
        'Solicitação do usuário',
        expect.any(Date),
      ],
    );
  });

  it('deve buscar e mapear historico de auditoria por entidade', async () => {
    const fakeRow = {
      id: 'audit-1',
      entity_type: 'FoodProfile',
      entity_id: 'profile-99',
      action: 'UPDATE',
      actor_id: 'user-99',
      actor_role: 'CELIACO',
      changes: { test: true },
      reason: 'Motivo teste',
      created_at: new Date('2026-08-04T10:00:00Z'),
    };

    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [fakeRow] });

    const logs = await repository.findByEntity('FoodProfile', 'profile-99');

    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe('audit-1');
    expect(logs[0].entityType).toBe('FoodProfile');
    expect(logs[0].entityId).toBe('profile-99');
    expect(logs[0].action).toBe('UPDATE');
    expect(logs[0].changes).toEqual({ test: true });
    expect(logs[0].reason).toBe('Motivo teste');
  });
});
