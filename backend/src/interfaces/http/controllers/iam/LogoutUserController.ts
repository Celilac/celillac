// backend/src/interfaces/http/controllers/iam/LogoutUserController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { LogoutUserUseCase } from '../../../../application/iam/LogoutUserUseCase';
import { extractAuthToken } from '../../middlewares/AuthMiddleware';

/**
 * LogoutUserController — Controlador HTTP para processar a revogação de tokens (Logout).
 * Extrai o token JWT de cookies httpOnly ou do cabeçalho Authorization e limpa a sessão.
 */
export class LogoutUserController extends BaseController {
  constructor(private readonly logoutUserUseCase: LogoutUserUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const extracted = extractAuthToken(req);

    if (extracted.error || !extracted.token) {
      this.unauthorized(res, extracted.error || 'Token de autenticação não fornecido.');
      return;
    }

    const token = extracted.token;

    // A02: Roubo de Sessão — Limpa o cookie httpOnly
    const host = req.headers.host || '';
    const isCelilacDomain = host.includes('celilac.com.br');
    const cookieDomain = process.env.COOKIE_DOMAIN || (isCelilacDomain ? '.celilac.com.br' : undefined);
    res.clearCookie('token', { path: '/', domain: cookieDomain });

    const result = await this.logoutUserUseCase.execute({ token });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res);
  }
}
