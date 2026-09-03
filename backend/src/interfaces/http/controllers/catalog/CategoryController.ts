// backend/src/interfaces/http/controllers/catalog/CategoryController.ts
import { Request, Response } from 'express';
import { CreateCategoryUseCase } from '../../../../application/catalog/CreateCategoryUseCase';
import { ListCategoriesUseCase } from '../../../../application/catalog/ListCategoriesUseCase';

export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { name, partnerId } = req.body;
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Autenticação necessária.' });
      }

      const result = await this.createCategoryUseCase.execute({
        name,
        partnerId,
        userId: user.id,
        userRole: user.role,
      });

      if (result.isFailure) {
        return res.status(400).json({ success: false, error: result.getError() });
      }

      return res.status(201).json({ success: true, data: result.getValue() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Erro interno no servidor.' });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const partnerId = req.query.partnerId as string | undefined;
      const isPublicOnly = req.query.public === 'true';

      const categories = await this.listCategoriesUseCase.execute({
        partnerId,
        isPublicOnly,
      });

      return res.status(200).json({ success: true, data: categories });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Erro ao listar categorias.' });
    }
  }
}
