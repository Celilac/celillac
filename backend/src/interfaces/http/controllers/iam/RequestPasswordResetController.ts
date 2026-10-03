// backend/src/interfaces/http/controllers/iam/RequestPasswordResetController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { RequestPasswordResetUseCase } from '../../../../application/iam/RequestPasswordResetUseCase';

export class RequestPasswordResetController extends BaseController {
  constructor(private readonly useCase: RequestPasswordResetUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return this.badRequest(res, 'O e-mail é obrigatório.');
    }

    const result = await this.useCase.execute({ email: email.trim() });

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    return this.ok(res, result.getValue());
  }
}
