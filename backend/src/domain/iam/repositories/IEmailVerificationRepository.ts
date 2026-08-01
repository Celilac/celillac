// backend/src/domain/iam/repositories/IEmailVerificationRepository.ts
import { EmailVerification } from '../EmailVerification';

export interface IEmailVerificationRepository {
  save(verification: EmailVerification): Promise<void>;
  findLatestPendingByUserId(userId: string): Promise<EmailVerification | null>;
  findByUserIdAndCode(userId: string, code: string): Promise<EmailVerification | null>;
  invalidatePreviousCodes(userId: string): Promise<void>;
}
