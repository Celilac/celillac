// backend/tests/unit/application/consumer/CreateConsumerUseCase.spec.ts
import { CreateConsumerUseCase } from '../../../../src/application/consumer/CreateConsumerUseCase';
import { IConsumerRepository } from '../../../../src/domain/consumer/repositories/IConsumerRepository';
import { Consumer } from '../../../../src/domain/consumer/Consumer';

describe('CreateConsumerUseCase', () => {
  let consumerRepository: jest.Mocked<IConsumerRepository>;
  let useCase: CreateConsumerUseCase;

  beforeEach(() => {
    consumerRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
    };
    useCase = new CreateConsumerUseCase(consumerRepository);
  });

  it('deve criar e salvar um novo Consumidor se ele não existir', async () => {
    consumerRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-uuid-1',
      generalPreferences: { theme: 'dark' },
    });

    expect(result.isSuccess).toBe(true);
    expect(consumerRepository.save).toHaveBeenCalled();
    const consumer = result.getValue();
    expect(consumer.userId).toBe('user-uuid-1');
    expect(consumer.generalPreferences).toEqual({ theme: 'dark' });
  });

  it('deve reutilizar e retornar o Consumidor existente se ele já tiver sido criado (idempotência)', async () => {
    const existingConsumer = Consumer.create({ userId: 'user-uuid-1' }).getValue();
    consumerRepository.findByUserId.mockResolvedValue(existingConsumer);

    const result = await useCase.execute({
      userId: 'user-uuid-1',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(existingConsumer);
    expect(consumerRepository.save).not.toHaveBeenCalled();
  });

  it('deve falhar se o userId for inválido ou vazio', async () => {
    consumerRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('O userId do consumidor não pode ser vazio.');
    expect(consumerRepository.save).not.toHaveBeenCalled();
  });
});
