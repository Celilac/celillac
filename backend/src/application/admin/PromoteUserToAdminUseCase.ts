// backend/src/application/admin/PromoteUserToAdminUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface PromoteUserToAdminInput {
  targetUserId: string;
  requestedByUserId: string;
}

export class PromoteUserToAdminUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: PromoteUserToAdminInput): Promise<Result<void>> {
    const adminUser = await this.userRepository.findById(input.requestedByUserId);
    if (!adminUser || adminUser.role !== UserRole.ADMIN || adminUser.accountStatus !== 'ACTIVE') {
      return Result.fail<void>('Somente administradores ativos podem promover usuários.');
    }

    const targetUser = await this.userRepository.findById(input.targetUserId);
    if (!targetUser) {
      return Result.fail<void>('Usuário não encontrado.');
    }

    targetUser.promoteToAdmin();
    await this.userRepository.save(targetUser);

    return Result.ok<void>(undefined as any);
  }
}
