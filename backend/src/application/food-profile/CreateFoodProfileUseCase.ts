// backend/src/application/food-profile/CreateFoodProfileUseCase.ts
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { FoodProfile } from '../../domain/food-profile/FoodProfile';
import { Restriction } from '../../domain/food-profile/Restriction';
import { AllergenType } from '../../domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../domain/food-profile/value-objects/SeverityLevel';
import { Result } from '../../domain/Result';

export interface RestrictionDTO {
  allergen: string;
  severity: string;
}

export interface CreateFoodProfileDTO {
  userId:       string;
  restrictions: RestrictionDTO[];
}

export interface FoodProfileResponseDTO {
  id:                          string;
  userId:                      string;
  isActive:                    boolean;
  requiresHistoryRevalidation: boolean;
  restrictions: Array<{
    id:       string;
    allergen: string;
    severity: string;
  }>;
}

/**
 * CreateFoodProfileUseCase — Orquestra a criação do perfil alimentar.
 *
 * Fluxo:
 *  1. Valida que o usuário não tem perfil existente
 *  2. Constrói as Restriction entities
 *  3. Constrói o FoodProfile aggregate
 *  4. Persiste via IFoodProfileRepository
 *  5. Sinaliza se há necessidade de revalidação histórica
 */
export class CreateFoodProfileUseCase {
  constructor(private readonly profileRepository: IFoodProfileRepository) {}

  async execute(dto: CreateFoodProfileDTO): Promise<Result<FoodProfileResponseDTO>> {
    // 1. Verificar perfil existente
    const existing = await this.profileRepository.findByUserId(dto.userId);
    if (existing) {
      return Result.fail<FoodProfileResponseDTO>(
        'Este usuário já possui um perfil alimentar. Use a atualização.',
      );
    }

    // 2. Construir Restriction entities
    const restrictions: Restriction[] = [];
    for (const r of dto.restrictions) {
      const restrictionResult = Restriction.create({
        allergen: r.allergen as AllergenType,
        severity: r.severity as SeverityLevel,
      });
      if (restrictionResult.isFailure) {
        return Result.fail<FoodProfileResponseDTO>(restrictionResult.getError());
      }
      restrictions.push(restrictionResult.getValue());
    }

    // 3. Construir FoodProfile aggregate
    const profileResult = FoodProfile.create({ userId: dto.userId, restrictions });
    if (profileResult.isFailure) {
      return Result.fail<FoodProfileResponseDTO>(profileResult.getError());
    }
    const profile = profileResult.getValue();

    // 4. Persistir
    await this.profileRepository.save(profile);

    return Result.ok<FoodProfileResponseDTO>(this.toDTO(profile));
  }

  private toDTO(profile: FoodProfile): FoodProfileResponseDTO {
    return {
      id:                          profile.id,
      userId:                      profile.userId,
      isActive:                    profile.isActive(),
      requiresHistoryRevalidation: profile.requiresHistoryRevalidation,
      restrictions:                profile.restrictions.map((r) => ({
        id:       r.id,
        allergen: r.allergen,
        severity: r.severity,
      })),
    };
  }
}
