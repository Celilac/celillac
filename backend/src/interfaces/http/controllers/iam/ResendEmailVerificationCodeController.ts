// backend/src/interfaces/http/controllers/iam/ResendEmailVerificationCodeController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { SendEmailVerificationCodeUseCase } from '../../../../application/iam/SendEmailVerificationCodeUseCase';

export class ResendEmailVerificationCodeController extends BaseController {
  constructor(private readonly useCase: SendEmailVerificationCodeUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const result = await this.useCase.execute(userId);

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    return this.ok(res, { message: 'Novo código de verificação enviado por e-mail.' });
  }
}
