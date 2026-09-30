// backend/src/interfaces/http/controllers/payment/WebhookController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { HandleAsaasWebhookUseCase } from '../../../../application/payment/HandleAsaasWebhookUseCase';

export class WebhookController extends BaseController {
  constructor(private readonly handleAsaasWebhookUseCase: HandleAsaasWebhookUseCase) {
    super();
  }

  protected async executeImpl(_req: Request, res: Response): Promise<void | any> {
    return this.ok(res, { status: 'Webhook endpoint listening.' });
  }

  public async handleAsaas(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.handleAsaasWebhookUseCase.execute(req.body);
      if (result.isFailure) {
        return this.badRequest(res, result.getError());
      }
      return this.ok(res, result.getValue());
    } catch (err: any) {
      console.error('[WebhookController] Erro no processamento do webhook Asaas:', err);
      return this.serverError(res, 'Erro ao processar notificação.');
    }
  }
}
