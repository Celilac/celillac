// backend/src/interfaces/http/controllers/food-profile/UpdateFoodProfileController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { UpdateFoodProfileUseCase } from '../../../../application/food-profile/UpdateFoodProfileUseCase';

export class UpdateFoodProfileController extends BaseController {
  constructor(private readonly updateProfileUseCase: UpdateFoodProfileUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { restrictions, acceptsCrossContamination } = req.body;

    if (!userId) {
      this.badRequest(res, 'O parâmetro userId é obrigatório na URL.');
      return;
    }
    const requestUserId = (req.user as any)?.userId || req.user?.id;
    if (requestUserId !== userId && req.user?.role !== 'ADMIN') {
      this.forbidden(res, 'Você não tem permissão para atualizar o perfil deste usuário.');
      return;
    }
    if (!Array.isArray(restrictions) || restrictions.length === 0) {
      this.badRequest(res, 'O campo restrictions deve ser um array não vazio.');
      return;
    }

    const result = await this.updateProfileUseCase.execute({
      userId,
      restrictions,
      acceptsCrossContamination,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
