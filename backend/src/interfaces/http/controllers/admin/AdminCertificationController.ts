// backend/src/interfaces/http/controllers/admin/AdminCertificationController.ts
import { Request, Response } from 'express';
import { ListAdminCertificationsUseCase } from '../../../../application/admin/certifications/ListAdminCertificationsUseCase';
import { ReviewProductCertificationUseCase } from '../../../../application/admin/certifications/ReviewProductCertificationUseCase';

export class AdminCertificationController {
  constructor(
    private readonly listCertificationsUseCase: ListAdminCertificationsUseCase,
    private readonly reviewCertificationUseCase: ReviewProductCertificationUseCase
  ) {}

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const { status, productId, page, limit } = req.query;

      const result = await this.listCertificationsUseCase.execute({
        status: status ? String(status) : undefined,
        productId: productId ? String(productId) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      if (result.isFailure) {
        return res.status(400).json({
          success: false,
          error: result.getError(),
        });
      }

      return res.status(200).json({
        success: true,
        data: result.getValue(),
      });
    } catch (error) {
      console.error('[AdminCertificationController.list] Erro inesperado:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao listar certificações para moderação.',
      });
    }
  }

  async review(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const user = (req as any).user;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID da certificação é obrigatório.',
        });
      }

      if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Ação de revisão inválida. Utilize APPROVE ou REJECT.',
        });
      }

      const result = await this.reviewCertificationUseCase.execute({
        certificationId: id,
        action,
        notes,
        adminId: user?.sub || user?.id || 'admin',
        adminEmail: user?.email,
      });

      if (result.isFailure) {
        const errorMsg = result.getError();
        const statusCode = errorMsg.includes('não encontrada') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          error: errorMsg,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.getValue(),
        message: action === 'APPROVE'
          ? 'Certificação homologada com sucesso.'
          : 'Certificação rejeitada com sucesso.',
      });
    } catch (error) {
      console.error('[AdminCertificationController.review] Erro inesperado:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao processar moderação de certificação.',
      });
    }
  }
}
