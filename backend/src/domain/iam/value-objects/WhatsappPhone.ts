// backend/src/domain/iam/value-objects/WhatsappPhone.ts
import { Result } from '../../Result';

/**
 * WhatsappPhone — Value Object do IAM.
 * Suporta qualquer DDI internacional (padrão E.164: + seguido de 7 a 15 dígitos).
 */
export class WhatsappPhone {
  private static readonly INT_PHONE_REGEX = /^\+\d{7,15}$/;

  private constructor(public readonly value: string) {}

  public static create(phone?: string | null): Result<WhatsappPhone | undefined> {
    if (!phone || phone.trim().length === 0) {
      return Result.ok<WhatsappPhone | undefined>(undefined);
    }

    const trimmed = phone.trim();
    if (!this.INT_PHONE_REGEX.test(trimmed)) {
      return Result.fail<WhatsappPhone>(
        'Número de WhatsApp inválido (ex: +5511987654321).',
      );
    }

    return Result.ok<WhatsappPhone>(new WhatsappPhone(trimmed));
  }
}
