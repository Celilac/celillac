// backend/src/infrastructure/services/ZohoEmailService.ts
import https from 'https';
import tls from 'tls';
import { IEmailService } from '../../domain/services/IEmailService';

/**
 * ZohoEmailService — Serviço de envio de e-mails transacionais via Zoho Mail (SMTP TLS / ZeptoMail API).
 *
 * Configuração via variáveis de ambiente (.env):
 *  - ZOHO_SMTP_HOST: servidor SMTP (padrão: smtp.zoho.com)
 *  - ZOHO_SMTP_PORT: porta SSL/TLS (padrão: 465)
 *  - ZOHO_SMTP_USER: conta de e-mail (ex: celilac@zohomail.com)
 *  - ZOHO_SMTP_PASS: senha da conta ou App Password
 *  - ZOHO_FROM_EMAIL: e-mail do remetente
 *  - ZOHO_API_TOKEN: (opcional) token para uso via ZeptoMail API HTTP
 */
export class ZohoEmailService implements IEmailService {
  private readonly smtpHost: string;
  private readonly smtpPort: number;
  private readonly smtpUser: string;
  private readonly smtpPass: string;
  private readonly fromEmail: string;
  private readonly apiToken?: string;
  private readonly apiUrl: string;

  constructor() {
    this.smtpHost = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
    this.smtpPort = Number(process.env.ZOHO_SMTP_PORT) || 465;
    this.smtpUser = process.env.ZOHO_SMTP_USER || 'celilac@zohomail.com';
    this.smtpPass = process.env.ZOHO_SMTP_PASS || '';
    this.fromEmail = process.env.ZOHO_FROM_EMAIL || this.smtpUser;
    this.apiToken = process.env.ZOHO_API_TOKEN;
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

    await this.dispatchEmail(recipientEmail, subject, htmlContent);
  }

  async sendAdminApprovalNotification(recipientEmail: string, adminName?: string): Promise<void> {
    const subject = 'CeLiLac — Sua conta de Administrador foi aprovada!';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0; font-size: 24px;">Celi<span style="color: #10b981;">Lac</span></h2>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px;">
          <h3 style="color: #059669; margin-top: 0;">Aprovação de Conta Administradora</h3>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">
            Olá${adminName ? ' <strong>' + adminName + '</strong>' : ''},
          </p>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">
            Sua conta de Administrador no CeLiLac foi autorizada com sucesso por um administrador existente. Você já pode acessar a plataforma normalmente.
          </p>
        </div>
      </div>
    `;

    await this.dispatchEmail(recipientEmail, subject, htmlContent);
  }

  private async dispatchEmail(toEmail: string, subject: string, htmlContent: string): Promise<void> {
    if (this.apiToken) {
      await this.postEmailViaZeptoMail(toEmail, subject, htmlContent);
    } else {
      await this.sendEmailViaSmtpTls(toEmail, subject, htmlContent);
    }
  }

  private async sendEmailViaSmtpTls(toEmail: string, subject: string, htmlContent: string): Promise<void> {
    return new Promise((resolve) => {
      const socket = tls.connect(
        {
          host: this.smtpHost,
          port: this.smtpPort,
          rejectUnauthorized: false,
        },
        () => {
          let step = 0;

          const sendCommand = (cmd: string) => {
            socket.write(cmd + '\r\n');
          };

          socket.on('data', (data) => {
            const responses = data.toString().split('\r\n').filter(Boolean);

            for (const response of responses) {
              if (step === 0 && response.startsWith('220')) {
                step = 1;
                sendCommand(`EHLO ${this.smtpHost}`);
              } else if (step === 1 && (response.startsWith('250') || response.includes('250-') || response.includes('250 '))) {
                if (response.startsWith('250 ')) {
                  step = 2;
                  sendCommand('AUTH LOGIN');
                }
              } else if (step === 2 && response.startsWith('334')) {
                step = 3;
                sendCommand(Buffer.from(this.smtpUser).toString('base64'));
              } else if (step === 3 && response.startsWith('334')) {
                step = 4;
                sendCommand(Buffer.from(this.smtpPass).toString('base64'));
              } else if (step === 4 && response.startsWith('235')) {
                step = 5;
                sendCommand(`MAIL FROM:<${this.fromEmail}>`);
              } else if (step === 5 && response.startsWith('250')) {
                step = 6;
                sendCommand(`RCPT TO:<${toEmail}>`);
              } else if (step === 6 && response.startsWith('250')) {
                step = 7;
                sendCommand('DATA');
              } else if (step === 7 && response.startsWith('354')) {
                step = 8;
                const emailData = [
                  `From: "CeLiLac" <${this.fromEmail}>`,
                  `To: <${toEmail}>`,
                  `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
                  'MIME-Version: 1.0',
                  'Content-Type: text/html; charset=UTF-8',
                  '',
                  htmlContent,
                  '.',
                ].join('\r\n');
                sendCommand(emailData);
              } else if (step === 8 && response.startsWith('250')) {
                step = 9;
                sendCommand('QUIT');
                console.log(`[ZohoEmailService]: E-mail enviado com sucesso via SMTP TLS para ${toEmail}`);
                socket.end();
                resolve();
              } else if (response.startsWith('5') || response.startsWith('4')) {
                console.error(`[ZohoEmailService]: Resposta de erro do SMTP (${step}): ${response.trim()}`);
                socket.end();
                resolve();
              }
            }
          });

          socket.on('error', (err) => {
            console.error('[ZohoEmailService]: Erro na conexão SMTP TLS com Zoho:', err.message);
            resolve();
          });
        },
      );
    });
  }

  private async postEmailViaZeptoMail(toEmail: string, subject: string, htmlContent: string): Promise<void> {
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
          console.log(`[ZohoEmailService]: Status ${res.statusCode} via ZeptoMail para ${toEmail}`);
          resolve();
        });
      });

      req.on('error', (err) => {
        console.error('[ZohoEmailService]: Erro ao enviar e-mail via ZeptoMail API:', err);
        resolve();
      });

      req.write(payload);
      req.end();
    });
  }
}
