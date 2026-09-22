// backend/tests/unit/interfaces/http/controllers/consumer/ToggleConsumerStatusController.spec.ts
import { Request, Response } from 'express';
import { ToggleConsumerStatusController } from '../../../../../../src/interfaces/http/controllers/consumer/ToggleConsumerStatusController';
import { ToggleConsumerStatusUseCase } from '../../../../../../src/application/consumer/ToggleConsumerStatusUseCase';
import { Consumer } from '../../../../../../src/domain/consumer/Consumer';
import { ConsumerStatus } from '../../../../../../src/domain/consumer/value-objects/ConsumerStatus';
import { Result } from '../../../../../../src/domain/Result';

describe('ToggleConsumerStatusController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let useCaseMock: jest.Mocked<ToggleConsumerStatusUseCase>;
  let controller: ToggleConsumerStatusController;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };

    useCaseMock = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ToggleConsumerStatusUseCase>;

    controller = new ToggleConsumerStatusController(useCaseMock);
  });

  it('deve retornar 401 se usuário não estiver autenticado', async () => {
    req = {
      body: { action: 'DEACTIVATE' },
    };

    await controller.execute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Não autorizado.' });
  });

  it('deve retornar 400 se action for inválida ou não informada', async () => {
    req = {
      user: { id: 'user-123', role: 'CELIACO' },
      body: { action: 'INVALID_ACTION' },
    };

    await controller.execute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Ação inválida. Use ACTIVATE ou DEACTIVATE.' });
  });

  it('deve desativar consumidor com sucesso lendo req.user.id', async () => {
    req = {
      user: { id: 'user-123', role: 'CELIACO' },
      body: { action: 'DEACTIVATE', reason: 'Pausa voluntária' },
    };

    const dummyConsumer = Consumer.create(
      {
        userId: 'user-123',
        status: ConsumerStatus.INATIVO,
        statusChangedAt: new Date('2026-09-22T12:00:00.000Z'),
        statusChangedBy: 'user-123',
        statusChangeReason: 'Pausa voluntária',
      },
      'consumer-abc',
    ).getValue();

    useCaseMock.execute.mockResolvedValue(Result.ok(dummyConsumer));

    await controller.execute(req as Request, res as Response);

    expect(useCaseMock.execute).toHaveBeenCalledWith({
      targetUserId: 'user-123',
      requestedByUserId: 'user-123',
      action: 'DEACTIVATE',
      reason: 'Pausa voluntária',
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: 'consumer-abc',
      userId: 'user-123',
      status: ConsumerStatus.INATIVO,
      statusChangedAt: dummyConsumer.statusChangedAt,
      statusChangedBy: 'user-123',
      statusChangeReason: 'Pausa voluntária',
    });
  });

  it('deve reativar consumidor com sucesso aceitando req.user.sub para compatibilidade', async () => {
    req = {
      user: { id: 'user-123', sub: 'user-123', role: 'CELIACO' },
      body: { action: 'ACTIVATE' },
    };

    const dummyConsumer = Consumer.create(
      {
        userId: 'user-123',
        status: ConsumerStatus.ATIVO,
        statusChangedAt: new Date('2026-09-22T13:00:00.000Z'),
        statusChangedBy: 'user-123',
        statusChangeReason: 'Ativado pelo consumidor',
      },
      'consumer-abc',
    ).getValue();

    useCaseMock.execute.mockResolvedValue(Result.ok(dummyConsumer));

    await controller.execute(req as Request, res as Response);

    expect(useCaseMock.execute).toHaveBeenCalledWith({
      targetUserId: 'user-123',
      requestedByUserId: 'user-123',
      action: 'ACTIVATE',
      reason: undefined,
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: 'consumer-abc',
      userId: 'user-123',
      status: ConsumerStatus.ATIVO,
      statusChangedAt: dummyConsumer.statusChangedAt,
      statusChangedBy: 'user-123',
      statusChangeReason: 'Ativado pelo consumidor',
    });
  });

  it('deve retornar 400 se o useCase falhar', async () => {
    req = {
      user: { id: 'user-123', role: 'CELIACO' },
      body: { action: 'DEACTIVATE' },
    };

    useCaseMock.execute.mockResolvedValue(Result.fail('Perfil não encontrado.'));

    await controller.execute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Perfil não encontrado.' });
  });

  it('deve retornar 500 se ocorrer uma exceção inesperada', async () => {
    req = {
      user: { id: 'user-123', role: 'CELIACO' },
      body: { action: 'DEACTIVATE' },
    };

    useCaseMock.execute.mockRejectedValue(new Error('Erro de banco de dados'));

    await controller.execute(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Erro ao alterar status do consumidor.' });
  });
});
