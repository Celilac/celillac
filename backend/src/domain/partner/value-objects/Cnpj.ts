// backend/src/domain/partner/value-objects/Cnpj.ts
import { Result } from '../../Result';

/**
 * Cnpj — Value Object para validação algorítmica e formatação de CNPJ (Módulo 11 da Receita Federal).
 * Suporta instâncias opcionais (undefined se vazio) para produtores pessoas físicas / artesanais.
 */
export class Cnpj {
  private constructor(public readonly value: string) {}

  public static create(cnpj?: string | null): Result<Cnpj | undefined> {
    if (!cnpj || cnpj.trim().length === 0) {
      return Result.ok<Cnpj | undefined>(undefined);
    }

    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) {
      return Result.fail<Cnpj>('CNPJ inválido (deve conter 14 dígitos numéricos).');
    }

    // Rejeita sequências de dígitos idênticos conhecidas (00000000000000, 11111111111111, etc.)
    if (/^(\d)\1{13}$/.test(clean)) {
      return Result.fail<Cnpj>('CNPJ inválido (números repetidos).');
    }

    // Cálculo do 1º dígito verificador
    // Pesos: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum1 = 0;
    for (let i = 0; i < 12; i++) {
      sum1 += parseInt(clean[i], 10) * weights1[i];
    }
    const rem1 = sum1 % 11;
    const digit1 = rem1 < 2 ? 0 : 11 - rem1;

    if (parseInt(clean[12], 10) !== digit1) {
      return Result.fail<Cnpj>('CNPJ inválido (primeiro dígito verificador incorreto).');
    }

    // Cálculo do 2º dígito verificador
    // Pesos: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum2 = 0;
    for (let i = 0; i < 13; i++) {
      sum2 += parseInt(clean[i], 10) * weights2[i];
    }
    const rem2 = sum2 % 11;
    const digit2 = rem2 < 2 ? 0 : 11 - rem2;

    if (parseInt(clean[13], 10) !== digit2) {
      return Result.fail<Cnpj>('CNPJ inválido (segundo dígito verificador incorreto).');
    }

    return Result.ok<Cnpj>(new Cnpj(clean));
  }

  public get digits(): string {
    return this.value;
  }

  public get formatted(): string {
    return this.value.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }
}
