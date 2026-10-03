// backend/src/interfaces/http/controllers/admin/AdminCategoryController.ts
import { Request, Response } from 'express';
import { ListAdminCategoriesUseCase } from '../../../../application/admin/ListAdminCategoriesUseCase';
import { ReviewCategoryUseCase } from '../../../../application/admin/ReviewCategoryUseCase';

export class AdminCategoryController {
  constructor(
    private readonly listAdminCategoriesUseCase: ListAdminCategoriesUseCase,
    private readonly reviewCategoryUseCase: ReviewCategoryUseCase
  ) {}

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const { status, visibility, partnerId } = req.query;

      const categories = await this.listAdminCategoriesUseCase.execute({
        status: status as string | undefined,
        visibility: visibility as string | undefined,
        partnerId: partnerId as string | undefined,
      });

      return res.status(200).json({ success: true, data: categories });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Erro ao listar categorias para moderação.' });
    }
  }

  async review(req: Request, res: Response): Promise<Response> {
    try {
      const categoryId = req.params.id;
      const { action, rejectionReason } = req.body;
      const admin = (req as any).user;

      if (!admin || admin.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Acesso restrito a administradores.' });
      }

      const result = await this.reviewCategoryUseCase.execute({
        categoryId,
        action,
        rejectionReason,
        adminId: admin.id,
      });

      if (result.isFailure) {
        return res.status(400).json({ success: false, error: result.getError() });
      }

      return res.status(200).json({ success: true, data: result.getValue() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Erro ao revisar categoria.' });
    }
  }
}
