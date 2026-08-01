// backend/src/application/food-profile/UpdateFoodProfileUseCase.ts
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { FoodProfile } from '../../domain/food-profile/FoodProfile';
import { Restriction } from '../../domain/food-profile/Restriction';
import { AllergenType } from '../../domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../domain/food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../../domain/food-profile/value-objects/RestrictionType';
import { Result } from '../../domain/Result';
import { FoodProfileResponseDTO, RestrictionDTO } from './CreateFoodProfileUseCase';

export interface UpdateFoodProfileDTO {
  userId:                     string;
  restrictions:               RestrictionDTO[];
  acceptsCrossContamination?: boolean;
}

/**
 * UpdateFoodProfileUseCase — Orquestra a atualização do perfil alimentar.
 *
 * Fluxo:
 *  1. Valida que o usuário tem um perfil existente
 *  2. Constrói as novas Restriction entities
 *  3. Substitui as restrições no perfil (limpa e readiciona para passar pelas regras de negócio)
 *  4. Persiste via IFoodProfileRepository.update
 */
export class UpdateFoodProfileUseCase {
  constructor(private readonly profileRepository: IFoodProfileRepository) {}

  async execute(dto: UpdateFoodProfileDTO): Promise<Result<FoodProfileResponseDTO>> {
    // 1. Verificar perfil existente
    const profile = await this.profileRepository.findByUserId(dto.userId);
    if (!profile) {
      return Result.fail<FoodProfileResponseDTO>('Perfil alimentar não encontrado.');
    }

    // Limpa as restrições antigas e sinalizador de revalidação
    profile.clearRestrictions();
    if (dto.acceptsCrossContamination !== undefined) {
      profile.setAcceptsCrossContamination(dto.acceptsCrossContamination);
    }

    // 2. Construir e adicionar novas Restriction entities
    for (const r of dto.restrictions) {
      const restrictionResult = Restriction.create({
        allergen: r.allergen as AllergenType,
        severity: r.severity as SeverityLevel,
        type:     r.type as RestrictionType | undefined,
        notes:    r.notes,
      });
      if (restrictionResult.isFailure) {
        return Result.fail<FoodProfileResponseDTO>(restrictionResult.getError());
      }

      const addResult = profile.addRestriction(restrictionResult.getValue());
      if (addResult.isFailure) {
        return Result.fail<FoodProfileResponseDTO>(addResult.getError());
      }
    }

    // 4. Persistir a atualização
    await this.profileRepository.update(profile);

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
        type:     r.type,
        notes:    r.notes,
      })),
    };
  }
}
