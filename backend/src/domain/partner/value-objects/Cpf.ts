// backend/src/domain/partner/value-objects/Cpf.ts
import { Result } from '../../Result';

/**
 * Cpf — Value Object para validação algorítmica e formatação de CPF (Módulo 11 da Receita Federal).
 * Suporta instâncias opcionais (undefined se vazio) para parceiros cadastrados como Pessoa Jurídica (PJ).
 */
export class Cpf {
  private constructor(public readonly value: string) {}

  public static create(cpf?: string | null): Result<Cpf | undefined> {
    if (!cpf || cpf.trim().length === 0) {
      return Result.ok<Cpf | undefined>(undefined);
    }

    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) {
      return Result.fail<Cpf>('CPF inválido (deve conter 11 dígitos numéricos).');
    }

    // Rejeita sequências de dígitos idênticos conhecidas (00000000000, 11111111111, etc.)
    if (/^(\d)\1{10}$/.test(clean)) {
      return Result.fail<Cpf>('CPF inválido (números repetidos).');
    }

    // Cálculo do 1º dígito verificador
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += parseInt(clean[i], 10) * (10 - i);
    }
    const rem1 = sum1 % 11;
    const digit1 = rem1 < 2 ? 0 : 11 - rem1;

    if (parseInt(clean[9], 10) !== digit1) {
      return Result.fail<Cpf>('CPF inválido (primeiro dígito verificador incorreto).');
    }

    // Cálculo do 2º dígito verificador
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(clean[i], 10) * (11 - i);
    }
    const rem2 = sum2 % 11;
    const digit2 = rem2 < 2 ? 0 : 11 - rem2;

    if (parseInt(clean[10], 10) !== digit2) {
      return Result.fail<Cpf>('CPF inválido (segundo dígito verificador incorreto).');
    }

    return Result.ok<Cpf>(new Cpf(clean));
  }

  public get digits(): string {
    return this.value;
  }

  public get formatted(): string {
    return this.value.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      '$1.$2.$3-$4'
    );
  }
}
