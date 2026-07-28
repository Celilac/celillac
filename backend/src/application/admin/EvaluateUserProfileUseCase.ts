// backend/src/application/admin/EvaluateUserProfileUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';
import { ProfileEvaluationStatus } from '../../domain/iam/User';

export interface EvaluateUserProfileInput {
  userIdToEvaluate: string;
  evaluatorAdminUserId: string;
  status: ProfileEvaluationStatus;
}

export class EvaluateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: EvaluateUserProfileInput): Promise<Result<void>> {
    const admin = await this.userRepository.findById(input.evaluatorAdminUserId);
    if (!admin || admin.role !== UserRole.ADMIN || admin.accountStatus !== 'ACTIVE') {
      return Result.fail<void>('Somente administradores ativos podem avaliar perfis.');
    }

    const userToEvaluate = await this.userRepository.findById(input.userIdToEvaluate);
    if (!userToEvaluate) {
      return Result.fail<void>('Usuário não encontrado.');
    }

    if (!['APPROVED', 'REJECTED', 'PENDING_EVALUATION'].includes(input.status)) {
      return Result.fail<void>('Status de avaliação inválido.');
    }

    userToEvaluate.evaluateProfile(input.status);
    await this.userRepository.save(userToEvaluate);

    return Result.ok<void>(undefined as any);
  }
}
