// backend/src/application/admin/ListUsersUseCase.ts
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface UserSummaryDTO {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  birthDate?: Date;
  gender?: string;
  avatarUrl?: string;
  accountStatus: string;
  profileEvaluationStatus: string;
  isEmailVerified: boolean;
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(adminUserId: string): Promise<Result<UserSummaryDTO[]>> {
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      return Result.fail<UserSummaryDTO[]>('Somente administradores podem listar usuários.');
    }

    const users = await this.userRepository.findAll();

    const dtos: UserSummaryDTO[] = users.map((u) => ({
      id: u.id,
      email: u.email.value,
      role: u.role,
      fullName: u.fullName,
      birthDate: u.birthDate,
      gender: u.gender,
      avatarUrl: u.avatarUrl,
      accountStatus: u.accountStatus,
      profileEvaluationStatus: u.profileEvaluationStatus,
      isEmailVerified: u.isEmailVerified,
    }));

    return Result.ok<UserSummaryDTO[]>(dtos);
  }
}
