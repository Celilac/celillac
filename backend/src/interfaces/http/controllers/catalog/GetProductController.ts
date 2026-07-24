// backend/src/interfaces/http/controllers/catalog/GetProductController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { GetProductUseCase } from '../../../../application/catalog/GetProductUseCase';

export class GetProductController extends BaseController {
  constructor(private readonly getProductUseCase: GetProductUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    // Opcional: calcular compatibilidade alimentar se o usuário estiver logado
    const userIdForCompatibility = req.user?.id; 

    const result = await this.getProductUseCase.execute({
      id,
      userIdForCompatibility,
    });

    if (result.isFailure) {
      this.notFound(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
