// backend/src/infrastructure/logging/SecurityLogger.ts
import crypto from 'crypto';
import { DataMasker } from '../security/DataMasker';

export type SecurityLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type SecurityEventType =
  | 'SECURITY_LOGIN_FAILED'
  | 'SECURITY_OTP_FAILED'
  | 'SECURITY_BOLA_VIOLATION'
  | 'SECURITY_ACCESS_FORBIDDEN'
  | 'SECURITY_RATE_LIMIT_TRIGGERED'
  | 'SECURITY_BOT_BLOCKED'
  | 'SECURITY_MALICIOUS_UPLOAD_BLOCKED'
  | 'PAYMENT_CHECKOUT_ATTEMPT'
  | 'PAYMENT_PROCESSED'
  | 'PAYMENT_REFUNDED'
  | 'PARTNER_FINANCIAL_ACCOUNT_CONFIGURED'
  | 'ORDER_PAYMENT_REFUSED_ON_DELIVERY';

export interface SecurityLogPayload {
  timestamp: string;
  level: SecurityLogLevel;
  event: SecurityEventType;
  ip: string;
  userAgent?: string;
  path?: string;
  actorId?: string;
  targetId?: string;
  details?: Record<string, any>;
  reason?: string;
}

/**
 * SecurityLogger (A09: Auditoria & Observabilidade de Segurança)
 *
 * Gera logs estruturados em JSON de linha única para ingestão em ferramentas
 * de SIEM e APM (Datadog, ElasticSearch, CloudWatch, Loki).
 * Mascara dados sensíveis (e-mails, CPFs, cartões via DataMasker) para cumprir LGPD/PII e PCI-DSS.
 */
export class SecurityLogger {
  private static anonymizeEmail(email?: string): string | undefined {
    return DataMasker.maskEmail(email);
  }

  private static hashEmail(email?: string): string | undefined {
    if (!email) return undefined;
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').substring(0, 16);
  }

  static writeLog(payload: SecurityLogPayload): void {
    const sanitizedDetails = payload.details ? DataMasker.maskSensitiveData(payload.details) : undefined;
    const sanitizedPayload: SecurityLogPayload = {
      ...payload,
      details: sanitizedDetails,
    };
    const formatted = JSON.stringify(sanitizedPayload);
    if (payload.level === 'ERROR' || payload.level === 'CRITICAL') {
      console.error(`[AppSec]: ${formatted}`);
    } else {
      console.warn(`[AppSec]: ${formatted}`);
    }
  }

  static logLoginFailed(ip: string, email: string, userAgent?: string, reason?: string): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event: 'SECURITY_LOGIN_FAILED',
      ip,
      userAgent,
      details: {
        emailMasked: this.anonymizeEmail(email),
        emailHash: this.hashEmail(email),
      },
      reason: reason || 'Credenciais inválidas.',
    });
  }

  static logOtpFailed(ip: string, identifier: string, action: string, reason?: string): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event: 'SECURITY_OTP_FAILED',
      ip,
      details: {
        action,
        identifierHash: this.hashEmail(identifier),
      },
      reason: reason || 'Código OTP inválido ou expirado.',
    });
  }

  static logBolaViolation(ip: string, actorId: string, resource: string, targetId: string, path?: string): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      event: 'SECURITY_BOLA_VIOLATION',
      ip,
      actorId,
      targetId,
      path,
      details: { resource },
      reason: 'Tentativa de acesso/modificação a recurso de outro usuário/inquilino (BOLA/IDOR).',
    });
  }

  static logAccessForbidden(ip: string, path: string, reason: string, userAgent?: string, actorId?: string): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event: 'SECURITY_ACCESS_FORBIDDEN',
      ip,
      path,
      userAgent,
      actorId,
      reason,
    });
  }

  static logRateLimitTriggered(ip: string, path: string, count: number, max: number): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event: 'SECURITY_RATE_LIMIT_TRIGGERED',
      ip,
      path,
      details: { count, max },
      reason: 'Taxa máxima de requisições por janela excedida.',
    });
  }

  static logBotBlocked(ip: string, userAgent: string, path: string, botName?: string): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event: 'SECURITY_BOT_BLOCKED',
      ip,
      userAgent,
      path,
      details: { botName },
      reason: 'Rastreador predatório, agente de IA ou scraper bloqueado.',
    });
  }

  static logMaliciousUploadBlocked(ip: string, filenameOrType: string, reason: string): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      event: 'SECURITY_MALICIOUS_UPLOAD_BLOCKED',
      ip,
      details: { filenameOrType },
      reason,
    });
  }

  static logPaymentCheckoutAttempt(data: {
    ip: string;
    actorId: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    idempotencyKey?: string;
  }): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event: 'PAYMENT_CHECKOUT_ATTEMPT',
      ip: data.ip,
      actorId: data.actorId,
      targetId: data.orderId,
      path: '/payments/checkout',
      details: {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        idempotencyKey: data.idempotencyKey,
      },
      reason: 'Início de processamento de checkout de pedido.',
    });
  }

  static logPaymentProcessed(data: {
    ip?: string;
    orderId: string;
    paymentId: string;
    status: string;
    gatewayTransactionId?: string;
  }): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event: 'PAYMENT_PROCESSED',
      ip: data.ip || '127.0.0.1',
      targetId: data.paymentId,
      path: '/payments/webhook/asaas',
      details: {
        orderId: data.orderId,
        status: data.status,
        gatewayTransactionId: data.gatewayTransactionId,
      },
      reason: `Pagamento processado com status: ${data.status}`,
    });
  }

  static logPaymentRefunded(data: {
    ip?: string;
    actorId?: string;
    orderId?: string;
    paymentId: string;
    refundAmount: number;
    reason?: string;
  }): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event: 'PAYMENT_REFUNDED',
      ip: data.ip || '127.0.0.1',
      actorId: data.actorId,
      targetId: data.paymentId,
      details: {
        orderId: data.orderId,
        refundAmount: data.refundAmount,
      },
      reason: data.reason || 'Estorno financeiro processado.',
    });
  }

  static logPartnerFinancialAccountConfigured(data: {
    ip: string;
    actorId: string;
    partnerId: string;
    pixKeyType: string;
    pixKey: string;
    bankCode?: string;
  }): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event: 'PARTNER_FINANCIAL_ACCOUNT_CONFIGURED',
      ip: data.ip,
      actorId: data.actorId,
      targetId: data.partnerId,
      path: '/payments/partner/financial-account',
      details: {
        pixKeyType: data.pixKeyType,
        pixKey: data.pixKey,
        bankCode: data.bankCode,
      },
      reason: 'Configuração ou atualização de dados bancários/PIX para split Asaas.',
    });
  }

  static logOrderPaymentRefusedOnDelivery(data: {
    ip?: string;
    userAgent?: string;
    actorId: string;
    targetId: string;
    orderId: string;
    partnerId: string;
    reportId: string;
    reason: string;
    details?: string;
    platformFeeWaived: boolean;
    consumerBlocked: boolean;
  }): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event: 'ORDER_PAYMENT_REFUSED_ON_DELIVERY',
      ip: data.ip || '127.0.0.1',
      userAgent: data.userAgent,
      actorId: data.actorId,
      targetId: data.targetId,
      details: {
        orderId: data.orderId,
        partnerId: data.partnerId,
        reportId: data.reportId,
        reason: data.reason,
        details: data.details,
        platformFeeWaived: data.platformFeeWaived,
        consumerBlocked: data.consumerBlocked,
      },
      reason: data.details || data.reason,
    });
  }
}

