// backend/src/infrastructure/database/food-profile/PgFoodProfileRepository.ts
import { Pool } from 'pg';

import { IFoodProfileRepository } from '../../../domain/food-profile/repositories/IFoodProfileRepository';
import { FoodProfile } from '../../../domain/food-profile/FoodProfile';
import { Restriction } from '../../../domain/food-profile/Restriction';
import { AllergenType } from '../../../domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../domain/food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../../../domain/food-profile/value-objects/RestrictionType';

interface RestrictionRow {
  id: string;
  allergen: string;
  severity: string;
  type?: string;
  notes?: string;
}

export class PgFoodProfileRepository implements IFoodProfileRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserId(userId: string): Promise<FoodProfile | null> {
    const result = await this.pool.query(
      'SELECT id, user_id, restrictions, accepts_cross_contamination FROM food_profiles WHERE user_id = $1 LIMIT 1',
      [userId],
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToProfile(result.rows[0]);
  }

  async save(profile: FoodProfile): Promise<void> {
    const restrictionsJson = JSON.stringify(
      profile.restrictions.map((r) => ({
        id: r.id,
        allergen: r.allergen,
        severity: r.severity,
        type: r.type,
        notes: r.notes,
      })),
    );

    const existing = await this.findByUserId(profile.userId);
    if (existing) {
      await this.pool.query(
        `UPDATE food_profiles 
         SET restrictions = $1::jsonb, accepts_cross_contamination = $2, updated_at = NOW()
         WHERE user_id = $3`,
        [restrictionsJson, profile.acceptsCrossContamination, profile.userId],
      );
    } else {
      await this.pool.query(
        `INSERT INTO food_profiles (id, user_id, restrictions, accepts_cross_contamination)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [profile.id, profile.userId, restrictionsJson, profile.acceptsCrossContamination],
      );
    }
  }

  async update(profile: FoodProfile): Promise<void> {
    await this.save(profile);
  }

  private mapRowToProfile(row: {
    id: string;
    user_id: string;
    restrictions: RestrictionRow[];
    accepts_cross_contamination?: boolean;
  }): FoodProfile {
    const restrictions: Restriction[] = [];

    for (const r of row.restrictions ?? []) {
      let createRes = Restriction.create(
        {
          allergen: r.allergen as AllergenType,
          severity: r.severity as SeverityLevel,
          type: r.type ? (r.type as RestrictionType) : RestrictionType.ALLERGY,
          notes: r.notes,
        },
        r.id,
      );

      // Grace Period / Reconstituição segura de dados legados do banco
      if (createRes.isFailure) {
        createRes = Restriction.create(
          {
            allergen: r.allergen as AllergenType,
            severity: r.severity as SeverityLevel,
            type: RestrictionType.INTOLERANCE,
            notes: r.notes,
          },
          r.id,
        );
      }

      if (createRes.isSuccess) {
        restrictions.push(createRes.getValue());
      }
    }

    return FoodProfile.create(
      {
        userId: row.user_id,
        restrictions,
        acceptsCrossContamination: row.accepts_cross_contamination ?? false,
      },
      row.id,
    ).getValue();
  }
}
