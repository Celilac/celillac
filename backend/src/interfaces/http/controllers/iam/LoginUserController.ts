// backend/src/interfaces/http/controllers/iam/LoginUserController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { LoginUserUseCase } from '../../../../application/iam/LoginUserUseCase';
import { SecurityLogger } from '../../../../infrastructure/logging/SecurityLogger';

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
      // A09: Auditoria — Registra falha de login de forma estruturada
      SecurityLogger.logLoginFailed(req.ip || '127.0.0.1', email, req.headers['user-agent'], result.getError());
      // 401 para credenciais inválidas — mensagem genérica intencional
      this.unauthorized(res, result.getError());
      return;
    }

    const { token, expiresIn } = result.getValue();
    const isProduction = process.env.NODE_ENV === 'production';

    // A02: Roubo de Sessão — Emite cookie HttpOnly, Secure e SameSite=Lax
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    this.ok(res, { token, expiresIn });
  }
}
