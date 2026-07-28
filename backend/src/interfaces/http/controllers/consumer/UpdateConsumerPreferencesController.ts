// backend/src/interfaces/http/controllers/consumer/UpdateConsumerPreferencesController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { UpdateConsumerPreferencesUseCase } from '../../../application/consumer/UpdateConsumerPreferencesUseCase';

export class UpdateConsumerPreferencesController extends BaseController {
  constructor(private readonly useCase: UpdateConsumerPreferencesUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return this.badRequest(res, 'Preferências inválidas.');
    }

    const result = await this.useCase.execute({ userId, preferences });
    if (result.isFailure) {
      return this.badRequest(res, result.getError());
    }

    const consumer = result.getValue();

    return this.ok(res, {
      id: consumer.id,
      userId: consumer.userId,
      generalPreferences: consumer.generalPreferences,
      status: consumer.status,
      updatedAt: consumer.updatedAt,
    });
  }
}
