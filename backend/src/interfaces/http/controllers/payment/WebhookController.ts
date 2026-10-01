// backend/src/interfaces/http/controllers/payment/WebhookController.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import { BaseController } from '../BaseController';
import { HandleAsaasWebhookUseCase } from '../../../../application/payment/HandleAsaasWebhookUseCase';
import { SecurityLogger } from '../../../../infrastructure/logging/SecurityLogger';
import { getClientIp } from '../../middlewares/RateLimitMiddleware';

export class WebhookController extends BaseController {
  constructor(private readonly handleAsaasWebhookUseCase: HandleAsaasWebhookUseCase) {
    super();
  }

  protected async executeImpl(_req: Request, res: Response): Promise<void | any> {
    return this.ok(res, { status: 'Webhook endpoint listening.' });
  }

  public async handleAsaas(req: Request, res: Response): Promise<Response> {
    try {
      const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET || 'dev_webhook_secret_celilac_2026';
      const receivedToken = (req.headers['asaas-access-token'] as string) || '';

      const isTokenValid =
        receivedToken.length === webhookSecret.length &&
        crypto.timingSafeEqual(Buffer.from(receivedToken), Buffer.from(webhookSecret));

      if (!isTokenValid) {
        const ip = getClientIp(req);
        SecurityLogger.logAccessForbidden(
          ip,
          '/payments/webhook/asaas',
          'Token de autenticação do webhook Asaas (asaas-access-token) ausente ou inválido.',
          req.headers['user-agent'] as string
        );
        return this.unauthorized(res, 'Token de webhook inválido ou ausente.');
      }

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

