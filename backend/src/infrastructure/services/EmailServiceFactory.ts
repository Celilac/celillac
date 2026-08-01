// backend/src/infrastructure/services/EmailServiceFactory.ts
import { IEmailService } from '../../domain/services/IEmailService';
import { FakeEmailService } from './FakeEmailService';
import { ZohoEmailService } from './ZohoEmailService';

export class EmailServiceFactory {
  private static instance: IEmailService;

  public static getService(): IEmailService {
    if (EmailServiceFactory.instance) {
      return EmailServiceFactory.instance;
    }

    const isTest = process.env.NODE_ENV === 'test';
    const hasZohoConfig = !!(process.env.ZOHO_API_TOKEN || process.env.ZOHO_SMTP_USER);

    if (hasZohoConfig && !isTest) {
      console.log('[EmailServiceFactory]: Utilizando driver ZohoEmailService.');
      EmailServiceFactory.instance = new ZohoEmailService();
    } else {
      console.log('[EmailServiceFactory]: Utilizando driver FakeEmailService (Dev/Testes).');
      EmailServiceFactory.instance = new FakeEmailService();
    }

    return EmailServiceFactory.instance;
  }
}
