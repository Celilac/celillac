// backend/src/application/food-profile/GetFoodProfileUseCase.ts
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { Result } from '../../domain/Result';
import { FoodProfileResponseDTO } from './CreateFoodProfileUseCase';
import { FoodProfile } from '../../domain/food-profile/FoodProfile';

export interface GetFoodProfileDTO {
  userId: string;
}

/**
 * GetFoodProfileUseCase — Orquestra a leitura do perfil alimentar.
 */
export class GetFoodProfileUseCase {
  constructor(private readonly profileRepository: IFoodProfileRepository) {}

  async execute(dto: GetFoodProfileDTO): Promise<Result<FoodProfileResponseDTO>> {
    const profile = await this.profileRepository.findByUserId(dto.userId);

    if (!profile) {
      return Result.fail<FoodProfileResponseDTO>(
        'Perfil alimentar não encontrado para este usuário.',
      );
    }

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
