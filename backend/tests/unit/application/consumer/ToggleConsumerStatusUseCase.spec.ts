// backend/tests/unit/application/consumer/ToggleConsumerStatusUseCase.spec.ts
import { ToggleConsumerStatusUseCase } from '../../../../src/application/consumer/ToggleConsumerStatusUseCase';
import { IConsumerRepository } from '../../../../src/domain/consumer/repositories/IConsumerRepository';
import { Consumer } from '../../../../src/domain/consumer/Consumer';
import { ConsumerStatus } from '../../../../src/domain/consumer/value-objects/ConsumerStatus';

describe('ToggleConsumerStatusUseCase', () => {
  let consumerRepository: jest.Mocked<IConsumerRepository>;
  let useCase: ToggleConsumerStatusUseCase;

  beforeEach(() => {
    consumerRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
    };
    useCase = new ToggleConsumerStatusUseCase(consumerRepository);
  });

  it('deve desativar um perfil de consumidor ativo registrando a auditoria', async () => {
    const mockConsumer = Consumer.create({ userId: 'user-1' }).getValue();
    consumerRepository.findByUserId.mockResolvedValue(mockConsumer);

    const result = await useCase.execute({
      targetUserId: 'user-1',
      requestedByUserId: 'user-1',
      action: 'DEACTIVATE',
      reason: 'Quero dar uma pausa',
    });

    expect(result.isSuccess).toBe(true);
    const consumer = result.getValue();
    expect(consumer.status).toBe(ConsumerStatus.INATIVO);
    expect(consumer.statusChangedBy).toBe('user-1');
    expect(consumer.statusChangeReason).toBe('Quero dar uma pausa');
    expect(consumer.statusChangedAt).toBeDefined();
    expect(consumerRepository.save).toHaveBeenCalled();
  });

  it('deve reativar um perfil de consumidor inativo registrando a auditoria', async () => {
    const mockConsumer = Consumer.create({ userId: 'user-1', status: ConsumerStatus.INATIVO }).getValue();
    consumerRepository.findByUserId.mockResolvedValue(mockConsumer);

    const result = await useCase.execute({
      targetUserId: 'user-1',
      requestedByUserId: 'user-1',
      action: 'ACTIVATE',
      reason: 'Retornando ao uso',
    });

    expect(result.isSuccess).toBe(true);
    const consumer = result.getValue();
    expect(consumer.status).not.toBe(ConsumerStatus.INATIVO);
    expect(consumer.statusChangedBy).toBe('user-1');
    expect(consumer.statusChangeReason).toBe('Retornando ao uso');
    expect(consumerRepository.save).toHaveBeenCalled();
  });
});
