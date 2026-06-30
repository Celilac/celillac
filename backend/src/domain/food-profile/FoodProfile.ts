// backend/src/domain/food-profile/FoodProfile.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { Restriction } from './Restriction';
import { AllergenType } from './value-objects/AllergenType';

export interface FoodProfileProps {
  userId:       string;
  restrictions: Restriction[];
}

/**
 * FoodProfile — Agregado Raiz do Contexto Alimentar.
 *
 * Regras Críticas (DOMAIN_MODEL.md):
 *  1. Um perfil deve ter pelo menos uma restrição para ser considerado "Ativo".
 *  2. Mudanças em restrições FATAL exigem revalidação do histórico de consumo.
 *  3. Não são permitidos alérgenos duplicados no mesmo perfil.
 */
export class FoodProfile extends Entity<FoodProfileProps> {
  private _requiresHistoryRevalidation: boolean = false;

  private constructor(props: FoodProfileProps, id?: string) {
    super(props, id);
  }

  get userId(): string {
    return this.props.userId;
  }

  get restrictions(): Restriction[] {
    return [...this.props.restrictions]; // retorna cópia para garantir imutabilidade
  }

  /**
   * requiresHistoryRevalidation — sinalizado quando uma restrição FATAL é adicionada.
   * A camada de Application deve tratar este sinal adequadamente.
   */
  get requiresHistoryRevalidation(): boolean {
    return this._requiresHistoryRevalidation;
  }

  /**
   * isActive — Regra do DOMAIN_MODEL.md:
   * "Um perfil deve ter pelo menos uma restrição para ser considerado 'Ativo'."
   */
  isActive(): boolean {
    return this.props.restrictions.length > 0;
  }

  /**
   * addRestriction — Adiciona uma restrição com validação de duplicidade.
   * Retorna Result para indicar sucesso ou erro de domínio.
   */
  addRestriction(restriction: Restriction): Result<void> {
    const duplicate = this.props.restrictions.find(
      (r) => r.allergen === restriction.allergen,
    );
    if (duplicate) {
      return Result.fail<void>(`Alérgeno ${restriction.allergen} já existe neste perfil.`);
    }

    this.props.restrictions.push(restriction);

    // Regra crítica: mudanças FATAL sinalizam necessidade de revalidação
    if (restriction.isFatal()) {
      this._requiresHistoryRevalidation = true;
    }

    return Result.ok<void>(undefined as any);
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
      new FoodProfile({ ...props, restrictions: [...props.restrictions] }, id),
    );
  }
}
