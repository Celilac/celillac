// backend/src/interfaces/http/controllers/admin/PromoteUserToAdminController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { PromoteUserToAdminUseCase } from '../../../../application/admin/PromoteUserToAdminUseCase';

export class PromoteUserToAdminController extends BaseController {
  constructor(private readonly promoteUserToAdminUseCase: PromoteUserToAdminUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const requestedByUserId = req.user?.id;
    const { id: targetUserId } = req.params;

    if (!requestedByUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.promoteUserToAdminUseCase.execute({
      targetUserId,
      requestedByUserId,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res);
  }
}
