// backend/src/application/admin/DemoteAdminUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface DemoteAdminInput {
  targetUserId: string;
  requestedByUserId: string;
}

export class DemoteAdminUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: DemoteAdminInput): Promise<Result<void>> {
    const adminUser = await this.userRepository.findById(input.requestedByUserId);
    if (!adminUser || adminUser.role !== UserRole.ADMIN || adminUser.accountStatus !== 'ACTIVE') {
      return Result.fail<void>('Somente administradores ativos podem rebaixar usuários.');
    }

    if (input.requestedByUserId === input.targetUserId) {
      return Result.fail<void>('Um administrador não pode rebaixar a si mesmo.');
    }

    const targetUser = await this.userRepository.findById(input.targetUserId);
    if (!targetUser) {
      return Result.fail<void>('Usuário não encontrado.');
    }

    if (targetUser.role !== UserRole.ADMIN) {
      return Result.fail<void>('Somente usuários com role ADMIN podem ser rebaixados.');
    }

    const demoteResult = targetUser.demoteToUser();
    if (demoteResult.isFailure) {
      return Result.fail<void>(demoteResult.getError());
    }

    await this.userRepository.save(targetUser);
    return Result.ok<void>(undefined as any);
  }
}
