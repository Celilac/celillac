// backend/src/domain/food-profile/Restriction.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { AllergenType } from './value-objects/AllergenType';
import { SeverityLevel } from './value-objects/SeverityLevel';
import { RestrictionType } from './value-objects/RestrictionType';

export interface RestrictionProps {
  allergen: AllergenType;
  severity: SeverityLevel;
  type?: RestrictionType;
  notes?: string;
}

/**
 * Restriction — Entidade que representa uma restrição alimentar.
 * Parte do agregado FoodProfile.
 * Regra: uma restrição FATAL representa risco de vida (Celíaco).
 */
export class Restriction extends Entity<RestrictionProps> {
  private constructor(props: RestrictionProps, id?: string) {
    super(
      {
        ...props,
        type: props.type || RestrictionType.ALLERGY,
      },
      id,
    );
  }

  get allergen(): AllergenType {
    return this.props.allergen;
  }

  get severity(): SeverityLevel {
    return this.props.severity;
  }

  get type(): RestrictionType {
    return this.props.type || RestrictionType.ALLERGY;
  }

  get notes(): string | undefined {
    return this.props.notes;
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
    if (props.type && !Object.values(RestrictionType).includes(props.type)) {
      return Result.fail<Restriction>(`Tipo de restrição inválido: ${props.type}.`);
    }
    return Result.ok<Restriction>(new Restriction(props, id));
  }
}
