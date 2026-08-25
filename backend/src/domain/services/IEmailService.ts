// backend/src/domain/services/IEmailService.ts

export interface IEmailService {
  sendVerificationCode(recipientEmail: string, code: string, recipientName?: string): Promise<void>;
  sendAdminApprovalNotification(recipientEmail: string, adminName?: string): Promise<void>;
  sendNewUserRegisteredAdminNotification(
    recipientEmail: string,
    userDetails: {
      fullName?: string;
      email: string;
      role: string;
      registeredAt: Date;
    },
  ): Promise<void>;
}
