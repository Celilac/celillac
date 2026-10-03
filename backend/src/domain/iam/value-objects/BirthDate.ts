// backend/src/domain/iam/value-objects/BirthDate.ts
import { Result } from '../../Result';

/**
 * BirthDate — Value Object do IAM.
 * Regras de Negócio & LGPD:
 *  - Campo opcional (retorna undefined se vazio).
 *  - Não permite data futura nem a data de hoje.
 *  - Idade mínima de 13 anos completos (exigência LGPD para consentimento digital autônomo).
 *  - Limite histórico razoável (máximo de 120 anos / ano >= 1900).
 */
export class BirthDate {
  public static readonly MINIMUM_AGE_YEARS = 13;
  public static readonly MAXIMUM_AGE_YEARS = 120;
  public static readonly MINIMUM_YEAR = 1900;

  private constructor(public readonly value: Date) {}

  public static create(dateInput?: Date | string | null, referenceDate: Date = new Date()): Result<BirthDate | undefined> {
    if (dateInput === undefined || dateInput === null || dateInput === '') {
      return Result.ok<BirthDate | undefined>(undefined);
    }

    let parsedDate: Date;

    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (!trimmed) {
        return Result.ok<BirthDate | undefined>(undefined);
      }

      // Tratamento especial para formato YYYY-MM-DD para evitar problemas de fuso horário
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [yearStr, monthStr, dayStr] = trimmed.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const day = parseInt(dayStr, 10);

        parsedDate = new Date(year, month, day);
        if (
          parsedDate.getFullYear() !== year ||
          parsedDate.getMonth() !== month ||
          parsedDate.getDate() !== day
        ) {
          return Result.fail<BirthDate>('Data de nascimento inválida.');
        }
      } else {
        parsedDate = new Date(trimmed);
      }
    } else if (dateInput instanceof Date) {
      parsedDate = new Date(dateInput.getTime());
    } else {
      return Result.fail<BirthDate>('Data de nascimento inválida.');
    }

    if (isNaN(parsedDate.getTime())) {
      return Result.fail<BirthDate>('Data de nascimento inválida.');
    }

    // Normaliza horas para comparação precisa de calendário
    const target = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

    if (target.getTime() === today.getTime()) {
      return Result.fail<BirthDate>('A data de nascimento não pode ser o dia de hoje.');
    }

    if (target.getTime() > today.getTime()) {
      return Result.fail<BirthDate>('A data de nascimento não pode ser no futuro.');
    }

    // Cálculo exato da idade em anos completos
    let age = today.getFullYear() - target.getFullYear();
    const monthDiff = today.getMonth() - target.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < target.getDate())) {
      age--;
    }

    if (age < BirthDate.MINIMUM_AGE_YEARS) {
      return Result.fail<BirthDate>(
        `O usuário deve ter pelo menos ${BirthDate.MINIMUM_AGE_YEARS} anos de idade (LGPD).`
      );
    }

    if (age > BirthDate.MAXIMUM_AGE_YEARS || target.getFullYear() < BirthDate.MINIMUM_YEAR) {
      return Result.fail<BirthDate>('Data de nascimento fora do limite permitido.');
    }

    return Result.ok<BirthDate>(new BirthDate(target));
  }
}
