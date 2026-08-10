// backend/src/interfaces/http/controllers/admin/DeleteUserController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { DeleteUserUseCase } from '../../../../application/admin/DeleteUserUseCase';

export class DeleteUserController extends BaseController {
  constructor(private readonly useCase: DeleteUserUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const requestedByUserId = req.user?.id;
    const { id: targetUserId } = req.params;

    if (!requestedByUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.useCase.execute({ requestedByUserId, targetUserId });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res);
  }
}
