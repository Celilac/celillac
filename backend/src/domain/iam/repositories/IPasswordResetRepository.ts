// backend/src/domain/iam/repositories/IPasswordResetRepository.ts
import { PasswordReset } from '../PasswordReset';

export interface IPasswordResetRepository {
  save(reset: PasswordReset): Promise<void>;
  findLatestPendingByUserId(userId: string): Promise<PasswordReset | null>;
  findByUserIdAndCode(userId: string, code: string): Promise<PasswordReset | null>;
  invalidatePreviousCodes(userId: string): Promise<void>;
}
