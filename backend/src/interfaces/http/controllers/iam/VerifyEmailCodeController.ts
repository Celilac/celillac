// backend/src/interfaces/http/controllers/iam/VerifyEmailCodeController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { VerifyEmailCodeUseCase } from '../../../../application/iam/VerifyEmailCodeUseCase';

export class VerifyEmailCodeController extends BaseController {
  constructor(private readonly useCase: VerifyEmailCodeUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const { code } = req.body;
    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return this.badRequest(res, 'O código de verificação deve conter 6 dígitos.');
    }

    const result = await this.useCase.execute({
      userId,
      code: code.trim(),
    });

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    return this.ok(res, { message: 'Endereço de e-mail verificado com sucesso!' });
  }
}
