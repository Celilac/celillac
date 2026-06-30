// backend/src/domain/food-profile/repositories/IFoodProfileRepository.ts
import { FoodProfile } from '../FoodProfile';

/**
 * IFoodProfileRepository — Interface pura do domínio.
 * A infraestrutura (PostgreSQL/JSONB) implementa este contrato.
 * O domínio NUNCA importa pg ou SQL — Dependency Rule.
 */
export interface IFoodProfileRepository {
  /** Busca o perfil alimentar de um usuário pelo seu ID. */
  findByUserId(userId: string): Promise<FoodProfile | null>;

  /** Persiste um novo perfil. */
  save(profile: FoodProfile): Promise<void>;

  /** Atualiza um perfil existente (substituição completa das restrições). */
  update(profile: FoodProfile): Promise<void>;
}
