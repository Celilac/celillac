// backend/src/application/consumer/CreateConsumerUseCase.ts
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { Consumer } from '../../domain/consumer/Consumer';
import { Result } from '../../domain/Result';

export interface CreateConsumerInput {
  userId: string;
  generalPreferences?: Record<string, any>;
}

export class CreateConsumerUseCase {
  constructor(private readonly consumerRepository: IConsumerRepository) {}

  async execute(input: CreateConsumerInput): Promise<Result<Consumer>> {
    const existing = await this.consumerRepository.findByUserId(input.userId);
    if (existing) {
      return Result.ok<Consumer>(existing);
    }

    const consumerResult = Consumer.create({
      userId: input.userId,
      generalPreferences: input.generalPreferences || {},
    });

    if (consumerResult.isFailure) {
      return Result.fail<Consumer>(consumerResult.getError());
    }

    const consumer = consumerResult.getValue();
    await this.consumerRepository.save(consumer);

    return Result.ok<Consumer>(consumer);
  }
}
