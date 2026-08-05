// backend/src/domain/food-profile/FoodProfile.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { Restriction } from './Restriction';
import { AllergenType } from './value-objects/AllergenType';

export interface FoodProfileProps {
  userId: string;
  restrictions?: Restriction[];
  acceptsCrossContamination?: boolean;
}

/**
 * FoodProfile — Agregado Raiz do Contexto Alimentar.
 *
 * Regras Críticas (DOMAIN_MODEL.md e Análise do Consumidor):
 *  1. Um perfil deve ter pelo menos uma restrição para ser considerado "Ativo" / "Completo".
 *  2. Mudanças em restrições FATAL sinalizam perfil crítico e exigem atenção (revalidação).
 *  3. Não são permitidos alérgenos duplicados no mesmo perfil.
 *  4. Controla a tolerância a risco de contaminação cruzada (padrão: false para segurança).
 */
export class FoodProfile extends Entity<FoodProfileProps> {
  private _requiresHistoryRevalidation: boolean = false;

  private constructor(props: Required<FoodProfileProps>, id?: string) {
    super(
      {
        ...props,
        acceptsCrossContamination: props.acceptsCrossContamination ?? false,
      },
      id,
    );
  }

  get userId(): string {
    return this.props.userId;
  }

  get restrictions(): Restriction[] {
    return [...(this.props.restrictions ?? [])]; // retorna cópia para garantir imutabilidade
  }

  get acceptsCrossContamination(): boolean {
    return !!this.props.acceptsCrossContamination;
  }

  public setAcceptsCrossContamination(accepts: boolean): void {
    this.props.acceptsCrossContamination = accepts;
  }

  /**
   * requiresHistoryRevalidation — sinalizado quando uma restrição FATAL é adicionada.
   */
  get requiresHistoryRevalidation(): boolean {
    return this._requiresHistoryRevalidation;
  }

  /**
   * isActive / isComplete — Perfil considerado configurado se possuir ao menos 1 restrição.
   */
  isActive(): boolean {
    return (this.props.restrictions ?? []).length > 0;
  }

  isComplete(): boolean {
    return (this.props.restrictions ?? []).length > 0;
  }

  /**
   * isCritical — Retorna true se houver qualquer restrição com severidade FATAL
   * (independente do alérgeno ou do tipo de condição — ex.: doença celíaca,
   * alergia grave/anafilática).
   */
  isCritical(): boolean {
    return (this.props.restrictions ?? []).some((r) => r.isFatal());
  }

  public setCrossContaminationTolerance(accepts: boolean): void {
    this.props.acceptsCrossContamination = accepts;
  }

  /**
   * addRestriction — Adiciona uma restrição com validação de duplicidade.
   * A duplicidade é verificada por (allergen + type): um mesmo alérgeno pode
   * ter mais de uma restrição registrada desde que sejam de tipos diferentes
   * (ex.: OTHER/LIFESTYLE para dieta vegetariana e OTHER/ALLERGY para um
   * alérgeno não listado, simultaneamente).
   */
  addRestriction(restriction: Restriction): Result<void> {
    if (!this.props.restrictions) {
      this.props.restrictions = [];
    }

    const duplicate = this.props.restrictions.find((r) => {
      if (r.allergen !== restriction.allergen) return false;
      if (restriction.allergen === AllergenType.OTHER) {
        return r.type === restriction.type;
      }
      return true;
    });
    if (duplicate) {
      return Result.fail<void>(
        `Já existe uma restrição do tipo ${restriction.type} para o alérgeno ${restriction.allergen} neste perfil.`,
      );
    }

    this.props.restrictions.push(restriction);

    if (restriction.isFatal()) {
      this._requiresHistoryRevalidation = true;
    }

    return Result.ok<void>(undefined as any);
  }

  /**
   * removeRestriction — Remove uma restrição pelo tipo de alérgeno.
   */
  removeRestriction(allergen: AllergenType): Result<void> {
    if (!this.props.restrictions) {
      this.props.restrictions = [];
      return Result.fail<void>(`Restrição ${allergen} não encontrada no perfil.`);
    }

    const index = this.props.restrictions.findIndex((r) => r.allergen === allergen);
    if (index === -1) {
      return Result.fail<void>(`Restrição ${allergen} não encontrada no perfil.`);
    }

    this.props.restrictions.splice(index, 1);
    return Result.ok<void>(undefined as any);
  }

  /**
   * clearRestrictions — Remove todas as restrições e zera o sinalizador de revalidação.
   */
  clearRestrictions(): void {
    this.props.restrictions = [];
    this._requiresHistoryRevalidation = false;
  }

  static create(props: FoodProfileProps, id?: string): Result<FoodProfile> {
    if (!props.userId || props.userId.trim().length === 0) {
      return Result.fail<FoodProfile>('O userId do perfil não pode ser vazio.');
    }

    const initialRestrictions = props.restrictions ?? [];

    // Validar duplicidade nas restrições iniciais (RN-CONSUMER-03)
    const seen = new Set<string>();
    for (const restriction of initialRestrictions) {
      const key = restriction.allergen === AllergenType.OTHER
        ? `OTHER:${restriction.type}`
        : restriction.allergen;
      if (seen.has(key)) {
        return Result.fail<FoodProfile>(
          `Restrição do tipo ${restriction.type} para o alérgeno ${restriction.allergen} duplicada nas restrições iniciais.`,
        );
      }
      seen.add(key);
    }

    return Result.ok<FoodProfile>(
      new FoodProfile(
        {
          userId: props.userId,
          restrictions: [...initialRestrictions],
          acceptsCrossContamination: props.acceptsCrossContamination ?? false,
        },
        id,
      ),
    );
  }
}
