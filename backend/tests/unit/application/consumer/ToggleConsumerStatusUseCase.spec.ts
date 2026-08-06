// backend/tests/unit/application/consumer/ToggleConsumerStatusUseCase.spec.ts
import { ToggleConsumerStatusUseCase } from '../../../../src/application/consumer/ToggleConsumerStatusUseCase';
import { IConsumerRepository } from '../../../../src/domain/consumer/repositories/IConsumerRepository';
import { IAuditLogRepository } from '../../../../src/domain/audit/repositories/IAuditLogRepository';
import { Consumer } from '../../../../src/domain/consumer/Consumer';
import { ConsumerStatus } from '../../../../src/domain/consumer/value-objects/ConsumerStatus';

describe('ToggleConsumerStatusUseCase', () => {
  let consumerRepository: jest.Mocked<IConsumerRepository>;
  let auditLogRepository: jest.Mocked<IAuditLogRepository>;
  let useCase: ToggleConsumerStatusUseCase;

  beforeEach(() => {
    consumerRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
    };
    auditLogRepository = {
      save: jest.fn(),
      findByEntity: jest.fn(),
    };
    useCase = new ToggleConsumerStatusUseCase(consumerRepository, auditLogRepository);
  });

  it('deve falhar se targetUserId estiver em branco', async () => {
    const result = await useCase.execute({
      targetUserId: '   ',
      requestedByUserId: 'admin-1',
      action: 'DEACTIVATE',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('ID do usuário alvo é obrigatório.');
  });

  it('deve desativar um perfil de consumidor ativo registrando a auditoria', async () => {
    const mockConsumer = Consumer.create({ userId: 'user-1' }).getValue();
    consumerRepository.findByUserId.mockResolvedValue(mockConsumer);

    const result = await useCase.execute({
      targetUserId: 'user-1',
      requestedByUserId: 'admin-1',
      action: 'DEACTIVATE',
      reason: 'Quero dar uma pausa',
    });

    expect(result.isSuccess).toBe(true);
    const consumer = result.getValue();
    expect(consumer.status).toBe(ConsumerStatus.INATIVO);
    expect(consumer.statusChangedBy).toBe('admin-1');
    expect(consumer.statusChangeReason).toBe('Quero dar uma pausa');
    expect(consumer.statusChangedAt).toBeDefined();
    expect(consumerRepository.save).toHaveBeenCalled();
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'Consumer',
        action: 'DEACTIVATE',
        actorId: 'admin-1',
      }),
    );
  });

  it('deve reativar um perfil de consumidor inativo e criar consumidor novo se nao existir', async () => {
    consumerRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute({
      targetUserId: 'user-2',
      requestedByUserId: 'admin-1',
      action: 'ACTIVATE',
      reason: 'Retornando ao uso',
    });

    expect(result.isSuccess).toBe(true);
    const consumer = result.getValue();
    expect(consumer.status).not.toBe(ConsumerStatus.INATIVO);
    expect(consumer.statusChangedBy).toBe('admin-1');
    expect(consumer.statusChangeReason).toBe('Retornando ao uso');
    expect(consumerRepository.save).toHaveBeenCalled();
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'Consumer',
        action: 'ACTIVATE',
        actorId: 'admin-1',
      }),
    );
  });
});
