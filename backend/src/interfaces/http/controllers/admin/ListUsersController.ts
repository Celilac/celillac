// backend/src/interfaces/http/controllers/admin/ListUsersController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { ListUsersUseCase } from '../../../../application/admin/ListUsersUseCase';

export class ListUsersController extends BaseController {
  constructor(private readonly useCase: ListUsersUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const adminUserId = (req as any).user?.id || (req as any).user?.userId;
    if (!adminUserId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const result = await this.useCase.execute(adminUserId);

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    return this.ok(res, result.getValue());
  }
}
