// backend/src/interfaces/http/controllers/iam/LogoutUserController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { LogoutUserUseCase } from '../../../../application/iam/LogoutUserUseCase';

/**
 * LogoutUserController — Controlador HTTP para processar a revogação de tokens (Logout).
 * Extrai o token JWT do cabeçalho Authorization e o passa para o caso de uso.
 */
export class LogoutUserController extends BaseController {
  constructor(private readonly logoutUserUseCase: LogoutUserUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      this.unauthorized(res, 'Token de autenticação não fornecido.');
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      this.badRequest(res, 'Token de autenticação malformado.');
      return;
    }

    const [, token] = parts;

    const result = await this.logoutUserUseCase.execute({ token });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res);
  }
}
