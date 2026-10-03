// backend/src/interfaces/http/controllers/iam/UpdateUserProfileController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { UpdateUserProfileUseCase } from '../../../../application/iam/UpdateUserProfileUseCase';

export class UpdateUserProfileController extends BaseController {
  constructor(private readonly useCase: UpdateUserProfileUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const { fullName, birthDate, gender, avatarUrl, whatsappPhone } = req.body;

    const result = await this.useCase.execute({
      userId,
      fullName,
      birthDate,
      gender,
      avatarUrl,
      whatsappPhone,
      actorId: userId,
      actorRole: (req as any).user?.role,
    });

    if (result.isFailure) {
      if (result.getError().includes('Acesso negado')) {
        return this.forbidden(res, result.getError());
      }
      return this.badRequest(res, result.getError());
    }

    const user = result.getValue();
    return this.ok(res, {
      id: user.id,
      email: user.email.value,
      role: user.role,
      fullName: user.fullName,
      birthDate: user.birthDate,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      whatsappPhone: user.whatsappPhone?.value,
      accountStatus: user.accountStatus,
      profileEvaluationStatus: user.profileEvaluationStatus,
    });
  }
}
