// backend/src/application/food-profile/RemoveRestrictionUseCase.ts
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { FoodProfile } from '../../domain/food-profile/FoodProfile';
import { AllergenType } from '../../domain/food-profile/value-objects/AllergenType';
import { Result } from '../../domain/Result';

export interface RemoveRestrictionInput {
  userId: string;
  allergen: AllergenType;
}

export class RemoveRestrictionUseCase {
  constructor(
    private readonly foodProfileRepository: IFoodProfileRepository,
    private readonly consumerRepository?: IConsumerRepository,
  ) {}

  async execute(input: RemoveRestrictionInput): Promise<Result<FoodProfile>> {
    const profile = await this.foodProfileRepository.findByUserId(input.userId);
    if (!profile) {
      return Result.fail<FoodProfile>('Perfil alimentar não encontrado.');
    }

    const removeRes = profile.removeRestriction(input.allergen);
    if (removeRes.isFailure) {
      return Result.fail<FoodProfile>(removeRes.getError());
    }

    await this.foodProfileRepository.save(profile);

    if (this.consumerRepository) {
      const consumer = await this.consumerRepository.findByUserId(input.userId);
      if (consumer) {
        consumer.markFoodProfileState(profile.isComplete(), profile.isCritical());
        await this.consumerRepository.save(consumer);
      }
    }

    return Result.ok<FoodProfile>(profile);
  }
}
