// backend/src/infrastructure/database/food-profile/PgFoodProfileRepository.ts
import { Pool } from 'pg';

import { IFoodProfileRepository } from '../../../domain/food-profile/repositories/IFoodProfileRepository';
import { FoodProfile } from '../../../domain/food-profile/FoodProfile';
import { Restriction } from '../../../domain/food-profile/Restriction';
import { AllergenType } from '../../../domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../domain/food-profile/value-objects/SeverityLevel';

/**
 * Shape do JSONB armazenado na coluna `restrictions` da tabela `food_profiles`.
 */
interface RestrictionRow {
  id:       string;
  allergen: string;
  severity: string;
}

/**
 * PgFoodProfileRepository — Implementação concreta de IFoodProfileRepository.
 * Mapeia JSONB ↔ entidades do domínio.
 * O domínio NUNCA importa esta classe diretamente.
 */
export class PgFoodProfileRepository implements IFoodProfileRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserId(userId: string): Promise<FoodProfile | null> {
    const result = await this.pool.query(
      'SELECT id, user_id, restrictions FROM food_profiles WHERE user_id = $1 LIMIT 1',
      [userId],
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToProfile(result.rows[0]);
  }

  async save(profile: FoodProfile): Promise<void> {
    const restrictionsJson = JSON.stringify(
      profile.restrictions.map((r) => ({
        id:       r.id,
        allergen: r.allergen,
        severity: r.severity,
      })),
    );

    await this.pool.query(
      `INSERT INTO food_profiles (id, user_id, restrictions)
       VALUES ($1, $2, $3::jsonb)`,
      [profile.id, profile.userId, restrictionsJson],
    );
  }

  async update(profile: FoodProfile): Promise<void> {
    const restrictionsJson = JSON.stringify(
      profile.restrictions.map((r) => ({
        id:       r.id,
        allergen: r.allergen,
        severity: r.severity,
      })),
    );

    await this.pool.query(
      `UPDATE food_profiles SET restrictions = $1::jsonb WHERE user_id = $2`,
      [restrictionsJson, profile.userId],
    );
  }

  // --- Mapper privado: linha do banco → agregado de domínio ---
  private mapRowToProfile(row: { id: string; user_id: string; restrictions: RestrictionRow[] }): FoodProfile {
    const restrictions = (row.restrictions ?? []).map((r) =>
      Restriction.create(
        {
          allergen: r.allergen as AllergenType,
          severity: r.severity as SeverityLevel,
        },
        r.id,
      ).getValue(),
    );

    return FoodProfile.create({ userId: row.user_id, restrictions }, row.id).getValue();
  }
}
