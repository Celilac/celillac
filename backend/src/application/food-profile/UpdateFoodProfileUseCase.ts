// backend/src/application/food-profile/UpdateFoodProfileUseCase.ts
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { FoodProfile } from '../../domain/food-profile/FoodProfile';
import { Restriction } from '../../domain/food-profile/Restriction';
import { AllergenType } from '../../domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../domain/food-profile/value-objects/SeverityLevel';
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
 *  3. Substitui as restrições no perfil
 *  4. Persiste via IFoodProfileRepository.update
 *  5. Sincroniza o estado no agregado Consumer (se IConsumerRepository estiver injetado)
 */
export class UpdateFoodProfileUseCase {
  constructor(
    private readonly profileRepository: IFoodProfileRepository,
    private readonly consumerRepository?: IConsumerRepository,
  ) {}

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
        type:     r.type as any,
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

    // 3. Persistir a atualização do perfil alimentar
    await this.profileRepository.update(profile);

    // 4. Sincronizar estado no agregado Consumer
    if (this.consumerRepository) {
      const consumer = await this.consumerRepository.findByUserId(dto.userId);
      if (consumer) {
        consumer.markFoodProfileState(profile.isComplete(), profile.isCritical());
        await this.consumerRepository.save(consumer);
      }
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
        type:     r.type,
        notes:    r.notes,
      })),
    };
  }
}
