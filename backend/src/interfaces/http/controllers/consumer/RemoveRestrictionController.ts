// backend/src/interfaces/http/controllers/consumer/RemoveRestrictionController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { RemoveRestrictionUseCase } from '../../../application/food-profile/RemoveRestrictionUseCase';

export class RemoveRestrictionController extends BaseController {
  constructor(private readonly useCase: RemoveRestrictionUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const { allergen } = req.params;
    if (!allergen) {
      return this.badRequest(res, 'Parâmetro allergen é obrigatório.');
    }

    const result = await this.useCase.execute({
      userId,
      allergen: allergen as any,
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
