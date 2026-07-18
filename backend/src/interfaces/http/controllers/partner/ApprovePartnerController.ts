// backend/src/interfaces/http/controllers/partner/ApprovePartnerController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { ApprovePartnerUseCase } from '../../../../application/partner/ApprovePartnerUseCase';

export class ApprovePartnerController extends BaseController {
  constructor(private readonly approvePartnerUseCase: ApprovePartnerUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { isActive } = req.body;

    if (!adminUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    if (isActive === undefined) {
      this.badRequest(res, 'O campo isActive é obrigatório.');
      return;
    }

    const result = await this.approvePartnerUseCase.execute({
      partnerId: id,
      adminUserId,
      isActive: !!isActive,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, { message: `Status do parceiro comercial alterado para ${isActive ? 'ativo' : 'inativo'} com sucesso.` });
  }
}
