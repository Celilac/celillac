// backend/src/application/consumer/GetConsumerProfileUseCase.ts
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { Consumer } from '../../domain/consumer/Consumer';
import { FoodProfile } from '../../domain/food-profile/FoodProfile';
import { Result } from '../../domain/Result';

export interface GetConsumerProfileOutput {
  consumer: Consumer;
  foodProfile: FoodProfile | null;
  hasIncompleteProfileWarning: boolean;
}

export class GetConsumerProfileUseCase {
  constructor(
    private readonly consumerRepository: IConsumerRepository,
    private readonly foodProfileRepository: IFoodProfileRepository,
  ) {}

  async execute(userId: string): Promise<Result<GetConsumerProfileOutput>> {
    let consumer = await this.consumerRepository.findByUserId(userId);
    if (!consumer) {
      // Auto-cria consumidor se não existir
      const createRes = Consumer.create({ userId });
      if (createRes.isFailure) {
        return Result.fail<GetConsumerProfileOutput>(createRes.getError());
      }
      consumer = createRes.getValue();
      await this.consumerRepository.save(consumer);
    }

    const foodProfile = await this.foodProfileRepository.findByUserId(userId);

    const isComplete = foodProfile ? foodProfile.isComplete() : false;
    const isCritical = foodProfile ? foodProfile.isCritical() : false;

    consumer.markFoodProfileState(isComplete, isCritical);
    await this.consumerRepository.save(consumer);

    return Result.ok<GetConsumerProfileOutput>({
      consumer,
      foodProfile,
      hasIncompleteProfileWarning: !isComplete,
    });
  }
}
