// backend/src/interfaces/http/controllers/consumer/GetConsumerProfileController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { GetConsumerProfileUseCase } from '../../../../application/consumer/GetConsumerProfileUseCase';
import { Restriction } from '../../../../domain/food-profile/Restriction';

export class GetConsumerProfileController extends BaseController {
  constructor(private readonly useCase: GetConsumerProfileUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const result = await this.useCase.execute(userId);

    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    const { consumer, foodProfile, hasIncompleteProfileWarning } = result.getValue();

    return this.ok(res, {
      consumer: {
        id: consumer.id,
        userId: consumer.userId,
        generalPreferences: consumer.generalPreferences,
        isFoodProfileComplete: consumer.isFoodProfileComplete,
        isFoodProfileCritical: consumer.isFoodProfileCritical,
        status: consumer.status,
        createdAt: consumer.createdAt,
        updatedAt: consumer.updatedAt,
      },
      foodProfile: foodProfile
        ? {
            id: foodProfile.id,
            userId: foodProfile.userId,
            acceptsCrossContamination: foodProfile.acceptsCrossContamination,
            restrictions: foodProfile.restrictions.map((r: Restriction) => ({
              id: r.id,
              allergen: r.allergen,
              severity: r.severity,
              type: r.type,
              notes: r.notes,
            })),
          }
        : null,
      hasIncompleteProfileWarning,
    });
  }
}
