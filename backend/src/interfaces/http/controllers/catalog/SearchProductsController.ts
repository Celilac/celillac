// backend/src/interfaces/http/controllers/catalog/SearchProductsController.ts
import { Request, Response } from 'express';

import { BaseController } from '../BaseController';
import { SearchProductsUseCase } from '../../../../application/catalog/SearchProductsUseCase';

export class SearchProductsController extends BaseController {
  constructor(private readonly searchProductsUseCase: SearchProductsUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const query = (req.query.query ?? req.query.q) as string; // aceita ambos: ?query= e ?q=
    const page = parseInt(req.query.page as string, 10);
    const limit = parseInt(req.query.limit as string, 10);
    const partnerId = req.query.partnerId as string;
    const onlyCompatible = req.query.onlyCompatible === 'true' || req.query.compatible === 'true';

    // Parse de avoidAllergens (ex: ?avoidAllergens=GLUTEN,LACTOSE)
    const avoidAllergensRaw = req.query.avoidAllergens as string;
    const avoidAllergens = avoidAllergensRaw
      ? avoidAllergensRaw.split(',').map((s) => s.trim().toUpperCase())
      : undefined;

    // Se o usuário estiver autenticado ou passar userId na query, usamos para compatibilidade
    const userIdForCompatibility = req.user?.id || (req.query.userId as string);

    const result = await this.searchProductsUseCase.execute({
      query,
      page: isNaN(page) ? undefined : page,
      limit: isNaN(limit) ? undefined : limit,
      avoidAllergens,
      partnerId,
      userIdForCompatibility,
      onlyCompatible,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
