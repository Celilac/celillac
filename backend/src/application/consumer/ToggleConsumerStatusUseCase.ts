// backend/src/application/consumer/ToggleConsumerStatusUseCase.ts
import { IConsumerRepository } from '../../domain/consumer/repositories/IConsumerRepository';
import { Consumer } from '../../domain/consumer/Consumer';
import { Result } from '../../domain/Result';

export interface ToggleConsumerStatusInput {
  targetUserId: string;
  requestedByUserId: string;
  action: 'ACTIVATE' | 'DEACTIVATE';
  reason?: string;
}

export class ToggleConsumerStatusUseCase {
  constructor(private readonly consumerRepository: IConsumerRepository) {}

  async execute(input: ToggleConsumerStatusInput): Promise<Result<Consumer>> {
    if (!input.targetUserId || input.targetUserId.trim().length === 0) {
      return Result.fail<Consumer>('ID do usuário alvo é obrigatório.');
    }

    let consumer = await this.consumerRepository.findByUserId(input.targetUserId);
    if (!consumer) {
      const createRes = Consumer.create({ userId: input.targetUserId });
      if (createRes.isFailure) {
        return Result.fail<Consumer>(createRes.getError());
      }
      consumer = createRes.getValue();
    }

    if (input.action === 'DEACTIVATE') {
      consumer.deactivate(input.requestedByUserId, input.reason);
    } else {
      consumer.activate(input.requestedByUserId, input.reason);
    }

    await this.consumerRepository.save(consumer);
    return Result.ok<Consumer>(consumer);
  }
}
