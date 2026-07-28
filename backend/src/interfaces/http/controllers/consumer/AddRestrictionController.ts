// backend/src/interfaces/http/controllers/consumer/AddRestrictionController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { AddRestrictionUseCase } from '../../../application/food-profile/AddRestrictionUseCase';

export class AddRestrictionController extends BaseController {
  constructor(private readonly useCase: AddRestrictionUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const { allergen, severity, type, notes } = req.body;
    if (!allergen || !severity) {
      return this.badRequest(res, 'Campos allergen e severity são obrigatórios.');
    }

    const result = await this.useCase.execute({
      userId,
      allergen,
      severity,
      type,
      notes,
    });

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    const profile = result.getValue();
    return this.ok(res, {
      userId: profile.userId,
      acceptsCrossContamination: profile.acceptsCrossContamination,
      restrictions: profile.restrictions.map((r) => ({
        id: r.id,
        allergen: r.allergen,
        severity: r.severity,
        type: r.type,
        notes: r.notes,
      })),
    });
  }
}
