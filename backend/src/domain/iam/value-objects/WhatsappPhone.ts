// backend/src/domain/iam/value-objects/WhatsappPhone.ts
import { Result } from '../../Result';

/**
 * WhatsappPhone — Value Object imutável.
 * Número de contato exclusivo para WhatsApp, em formato E.164 com DDI do
 * Brasil obrigatório (+55). Zero dependências externas — pure domain.
 */
export class WhatsappPhone {
  // +55 seguido de DDD (2 dígitos) + número (8 ou 9 dígitos) = 10 ou 11 dígitos após o DDI
  private static readonly E164_BR_REGEX = /^\+55\d{10,11}$/;

  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  static create(phone: string): Result<WhatsappPhone> {
    if (!phone || phone.trim().length === 0) {
      return Result.fail<WhatsappPhone>('Número de WhatsApp inválido.');
    }

    const normalized = phone.trim().replace(/[\s()-]/g, '');

    if (!WhatsappPhone.E164_BR_REGEX.test(normalized)) {
      return Result.fail<WhatsappPhone>(
        'Número de WhatsApp inválido. Use o formato +55DDDNNNNNNNNN (ex: +5511987654321).',
      );
    }

    return Result.ok<WhatsappPhone>(new WhatsappPhone(normalized));
  }
}
