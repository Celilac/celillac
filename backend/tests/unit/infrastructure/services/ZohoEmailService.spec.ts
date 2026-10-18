// backend/tests/unit/infrastructure/services/ZohoEmailService.spec.ts
import https from 'https';
import tls from 'tls';
import { ZohoEmailService } from '../../../../src/infrastructure/services/ZohoEmailService';

describe('ZohoEmailService (Security & Sanitization)', () => {
  let service: ZohoEmailService;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new ZohoEmailService();
    // Intercepta dispatchEmail para evitar conexões de rede nos testes unitários padrão
    jest.spyOn(service as any, 'dispatchEmail').mockResolvedValue(undefined);

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('não deve vazar o código OTP no log ao enviar verificação de e-mail e deve mascarar o e-mail', async () => {
    const rawOtp = '984712';
    const email = 'usuario.seguro@empresa.com.br';

    await service.sendVerificationCode(email, rawOtp, 'Usuário Teste');

    expect(logSpy).toHaveBeenCalled();

    const allLoggedMessages = logSpy.mock.calls.map((call) => call.join(' ')).join(' | ');

    // O código OTP bruto NUNCA deve constar no log
    expect(allLoggedMessages).not.toContain(rawOtp);
    // O e-mail deve estar mascarado
    expect(allLoggedMessages).toContain('us***@empresa.com.br');
    expect(allLoggedMessages).not.toContain(email);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('deve enviar código OTP mesmo sem nome do destinatário informado', async () => {
    await service.sendVerificationCode('semnome@teste.com', '123456');
    const allLoggedMessages = logSpy.mock.calls.map((call) => call.join(' ')).join(' | ');
    expect(allLoggedMessages).not.toContain('123456');
    expect(allLoggedMessages).toContain('se***@teste.com');
  });

  it('não deve vazar o código de recuperação de senha no log e deve mascarar o e-mail', async () => {
    const rawResetCode = '123890';
    const email = 'admin.sistema@celilac.com.br';

    await service.sendPasswordResetCode(email, rawResetCode, 'Admin Master');

    expect(logSpy).toHaveBeenCalled();

    const allLoggedMessages = logSpy.mock.calls.map((call) => call.join(' ')).join(' | ');

    // O código de reset bruto NUNCA deve constar no log
    expect(allLoggedMessages).not.toContain(rawResetCode);
    // O e-mail deve estar mascarado
    expect(allLoggedMessages).toContain('ad***@celilac.com.br');
    expect(allLoggedMessages).not.toContain(email);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('deve enviar recuperação de senha sem nome do destinatário informado', async () => {
    await service.sendPasswordResetCode('outro@celilac.com.br', '654321');
    const allLoggedMessages = logSpy.mock.calls.map((call) => call.join(' ')).join(' | ');
    expect(allLoggedMessages).not.toContain('654321');
    expect(allLoggedMessages).toContain('ou***@celilac.com.br');
  });

  it('deve enviar notificação de aprovação de admin com e sem nome', async () => {
    await service.sendAdminApprovalNotification('admin1@celilac.com.br', 'Admin Um');
    await service.sendAdminApprovalNotification('admin2@celilac.com.br');
    expect((service as any).dispatchEmail).toHaveBeenCalledTimes(2);
  });

  it('deve mascarar o e-mail de notificação de novo usuário registrado para o admin em diferentes papéis', async () => {
    const adminEmail = 'moderador@celilac.com.br';

    await service.sendNewUserRegisteredAdminNotification(adminEmail, {
      fullName: 'Novo Celiaco',
      email: 'novo@celilac.com.br',
      role: 'CELIACO',
      registeredAt: new Date(),
    });

    await service.sendNewUserRegisteredAdminNotification(adminEmail, {
      email: 'parceiro@celilac.com.br',
      role: 'PARCEIRO',
      registeredAt: new Date(),
    });

    await service.sendNewUserRegisteredAdminNotification(adminEmail, {
      email: 'admin@celilac.com.br',
      role: 'ADMIN',
      registeredAt: new Date(),
    });

    await service.sendNewUserRegisteredAdminNotification(adminEmail, {
      email: 'outro@celilac.com.br',
      role: 'DESCONHECIDO',
      registeredAt: new Date(),
    });

    const allLoggedMessages = logSpy.mock.calls.map((call) => call.join(' ')).join(' | ');

    expect(allLoggedMessages).toContain('mo***@celilac.com.br');
    expect(allLoggedMessages).not.toContain(adminEmail);
  });

  it('deve inicializar com variáveis de ambiente customizadas', () => {
    const originalEnv = { ...process.env };
    process.env.ZOHO_SMTP_HOST = 'custom.smtp.com';
    process.env.ZOHO_SMTP_PORT = '587';
    process.env.ZOHO_SMTP_USER = 'custom@mail.com';
    process.env.ZOHO_SMTP_PASS = 'secret123';
    process.env.ZOHO_FROM_EMAIL = 'from@mail.com';
    process.env.ZOHO_API_TOKEN = 'tok-123';
    process.env.ZOHO_API_URL = 'custom.api.com';

    const customService = new ZohoEmailService();
    expect((customService as any).smtpHost).toBe('custom.smtp.com');
    expect((customService as any).smtpPort).toBe(587);
    expect((customService as any).smtpUser).toBe('custom@mail.com');
    expect((customService as any).smtpPass).toBe('secret123');
    expect((customService as any).fromEmail).toBe('from@mail.com');
    expect((customService as any).apiToken).toBe('tok-123');
    expect((customService as any).apiUrl).toBe('custom.api.com');

    process.env = originalEnv;
  });

  it('deve direcionar dispatchEmail para ZeptoMail quando apiToken estiver configurado', async () => {
    jest.restoreAllMocks();
    const zeptoSpy = jest.spyOn(service as any, 'postEmailViaZeptoMail').mockResolvedValue(undefined);
    const smtpSpy = jest.spyOn(service as any, 'sendEmailViaSmtpTls').mockResolvedValue(undefined);

    (service as any).apiToken = 'zepto-mock-token';
    await (service as any).dispatchEmail('test@celilac.com.br', 'Subject', 'Content');

    expect(zeptoSpy).toHaveBeenCalledWith('test@celilac.com.br', 'Subject', 'Content');
    expect(smtpSpy).not.toHaveBeenCalled();
  });

  it('deve direcionar dispatchEmail para SMTP TLS quando apiToken não estiver configurado', async () => {
    jest.restoreAllMocks();
    const zeptoSpy = jest.spyOn(service as any, 'postEmailViaZeptoMail').mockResolvedValue(undefined);
    const smtpSpy = jest.spyOn(service as any, 'sendEmailViaSmtpTls').mockResolvedValue(undefined);

    (service as any).apiToken = undefined;
    await (service as any).dispatchEmail('test@celilac.com.br', 'Subject', 'Content');

    expect(smtpSpy).toHaveBeenCalledWith('test@celilac.com.br', 'Subject', 'Content');
    expect(zeptoSpy).not.toHaveBeenCalled();
  });

  it('deve processar envio com sucesso e com erro via ZeptoMail API', async () => {
    jest.restoreAllMocks();
    const logSpyLocal = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errSpyLocal = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Cenário 1: Sucesso 200
    const mockReq200 = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    jest.spyOn(https, 'request').mockImplementationOnce((_opts: any, cb: any) => {
      const mockRes = {
        statusCode: 200,
        on: jest.fn((event: string, handler: any) => {
          if (event === 'data') handler(Buffer.from('ok'));
          if (event === 'end') handler();
        }),
      };
      cb(mockRes);
      return mockReq200 as any;
    });

    await (service as any).postEmailViaZeptoMail('cliente@celilac.com.br', 'Teste', '<p>Corpo</p>');
    expect(logSpyLocal).toHaveBeenCalledWith(expect.stringContaining('Status 200 via ZeptoMail'));

    // Cenário 2: Erro de status 500
    const mockReq500 = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    jest.spyOn(https, 'request').mockImplementationOnce((_opts: any, cb: any) => {
      const mockRes = {
        statusCode: 500,
        on: jest.fn((event: string, handler: any) => {
          if (event === 'data') handler(Buffer.from('Internal error'));
          if (event === 'end') handler();
        }),
      };
      cb(mockRes);
      return mockReq500 as any;
    });

    await (service as any).postEmailViaZeptoMail('cliente@celilac.com.br', 'Teste', '<p>Corpo</p>');
    expect(errSpyLocal).toHaveBeenCalledWith(expect.stringContaining('Resposta do ZeptoMail'));

    // Cenário 3: Erro de rede (req.on error)
    const mockReqErr = {
      on: jest.fn((event: string, handler: any) => {
        if (event === 'error') handler(new Error('Network drop'));
      }),
      write: jest.fn(),
      end: jest.fn(),
    };
    jest.spyOn(https, 'request').mockImplementationOnce((_opts: any, _cb: any) => {
      return mockReqErr as any;
    });

    await (service as any).postEmailViaZeptoMail('cliente@celilac.com.br', 'Teste', '<p>Corpo</p>');
    expect(errSpyLocal).toHaveBeenCalledWith(expect.stringContaining('Erro ao enviar e-mail via ZeptoMail API'), expect.any(Error));
  });

  it('deve processar envio via SMTP TLS simulado (fluxo completo, erro de comando e erro de socket)', async () => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const errSpyLocal = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Cenário 1: Fluxo completo SMTP
    let dataHandler: ((data: Buffer) => void) | undefined;
    const mockSocket = {
      write: jest.fn((cmd: string) => {
        if (cmd.startsWith('EHLO')) {
          setTimeout(() => dataHandler?.(Buffer.from('250-smtp.zoho.com\r\n250 AUTH LOGIN\r\n')), 1);
        } else if (cmd.startsWith('AUTH LOGIN')) {
          setTimeout(() => dataHandler?.(Buffer.from('334 VXNlcm5hbWU6\r\n')), 1);
        } else if (cmd.startsWith('MAIL FROM')) {
          setTimeout(() => dataHandler?.(Buffer.from('250 Sender OK\r\n')), 1);
        } else if (cmd.startsWith('RCPT TO')) {
          setTimeout(() => dataHandler?.(Buffer.from('250 Recipient OK\r\n')), 1);
        } else if (cmd.startsWith('DATA')) {
          setTimeout(() => dataHandler?.(Buffer.from('354 Enter message\r\n')), 1);
        } else if (cmd.includes('Subject:')) {
          setTimeout(() => dataHandler?.(Buffer.from('250 Message accepted\r\n')), 1);
        }
      }),
      on: jest.fn((event: string, handler: any) => {
        if (event === 'data') dataHandler = handler;
      }),
      end: jest.fn(),
    };

    jest.spyOn(tls, 'connect').mockImplementationOnce((_opts: any, onConnect: any) => {
      setTimeout(() => {
        onConnect();
        // Passo 0: servidor envia 220
        dataHandler?.(Buffer.from('220 smtp.zoho.com\r\n'));
        // Passo 3: simula resposta após auth username
        setTimeout(() => dataHandler?.(Buffer.from('334 UGFzc3dvcmQ6\r\n')), 5);
        // Passo 4: simula resposta após auth password
        setTimeout(() => dataHandler?.(Buffer.from('235 Authentication successful\r\n')), 10);
      }, 1);
      return mockSocket as any;
    });

    await (service as any).sendEmailViaSmtpTls('cliente@celilac.com.br', 'Assunto', '<p>Corpo</p>');
    expect(mockSocket.end).toHaveBeenCalled();

    // Cenário 2: Erro do servidor SMTP (código 5xx)
    jest.spyOn(tls, 'connect').mockImplementationOnce((_opts: any, onConnect: any) => {
      setTimeout(() => {
        onConnect();
        dataHandler?.(Buffer.from('550 User not found\r\n'));
      }, 1);
      return mockSocket as any;
    });

    await (service as any).sendEmailViaSmtpTls('cliente@celilac.com.br', 'Assunto', '<p>Corpo</p>');
    expect(errSpyLocal).toHaveBeenCalledWith(expect.stringContaining('Resposta de erro do SMTP'));

    // Cenário 3: Erro de conexão socket
    jest.spyOn(tls, 'connect').mockImplementationOnce((_opts: any, onConnect: any) => {
      setTimeout(() => {
        onConnect();
      }, 1);
      return {
        write: jest.fn(),
        on: jest.fn((event: string, handler: any) => {
          if (event === 'error') setTimeout(() => handler(new Error('Connection timed out')), 2);
        }),
        end: jest.fn(),
      } as any;
    });

    await (service as any).sendEmailViaSmtpTls('cliente@celilac.com.br', 'Assunto', '<p>Corpo</p>');
    expect(errSpyLocal).toHaveBeenCalledWith(expect.stringContaining('Erro na conexão SMTP TLS com Zoho:'), 'Connection timed out');
  });
});
