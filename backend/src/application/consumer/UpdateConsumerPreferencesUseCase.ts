// backend/src/application/consumer/UpdateConsumerPreferencesUseCase.ts
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { Consumer } from '../../domain/consumer/Consumer';
import { Result } from '../../domain/Result';

export interface UpdateConsumerPreferencesInput {
  userId: string;
  preferences: Record<string, any>;
}

export class UpdateConsumerPreferencesUseCase {
  constructor(private readonly consumerRepository: IConsumerRepository) {}

  async execute(input: UpdateConsumerPreferencesInput): Promise<Result<Consumer>> {
    let consumer = await this.consumerRepository.findByUserId(input.userId);
    if (!consumer) {
      const createRes = Consumer.create({ userId: input.userId });
      if (createRes.isFailure) {
        return Result.fail<Consumer>(createRes.getError());
      }
      consumer = createRes.getValue();
    }

    consumer.updatePreferences(input.preferences);
    await this.consumerRepository.save(consumer);

    return Result.ok<Consumer>(consumer);
  }
}
