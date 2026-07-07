// backend/src/interfaces/http/controllers/food-profile/GetFoodProfileController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { GetFoodProfileUseCase } from '../../../../application/food-profile/GetFoodProfileUseCase';

export class GetFoodProfileController extends BaseController {
  constructor(private readonly getProfileUseCase: GetFoodProfileUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      this.badRequest(res, 'O parâmetro userId é obrigatório.');
      return;
    }

    if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
      this.forbidden(res, 'Você não tem permissão para acessar o perfil deste usuário.');
      return;
    }

    const result = await this.getProfileUseCase.execute({ userId });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
