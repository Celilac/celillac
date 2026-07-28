// tests/unit/domain/consumer/Consumer.spec.ts
import { Consumer } from '../../../../src/domain/consumer/Consumer';
import { ConsumerStatus } from '../../../../src/domain/consumer/value-objects/ConsumerStatus';

describe('Consumer Entity', () => {
  it('deve criar um consumidor com estado inicial CONTA_CRIADA', () => {
    const res = Consumer.create({ userId: 'user-123' });
    expect(res.isSuccess).toBe(true);
    const consumer = res.getValue();
    expect(consumer.userId).toBe('user-123');
    expect(consumer.status).toBe(ConsumerStatus.CONTA_CRIADA);
    expect(consumer.isFoodProfileComplete).toBe(false);
  });

  it('deve atualizar o estado ao configurar o perfil alimentar', () => {
    const consumer = Consumer.create({ userId: 'user-123' }).getValue();
    consumer.markFoodProfileState(true, true);
    expect(consumer.isFoodProfileComplete).toBe(true);
    expect(consumer.isFoodProfileCritical).toBe(true);
    expect(consumer.status).toBe(ConsumerStatus.PERFIL_CRITICO);
  });

  it('deve falhar se userId for vazio', () => {
    const res = Consumer.create({ userId: '' });
    expect(res.isFailure).toBe(true);
    expect(res.getError()).toContain('userId');
  });
});
