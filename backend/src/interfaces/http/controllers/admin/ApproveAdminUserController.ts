// backend/src/interfaces/http/controllers/admin/ApproveAdminUserController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { ApproveAdminUserUseCase } from '../../../../application/admin/ApproveAdminUserUseCase';

export class ApproveAdminUserController extends BaseController {
  constructor(private readonly useCase: ApproveAdminUserUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const approvedByUserId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    if (!approvedByUserId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const result = await this.useCase.execute({
      adminUserIdToApprove: id,
      approvedByUserId,
    });

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    return this.ok(res, { message: 'Conta de Administrador aprovada com sucesso e notificação enviada por e-mail.' });
  }
}
