// backend/src/application/consumer/GetConsumerProfileUseCase.ts
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { Consumer } from '../../domain/consumer/Consumer';
import { FoodProfile } from '../../domain/food-profile/FoodProfile';
import { Result } from '../../domain/Result';
import { CreateConsumerUseCase } from './CreateConsumerUseCase';

export interface GetConsumerProfileOutput {
  consumer: Consumer;
  foodProfile: FoodProfile | null;
  hasIncompleteProfileWarning: boolean;
}

export class GetConsumerProfileUseCase {
  constructor(
    private readonly consumerRepository: IConsumerRepository,
    private readonly foodProfileRepository: IFoodProfileRepository,
    private readonly createConsumerUseCase?: CreateConsumerUseCase,
  ) {}

  async execute(userId: string): Promise<Result<GetConsumerProfileOutput>> {
    let consumer = await this.consumerRepository.findByUserId(userId);
    if (!consumer) {
      // Auto-cria consumidor delegando a execução ao CreateConsumerUseCase (CQS/CQRS & Clean Arch)
      const createUseCase = this.createConsumerUseCase || new CreateConsumerUseCase(this.consumerRepository);
      const createRes = await createUseCase.execute({ userId });
      if (createRes.isFailure) {
        return Result.fail<GetConsumerProfileOutput>(createRes.getError());
      }
      consumer = createRes.getValue();
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
