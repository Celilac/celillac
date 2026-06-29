// backend/src/interfaces/http/controllers/iam/LoginUserController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { LoginUserUseCase } from '../../../../application/iam/LoginUserUseCase';

/**
 * LoginUserController — Traduz HTTP para o LoginUserUseCase.
 * Responsabilidade: extrair input, delegar ao Use Case, retornar token.
 * NÃO contém lógica de negócio.
 */
export class LoginUserController extends BaseController {
  constructor(private readonly loginUserUseCase: LoginUserUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      this.badRequest(res, 'Os campos email e password são obrigatórios.');
      return;
    }

    const result = await this.loginUserUseCase.execute({ email, password });

    if (result.isFailure) {
      // 401 para credenciais inválidas — mensagem genérica intencional
      this.unauthorized(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
