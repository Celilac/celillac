// backend/src/interfaces/http/controllers/admin/ReviewReportController.ts
import { Request, Response } from 'express';
import { ReviewReportUseCase } from '../../../../application/admin/ReviewReportUseCase';

export class ReviewReportController {
  constructor(private readonly useCase: ReviewReportUseCase) {}

  async execute(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { newStatus } = req.body;

      const result = await this.useCase.execute({
        reportId: id,
        newStatus,
      });

      if (result.isFailure) {
        return res.status(400).json({ error: result.getError() });
      }

      return res.status(200).json(result.getValue());
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
