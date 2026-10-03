// backend/tests/unit/interfaces/http/controllers/iam/PasswordResetControllers.spec.ts
import { Request, Response } from 'express';
import { RequestPasswordResetController } from '../../../../../../src/interfaces/http/controllers/iam/RequestPasswordResetController';
import { ResetPasswordController } from '../../../../../../src/interfaces/http/controllers/iam/ResetPasswordController';
import { RequestPasswordResetUseCase } from '../../../../../../src/application/iam/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../../../../../src/application/iam/ResetPasswordUseCase';
import { Result } from '../../../../../../src/domain/Result';

describe('PasswordReset Controllers', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('RequestPasswordResetController', () => {
    let useCaseMock: jest.Mocked<RequestPasswordResetUseCase>;
    let controller: RequestPasswordResetController;

    beforeEach(() => {
      useCaseMock = {
        execute: jest.fn(),
      } as unknown as jest.Mocked<RequestPasswordResetUseCase>;
      controller = new RequestPasswordResetController(useCaseMock);
    });

    it('deve retornar 400 se e-mail não for informado', async () => {
      req = { body: {} };
      await controller.execute(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'O e-mail é obrigatório.' });
    });

    it('deve retornar 400 se useCase retornar falha', async () => {
      req = { body: { email: 'invalido' } };
      useCaseMock.execute.mockResolvedValue(Result.fail('E-mail inválido.'));

      await controller.execute(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'E-mail inválido.' });
    });

    it('deve retornar 200 com mensagem de sucesso se useCase for bem sucedido', async () => {
      req = { body: { email: 'teste@celilac.dev' } };
      useCaseMock.execute.mockResolvedValue(Result.ok({ message: 'Instruções enviadas com sucesso.' }));

      await controller.execute(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Instruções enviadas com sucesso.' });
    });
  });

  describe('ResetPasswordController', () => {
    let useCaseMock: jest.Mocked<ResetPasswordUseCase>;
    let controller: ResetPasswordController;

    beforeEach(() => {
      useCaseMock = {
        execute: jest.fn(),
      } as unknown as jest.Mocked<ResetPasswordUseCase>;
      controller = new ResetPasswordController(useCaseMock);
    });

    it('deve retornar 400 se e-mail não for informado', async () => {
      req = { body: { code: '123456', newPassword: 'SenhaValida@123' } };
      await controller.execute(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'O e-mail é obrigatório.' });
    });

    it('deve retornar 400 se código não tiver 6 dígitos', async () => {
      req = { body: { email: 'teste@celilac.dev', code: '123', newPassword: 'SenhaValida@123' } };
      await controller.execute(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'O código de recuperação deve possuir 6 dígitos.' });
    });

    it('deve retornar 400 se nova senha não for informada', async () => {
      req = { body: { email: 'teste@celilac.dev', code: '123456' } };
      await controller.execute(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'A nova senha é obrigatória.' });
    });

    it('deve retornar 400 se useCase retornar falha', async () => {
      req = { body: { email: 'teste@celilac.dev', code: '123456', newPassword: 'SenhaFraca' } };
      useCaseMock.execute.mockResolvedValue(Result.fail('Senha muito fraca.'));

      await controller.execute(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Senha muito fraca.' });
    });

    it('deve retornar 200 com mensagem de sucesso ao redefinir', async () => {
      req = { body: { email: 'teste@celilac.dev', code: '123456', newPassword: 'SenhaValida@123' } };
      useCaseMock.execute.mockResolvedValue(Result.ok({ message: 'Senha alterada com sucesso.' }));

      await controller.execute(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Senha alterada com sucesso.' });
    });
  });
});
