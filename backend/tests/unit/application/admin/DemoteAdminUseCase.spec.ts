// backend/tests/unit/application/admin/DemoteAdminUseCase.spec.ts
import { DemoteAdminUseCase } from '../../../../src/application/admin/DemoteAdminUseCase';
import { IUserRepository } from '../../../../src/domain/iam/repositories/IUserRepository';
import { User } from '../../../../src/domain/iam/User';
import { Email } from '../../../../src/domain/iam/value-objects/Email';
import { PasswordHash } from '../../../../src/domain/iam/value-objects/PasswordHash';
import { UserRole } from '../../../../src/domain/iam/value-objects/UserRole';

function makeUser(role: UserRole, id: string): User {
  const email = Email.create(`${id}@test.com`).getValue();
  const passwordHash = PasswordHash.fromHash('$2b$10$hashedpassword').getValue();
  return User.create({ email, passwordHash, role, accountStatus: 'ACTIVE', profileEvaluationStatus: 'APPROVED' }, id).getValue();
}

function makeRepo(users: User[]): IUserRepository {
  return {
    findById: jest.fn(async (id: string) => users.find((u) => u.id === id) ?? null),
    findByEmail: jest.fn(async () => null),
    findAll: jest.fn(async () => users),
    save: jest.fn(async () => {}),
    delete: jest.fn(async () => {}),
  };
}

describe('DemoteAdminUseCase', () => {
  const adminId = 'admin-uuid-1';
  const targetId = 'target-uuid-2';

  it('deve rebaixar um ADMIN para CELIACO com sucesso', async () => {
    const adminUser = makeUser(UserRole.ADMIN, adminId);
    const targetUser = makeUser(UserRole.ADMIN, targetId);
    const repo = makeRepo([adminUser, targetUser]);
    const useCase = new DemoteAdminUseCase(repo);

    const result = await useCase.execute({ requestedByUserId: adminId, targetUserId: targetId });

    expect(result.isSuccess).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('deve falhar se o solicitante nao for ADMIN', async () => {
    const nonAdmin = makeUser(UserRole.CELIACO, adminId);
    const targetUser = makeUser(UserRole.ADMIN, targetId);
    const repo = makeRepo([nonAdmin, targetUser]);
    const useCase = new DemoteAdminUseCase(repo);

    const result = await useCase.execute({ requestedByUserId: adminId, targetUserId: targetId });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toMatch(/administradores ativos/i);
  });

  it('deve falhar se o admin tentar se auto-rebaixar', async () => {
    const adminUser = makeUser(UserRole.ADMIN, adminId);
    const repo = makeRepo([adminUser]);
    const useCase = new DemoteAdminUseCase(repo);

    const result = await useCase.execute({ requestedByUserId: adminId, targetUserId: adminId });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toMatch(/si mesmo/i);
  });

  it('deve falhar se o usuario alvo nao for ADMIN', async () => {
    const adminUser = makeUser(UserRole.ADMIN, adminId);
    const targetUser = makeUser(UserRole.CELIACO, targetId);
    const repo = makeRepo([adminUser, targetUser]);
    const useCase = new DemoteAdminUseCase(repo);

    const result = await useCase.execute({ requestedByUserId: adminId, targetUserId: targetId });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toMatch(/ADMIN/i);
  });

  it('deve falhar se o usuario alvo nao for encontrado', async () => {
    const adminUser = makeUser(UserRole.ADMIN, adminId);
    const repo = makeRepo([adminUser]);
    const useCase = new DemoteAdminUseCase(repo);

    const result = await useCase.execute({ requestedByUserId: adminId, targetUserId: 'not-found' });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toMatch(/nao encontrado|não encontrado/i);
  });
});
