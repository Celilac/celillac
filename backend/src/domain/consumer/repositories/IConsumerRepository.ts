// backend/src/domain/consumer/repositories/IConsumerRepository.ts
import { Consumer } from '../Consumer';

export interface IConsumerRepository {
  save(consumer: Consumer): Promise<void>;
  findByUserId(userId: string): Promise<Consumer | null>;
  findById(id: string): Promise<Consumer | null>;
}
