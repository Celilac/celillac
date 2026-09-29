// backend/src/infrastructure/logging/SecurityLogger.ts
import crypto from 'crypto';

export type SecurityLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type SecurityEventType =
  | 'SECURITY_LOGIN_FAILED'
  | 'SECURITY_OTP_FAILED'
  | 'SECURITY_BOLA_VIOLATION'
  | 'SECURITY_ACCESS_FORBIDDEN'
  | 'SECURITY_RATE_LIMIT_TRIGGERED'
  | 'SECURITY_BOT_BLOCKED'
  | 'SECURITY_MALICIOUS_UPLOAD_BLOCKED';

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
 * Mascara dados sensíveis (e-mails via hash SHA-256 / anonimização) para cumprir LGPD/PII.
 */
export class SecurityLogger {
  private static anonymizeEmail(email?: string): string | undefined {
    if (!email) return undefined;
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    const maskedUser = user.length > 2 ? `${user.substring(0, 2)}***` : '***';
    return `${maskedUser}@${domain}`;
  }

  private static hashEmail(email?: string): string | undefined {
    if (!email) return undefined;
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').substring(0, 16);
  }

  static writeLog(payload: SecurityLogPayload): void {
    const formatted = JSON.stringify(payload);
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
}
