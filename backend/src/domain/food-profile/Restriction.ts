// backend/src/domain/food-profile/Restriction.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { AllergenType } from './value-objects/AllergenType';
import { SeverityLevel } from './value-objects/SeverityLevel';

export interface RestrictionProps {
  allergen: AllergenType;
  severity: SeverityLevel;
}

/**
 * Restriction — Entidade que representa uma restrição alimentar.
 * Parte do agregado FoodProfile.
 * Regra: uma restrição FATAL representa risco de vida (Celíaco).
 */
export class Restriction extends Entity<RestrictionProps> {
  private constructor(props: RestrictionProps, id?: string) {
    super(props, id);
  }

  get allergen(): AllergenType {
    return this.props.allergen;
  }

  get severity(): SeverityLevel {
    return this.props.severity;
  }

  /**
   * Retorna true se a severidade é FATAL.
   * Utilizado pelo FoodProfile para sinalizar necessidade de revalidação.
   */
  isFatal(): boolean {
    return this.props.severity === SeverityLevel.FATAL;
  }

  static create(props: RestrictionProps, id?: string): Result<Restriction> {
    if (!Object.values(AllergenType).includes(props.allergen)) {
      return Result.fail<Restriction>(`Tipo de alérgeno inválido: ${props.allergen}.`);
    }
    if (!Object.values(SeverityLevel).includes(props.severity)) {
      return Result.fail<Restriction>(`Nível de severidade inválido: ${props.severity}.`);
    }
    return Result.ok<Restriction>(new Restriction(props, id));
  }
}
