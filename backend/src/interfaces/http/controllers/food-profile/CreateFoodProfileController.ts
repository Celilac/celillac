// backend/src/interfaces/http/controllers/food-profile/CreateFoodProfileController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { CreateFoodProfileUseCase } from '../../../../application/food-profile/CreateFoodProfileUseCase';

export class CreateFoodProfileController extends BaseController {
  constructor(private readonly createProfileUseCase: CreateFoodProfileUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { userId, restrictions } = req.body;

    if (!userId) {
      this.badRequest(res, 'O campo userId é obrigatório.');
      return;
    }
    if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
      this.forbidden(res, 'Você não tem permissão para criar um perfil para outro usuário.');
      return;
    }
    if (!Array.isArray(restrictions) || restrictions.length === 0) {
      this.badRequest(res, 'O campo restrictions deve ser um array não vazio.');
      return;
    }

    const result = await this.createProfileUseCase.execute({ userId, restrictions });

    if (result.isFailure) {
      const error = result.getError();
      if (error.includes('já possui')) {
        this.conflict(res, error);
      } else {
        this.badRequest(res, error);
      }
      return;
    }

    this.created(res, result.getValue());
  }
}
