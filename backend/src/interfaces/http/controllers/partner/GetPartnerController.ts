// backend/src/interfaces/http/controllers/partner/GetPartnerController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { GetPartnerUseCase } from '../../../../application/partner/GetPartnerUseCase';

export class GetPartnerController extends BaseController {
  constructor(private readonly getPartnerUseCase: GetPartnerUseCase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const partnerId = req.params.id;
    const userId = req.user?.id;

    // Se passou id na URL, busca por ID de parceiro, senão busca o parceiro logado
    const queryDto = partnerId ? { partnerId } : { userId };

    if (!queryDto.partnerId && !queryDto.userId) {
      this.badRequest(res, 'Parâmetro de busca não disponível.');
      return;
    }

    const result = await this.getPartnerUseCase.execute(queryDto);

    if (result.isFailure) {
      this.notFound(res, result.getError());
      return;
    }

    this.ok(res, result.getValue());
  }
}
