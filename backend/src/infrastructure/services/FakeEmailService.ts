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

  async sendNewUserRegisteredAdminNotification(
    recipientEmail: string,
    userDetails: {
      fullName?: string;
      email: string;
      role: string;
      registeredAt: Date;
    },
  ): Promise<void> {
    const subject = `CeLiLac — Novo Usuário Registrado (${userDetails.role})`;
    const body = `Olá Administrador,\n\nUm novo usuário acaba de se cadastrar no CeLiLac!\n\nNome: ${userDetails.fullName || 'Não informado'}\nE-mail: ${userDetails.email}\nTipo de Conta: ${userDetails.role}\nData/Hora: ${userDetails.registeredAt.toISOString()}\n\nAcesse o painel para moderar e visualizar usuários: https://celilac.com.br/admin/users\n\nAtenciosamente,\nEquipe CeLiLac`;

    console.log(`[FakeEmailService]: 🔔 Notificação de novo usuário enviada para ${recipientEmail} | Novo usuário: ${userDetails.email} (${userDetails.role})`);
    this.sentEmails.push({ to: recipientEmail, subject, body });
  }
}
