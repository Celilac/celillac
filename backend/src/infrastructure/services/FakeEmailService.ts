// backend/src/infrastructure/services/FakeEmailService.ts
import { IEmailService } from '../../domain/services/IEmailService';

export class FakeEmailService implements IEmailService {
  public sentEmails: Array<{ to: string; subject: string; body: string }> = [];

  async sendVerificationCode(recipientEmail: string, code: string, recipientName?: string): Promise<void> {
    const subject = 'CeLiLac — Seu código de verificação de e-mail';
    const body = `Olá${recipientName ? ' ' + recipientName : ''},\n\nSeu código de verificação do CeLiLac é: ${code}\n\nEste código é válido por 15 minutos.\n\nAtenciosamente,\nEquipe CeLiLac`;

    console.log(`[FakeEmailService]: Enviando código ${code} para ${recipientEmail}`);
    this.sentEmails.push({ to: recipientEmail, subject, body });
  }

  async sendAdminApprovalNotification(recipientEmail: string, adminName?: string): Promise<void> {
    const subject = 'CeLiLac — Sua conta de Administrador foi aprovada!';
    const body = `Olá${adminName ? ' ' + adminName : ''},\n\nSua conta de Administrador no CeLiLac foi aprovada por um administrador existente. Você já pode fazer login e acessar o painel de moderação.\n\nAtenciosamente,\nEquipe CeLiLac`;

    console.log(`[FakeEmailService]: Enviando e-mail para ${recipientEmail} | Assunto: ${subject}`);
    this.sentEmails.push({ to: recipientEmail, subject, body });
  }
}
