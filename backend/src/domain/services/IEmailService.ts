// backend/src/domain/services/IEmailService.ts

export interface IEmailService {
  sendAdminApprovalNotification(recipientEmail: string, adminName?: string): Promise<void>;
}
