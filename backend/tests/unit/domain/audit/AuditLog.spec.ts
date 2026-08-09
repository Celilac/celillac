// backend/tests/unit/domain/audit/AuditLog.spec.ts
import { AuditLog } from '../../../../src/domain/audit/AuditLog';

describe('AuditLog Entity', () => {
  it('deve criar um registro de auditoria valido', () => {
    const result = AuditLog.create({
      entityType: 'FoodProfile',
      entityId: 'profile-uuid-123',
      action: 'UPDATE',
      actorId: 'user-uuid-456',
      actorRole: 'CELIACO',
      changes: { old: [], new: [{ allergen: 'GLUTEN', severity: 'FATAL' }] },
      reason: 'Atualização de teste',
    });

    expect(result.isSuccess).toBe(true);
    const log = result.getValue();
    expect(log.entityType).toBe('FoodProfile');
    expect(log.entityId).toBe('profile-uuid-123');
    expect(log.action).toBe('UPDATE');
    expect(log.actorId).toBe('user-uuid-456');
    expect(log.actorRole).toBe('CELIACO');
    expect(log.changes).toEqual({ old: [], new: [{ allergen: 'GLUTEN', severity: 'FATAL' }] });
    expect(log.reason).toBe('Atualização de teste');
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('deve falhar ao criar sem entityType', () => {
    const result = AuditLog.create({
      entityType: '',
      entityId: 'entity-1',
      action: 'UPDATE',
      changes: {},
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('O tipo da entidade para auditoria é obrigatório.');
  });

  it('deve falhar ao criar sem entityId', () => {
    const result = AuditLog.create({
      entityType: 'FoodProfile',
      entityId: '',
      action: 'UPDATE',
      changes: {},
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('O ID da entidade para auditoria é obrigatório.');
  });

  it('deve falhar ao criar sem action', () => {
    const result = AuditLog.create({
      entityType: 'FoodProfile',
      entityId: 'profile-1',
      action: '',
      changes: {},
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('A ação para auditoria é obrigatória.');
  });
});
