// backend/src/interfaces/http/controllers/iam/GetUserProfileController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { IUserRepository } from '../../../../domain/iam/repositories/IUserRepository';

export class GetUserProfileController extends BaseController {
  constructor(private readonly userRepository: IUserRepository) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) {
      return this.unauthorized(res, 'Usuário não autenticado.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return this.notFound(res, 'Usuário não encontrado.');
    }

    return this.ok(res, {
      id: user.id,
      email: user.email.value,
      role: user.role,
      fullName: user.fullName,
      birthDate: user.birthDate,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      accountStatus: user.accountStatus,
      profileEvaluationStatus: user.profileEvaluationStatus,
    });
  }
}
