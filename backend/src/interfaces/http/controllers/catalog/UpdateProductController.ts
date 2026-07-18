// backend/src/interfaces/http/controllers/catalog/UpdateProductController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { UpdateProductUseCase } from '../../../../application/catalog/UpdateProductUseCase';

export class UpdateProductController extends BaseController {
  constructor(private readonly updateProductUseCase: UpdateProductUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const partnerUserId = req.user?.id;

    if (!partnerUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const { name, brand, ingredients, hasGluten, crossContamination, price, category, imageUrl, isActive } = req.body;

    if (!name || price === undefined || !category) {
      this.badRequest(res, 'Os campos name, price e category são obrigatórios.');
      return;
    }

    const result = await this.updateProductUseCase.execute({
      id,
      partnerUserId,
      name,
      brand,
      ingredients,
      hasGluten,
      crossContamination,
      price: parseFloat(price),
      category,
      imageUrl,
      isActive,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
