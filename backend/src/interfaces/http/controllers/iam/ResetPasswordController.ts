// backend/src/interfaces/http/controllers/iam/ResetPasswordController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { ResetPasswordUseCase } from '../../../../application/iam/ResetPasswordUseCase';

export class ResetPasswordController extends BaseController {
  constructor(private readonly useCase: ResetPasswordUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const { email, code, newPassword } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return this.badRequest(res, 'O e-mail é obrigatório.');
    }

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return this.badRequest(res, 'O código de recuperação deve possuir 6 dígitos.');
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return this.badRequest(res, 'A nova senha é obrigatória.');
    }

    const result = await this.useCase.execute({
      email: email.trim(),
      code: code.trim(),
      newPassword,
    });

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    return this.ok(res, result.getValue());
  }
}
