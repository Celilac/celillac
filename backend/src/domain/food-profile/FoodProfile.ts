// backend/src/domain/food-profile/FoodProfile.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { Restriction } from './Restriction';
import { AllergenType } from './value-objects/AllergenType';

export interface FoodProfileProps {
  userId: string;
  restrictions: Restriction[];
  acceptsCrossContamination?: boolean;
}

/**
 * FoodProfile — Agregado Raiz do Contexto Alimentar.
 *
 * Regras Críticas (DOMAIN_MODEL.md e Análise do Consumidor):
 *  1. Um perfil deve ter pelo menos uma restrição para ser considerado "Ativo" / "Completo".
 *  2. Mudanças em restrições FATAL ou de Alta Severidade sinalizam perfil crítico e exigem atenção.
 *  3. Não são permitidos alérgenos duplicados no mesmo perfil.
 *  4. Controla a tolerância a risco de contaminação cruzada (padrão: false para segurança).
 */
export class FoodProfile extends Entity<FoodProfileProps> {
  private _requiresHistoryRevalidation: boolean = false;

  private constructor(props: FoodProfileProps, id?: string) {
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
    return [...this.props.restrictions]; // retorna cópia para garantir imutabilidade
  }

  get acceptsCrossContamination(): boolean {
    return !!this.props.acceptsCrossContamination;
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
    return this.props.restrictions.length > 0;
  }

  isComplete(): boolean {
    return this.props.restrictions.length > 0;
  }

  /**
   * isCritical — Retorna true se houver qualquer restrição com severidade FATAL/alta ou Doença Celíaca.
   */
  isCritical(): boolean {
    return this.props.restrictions.some((r) => r.isFatal());
  }

  public setCrossContaminationTolerance(accepts: boolean): void {
    this.props.acceptsCrossContamination = accepts;
  }

  /**
   * addRestriction — Adiciona uma restrição com validação de duplicidade.
   */
  addRestriction(restriction: Restriction): Result<void> {
    const duplicate = this.props.restrictions.find(
      (r) => r.allergen === restriction.allergen,
    );
    if (duplicate) {
      return Result.fail<void>(`Alérgeno ${restriction.allergen} já existe neste perfil.`);
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

    // Validar duplicidade nas restrições iniciais
    const allergensSeen = new Set<AllergenType>();
    for (const restriction of props.restrictions) {
      if (allergensSeen.has(restriction.allergen)) {
        return Result.fail<FoodProfile>(
          `Alérgeno ${restriction.allergen} duplicado nas restrições iniciais.`,
        );
      }
      allergensSeen.add(restriction.allergen);
    }

    return Result.ok<FoodProfile>(
      new FoodProfile(
        {
          ...props,
          restrictions: [...props.restrictions],
          acceptsCrossContamination: props.acceptsCrossContamination ?? false,
        },
        id,
      ),
    );
  }
}
