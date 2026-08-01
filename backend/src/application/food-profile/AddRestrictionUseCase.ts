// backend/src/application/food-profile/AddRestrictionUseCase.ts
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { FoodProfile } from '../../domain/food-profile/FoodProfile';
import { Restriction } from '../../domain/food-profile/Restriction';
import { AllergenType } from '../../domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../domain/food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../../domain/food-profile/value-objects/RestrictionType';
import { Result } from '../../domain/Result';

export interface AddRestrictionInput {
  userId: string;
  allergen: AllergenType;
  severity: SeverityLevel;
  type?: RestrictionType;
  notes?: string;
}

export class AddRestrictionUseCase {
  constructor(
    private readonly foodProfileRepository: IFoodProfileRepository,
    private readonly consumerRepository?: IConsumerRepository,
  ) {}

  async execute(input: AddRestrictionInput): Promise<Result<FoodProfile>> {
    let profile = await this.foodProfileRepository.findByUserId(input.userId);
    if (!profile) {
      const createRes = FoodProfile.create({ userId: input.userId, restrictions: [] });
      if (createRes.isFailure) {
        return Result.fail<FoodProfile>(createRes.getError());
      }
      profile = createRes.getValue();
    }

    const restrictionRes = Restriction.create({
      allergen: input.allergen,
      severity: input.severity,
      type: input.type,
      notes: input.notes,
    });

    if (restrictionRes.isFailure) {
      return Result.fail<FoodProfile>(restrictionRes.getError());
    }

    const addRes = profile.addRestriction(restrictionRes.getValue());
    if (addRes.isFailure) {
      return Result.fail<FoodProfile>(addRes.getError());
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
