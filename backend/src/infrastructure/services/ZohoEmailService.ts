// backend/src/infrastructure/services/ZohoEmailService.ts
import https from 'https';
import { IEmailService } from '../../domain/services/IEmailService';

/**
 * ZohoEmailService — Serviço de envio de e-mails transacionais via Zoho Email API / ZeptoMail.
 *
 * Configuração via variáveis de ambiente:
 *  - ZOHO_FROM_EMAIL: e-mail remetente (ex: contato@celilac.com.br)
 *  - ZOHO_API_TOKEN: token de autenticação transacional da Zoho / ZeptoMail
 *  - ZOHO_API_URL: endpoint (padrão: api.zeptomail.com)
 */
export class ZohoEmailService implements IEmailService {
  private readonly fromEmail: string;
  private readonly apiToken: string;
  private readonly apiUrl: string;

  constructor() {
    this.fromEmail = process.env.ZOHO_FROM_EMAIL || process.env.ZOHO_SMTP_USER || 'contato@celilac.com.br';
    this.apiToken = process.env.ZOHO_API_TOKEN || process.env.ZOHO_SMTP_PASS || '';
    this.apiUrl = process.env.ZOHO_API_URL || 'api.zeptomail.com';
  }

  async sendVerificationCode(recipientEmail: string, code: string, recipientName?: string): Promise<void> {
    const subject = 'CeLiLac — Seu código de verificação';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0; font-size: 24px;">Celi<span style="color: #10b981;">Lac</span></h2>
          <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Vivendo bem a vida</p>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="color: #111827; margin-top: 0;">Verificação de E-mail</h3>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">
            Olá${recipientName ? ' <strong>' + recipientName + '</strong>' : ''},
          </p>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">
            Utilize o código numérico abaixo para verificar seu endereço de e-mail no CeLiLac:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #059669; background-color: #ecfdf5; padding: 12px 28px; border-radius: 8px; border: 1px solid #a7f3d0;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 13px; text-align: center;">
            Este código é válido por 15 minutos. Se você não solicitou este código, ignore este e-mail.
          </p>
        </div>
      </div>
    `;

    await this.postEmailPayload(recipientEmail, subject, htmlContent);
  }

  async sendAdminApprovalNotification(recipientEmail: string, adminName?: string): Promise<void> {
    const subject = 'CeLiLac — Sua conta de Administrador foi aprovada!';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background-color: #f9fafb; border-radius: 12px;">
        <h2 style="color: #059669;">CeliLac — Aprovação de Conta</h2>
        <p>Olá${adminName ? ' ' + adminName : ''},</p>
        <p>Sua conta de Administrador no CeLiLac foi autorizada por um administrador existente. Você já pode acessar a plataforma normalmente.</p>
      </div>
    `;

    await this.postEmailPayload(recipientEmail, subject, htmlContent);
  }

  private async postEmailPayload(toEmail: string, subject: string, htmlContent: string): Promise<void> {
    const payload = JSON.stringify({
      from: { address: this.fromEmail, name: 'CeLiLac' },
      to: [{ email_address: { address: toEmail } }],
      subject,
      htmlbody: htmlContent,
    });

    const options: https.RequestOptions = {
      hostname: this.apiUrl,
      path: '/v1.1/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-enczapikey ${this.apiToken}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log(`[ZohoEmailService]: Status ${res.statusCode} para ${toEmail}`);
          resolve();
        });
      });

      req.on('error', (err) => {
        console.error('[ZohoEmailService]: Erro ao enviar e-mail via Zoho:', err);
        resolve();
      });

      req.write(payload);
      req.end();
    });
  }
}
