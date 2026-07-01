// backend/src/interfaces/http/controllers/allergen-engine/CheckCompatibilityController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { CheckCompatibilityUseCase } from '../../../../application/allergen-engine/CheckCompatibilityUseCase';

export class CheckCompatibilityController extends BaseController {
  constructor(private readonly checkCompatibilityUseCase: CheckCompatibilityUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      this.badRequest(res, 'Os campos userId e productId são obrigatórios.');
      return;
    }

    const result = await this.checkCompatibilityUseCase.execute({ userId, productId });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
