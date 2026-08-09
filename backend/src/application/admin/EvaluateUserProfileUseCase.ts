// backend/src/application/admin/EvaluateUserProfileUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';
import { ProfileEvaluationStatus } from '../../domain/iam/User';

export interface EvaluateUserProfileInput {
  userIdToEvaluate:     string;
  evaluatorAdminUserId: string;
  status:               ProfileEvaluationStatus;
  reason?:              string;
}

export class EvaluateUserProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly consumerRepository?: IConsumerRepository,
    private readonly auditLogRepository?: IAuditLogRepository,
  ) {}

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

    const oldStatus = userToEvaluate.profileEvaluationStatus;
    userToEvaluate.evaluateProfile(input.status);
    await this.userRepository.save(userToEvaluate);

    // Auditoria (Issue #39)
    if (this.auditLogRepository) {
      const logResult = AuditLog.create({
        entityType: 'User',
        entityId:   userToEvaluate.id,
        action:     'EVALUATE_PROFILE',
        actorId:    input.evaluatorAdminUserId,
        actorRole:  'ADMIN',
        changes:    {
          oldEvaluationStatus: oldStatus,
          newEvaluationStatus: userToEvaluate.profileEvaluationStatus,
          email:               userToEvaluate.email.value,
        },
        reason: input.reason || `Avaliação do perfil de usuário para ${input.status}`,
      });

      if (logResult.isSuccess) {
        await this.auditLogRepository.save(logResult.getValue());
      }
    }

    return Result.ok<void>(undefined as any);
  }
}
