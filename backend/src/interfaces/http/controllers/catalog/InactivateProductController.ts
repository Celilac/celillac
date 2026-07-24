// backend/src/interfaces/http/controllers/catalog/InactivateProductController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { InactivateProductUseCase } from '../../../../application/catalog/InactivateProductUseCase';

export class InactivateProductController extends BaseController {
  constructor(private readonly inactivateProductUseCase: InactivateProductUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const partnerUserId = req.user?.id;

    if (!partnerUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const { isActive } = req.body;

    if (isActive === undefined) {
      this.badRequest(res, 'O campo isActive é obrigatório.');
      return;
    }

    const result = await this.inactivateProductUseCase.execute({
      id,
      partnerUserId,
      isActive: !!isActive,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }

    this.ok(res, { message: `Produto alterado para ${isActive ? 'ativo' : 'inativo'} com sucesso.` });
  }
}
