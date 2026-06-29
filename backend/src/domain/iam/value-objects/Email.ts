// backend/src/domain/iam/value-objects/Email.ts
import { Result } from '../../Result';

/**
 * Email — Value Object imutável.
 * Valida formato RFC 5322 simplificado.
 * Zero dependências externas — pure domain.
 */
export class Email {
  // RFC 5322 simplificado — suficiente para validação de domínio
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  static create(email: string): Result<Email> {
    if (!email || email.trim().length === 0) {
      return Result.fail<Email>('Email inválido.');
    }

    const normalized = email.trim().toLowerCase();

    if (!Email.EMAIL_REGEX.test(normalized)) {
      return Result.fail<Email>('Email inválido.');
    }

    return Result.ok<Email>(new Email(normalized));
  }
}
