// backend/src/interfaces/http/controllers/admin/CreateReportController.ts
import { Request, Response } from 'express';
import { CreateReportUseCase } from '../../../../application/admin/CreateReportUseCase';

export class CreateReportController {
  constructor(private readonly useCase: CreateReportUseCase) {}

  async execute(req: Request, res: Response): Promise<Response> {
    try {
      const { productId, reason, details } = req.body;

      const reporterId = (req as any).user?.id;
      if (!reporterId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await this.useCase.execute({
        reporterId,
        productId,
        reason,
        details,
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
