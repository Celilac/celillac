// backend/src/interfaces/http/controllers/partner/RegisterPartnerController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { RegisterPartnerUseCase } from '../../../../application/partner/RegisterPartnerUseCase';

export class RegisterPartnerController extends BaseController {
  constructor(private readonly registerPartnerUseCase: RegisterPartnerUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { name, cnpj, description, address, phone, type } = req.body;

    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    if (!name || !address || !type) {
      this.badRequest(res, 'Os campos name, address e type são obrigatórios.');
      return;
    }

    const result = await this.registerPartnerUseCase.execute({
      userId,
      name,
      cnpj,
      description,
      address,
      phone,
      type,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.created(res, result.getValue());
  }
}
