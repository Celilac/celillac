// backend/src/application/admin/DeleteUserUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface DeleteUserInput {
  targetUserId: string;
  requestedByUserId: string;
}

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: DeleteUserInput): Promise<Result<void>> {
    const adminUser = await this.userRepository.findById(input.requestedByUserId);
    if (!adminUser || adminUser.role !== UserRole.ADMIN || adminUser.accountStatus !== 'ACTIVE') {
      return Result.fail<void>('Somente administradores ativos podem excluir contas de usuários.');
    }

    if (input.requestedByUserId === input.targetUserId) {
      return Result.fail<void>('Um administrador não pode excluir a si mesmo.');
    }

    const targetUser = await this.userRepository.findById(input.targetUserId);
    if (!targetUser) {
      return Result.fail<void>('Usuário não encontrado.');
    }

    await this.userRepository.delete(input.targetUserId);
    return Result.ok<void>(undefined as any);
  }
}
