// backend/src/interfaces/http/controllers/admin/EvaluateUserProfileController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { EvaluateUserProfileUseCase } from '../../../../application/admin/EvaluateUserProfileUseCase';

export class EvaluateUserProfileController extends BaseController {
  constructor(private readonly useCase: EvaluateUserProfileUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const evaluatorAdminUserId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!evaluatorAdminUserId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const result = await this.useCase.execute({
      userIdToEvaluate: id,
      evaluatorAdminUserId,
      status,
    });

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    return this.ok(res, { message: 'Status de avaliação de perfil atualizado com sucesso.' });
  }
}
