// backend/src/interfaces/http/controllers/admin/CreateReportController.ts
import { Request, Response } from 'express';
import { CreateReportUseCase } from '../../../../application/admin/CreateReportUseCase';

export class CreateReportController {
  constructor(private readonly useCase: CreateReportUseCase) {}

  async execute(req: Request, res: Response): Promise<Response> {
    try {
      const { productId, partnerId, reason, details, isFoodSafetyRisk } = req.body;
      
      // Assumindo que o auth middleware injeta req.user.id
      const reporterId = (req as any).user?.id || 'fake-user-id'; // Fallback for dev if auth is disabled
      if (!reporterId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await this.useCase.execute({
        reporterId,
        productId,
        partnerId,
        reason,
        details,
        isFoodSafetyRisk: isFoodSafetyRisk !== undefined ? Boolean(isFoodSafetyRisk) : undefined,
      });

      if (result.isFailure) {
        return res.status(400).json({ error: result.getError() });
      }

      return res.status(201).json(result.getValue());
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
