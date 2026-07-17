// backend/src/interfaces/http/controllers/catalog/CreateProductController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { CreateProductUseCase } from '../../../../application/catalog/CreateProductUseCase';

export class CreateProductController extends BaseController {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { name, brand, ingredients, hasGluten, crossContamination, partnerId } = req.body;

    const result = await this.createProductUseCase.execute({
      name,
      brand,
      ingredients,
      hasGluten,
      crossContamination,
      partnerId,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.created(res, result.getValue());
  }
}
