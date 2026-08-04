// backend/src/interfaces/http/controllers/admin/ListReportsController.ts
import { Request, Response } from 'express';
import { ListReportsUseCase } from '../../../../application/admin/ListReportsUseCase';

export class ListReportsController {
  constructor(private readonly useCase: ListReportsUseCase) {}

  async execute(req: Request, res: Response): Promise<Response> {
    try {
      const status = req.query.status as string;
      const isFoodSafetyRiskQuery = req.query.isFoodSafetyRisk as string;

      let isFoodSafetyRisk: boolean | undefined = undefined;
      if (isFoodSafetyRiskQuery !== undefined) {
        isFoodSafetyRisk = isFoodSafetyRiskQuery === 'true' || isFoodSafetyRiskQuery === '1';
      }

      const result = await this.useCase.execute({ status, isFoodSafetyRisk });

      if (result.isFailure) {
        return res.status(400).json({ error: result.getError() });
      }

      return res.status(200).json(result.getValue());
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
