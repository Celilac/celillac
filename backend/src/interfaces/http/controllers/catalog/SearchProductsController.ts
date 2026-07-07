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

    const result = await this.searchProductsUseCase.execute({
      query,
      page: isNaN(page) ? undefined : page,
      limit: isNaN(limit) ? undefined : limit,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
