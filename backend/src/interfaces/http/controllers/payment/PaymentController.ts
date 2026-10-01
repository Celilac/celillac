// backend/src/interfaces/http/controllers/payment/PaymentController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { CheckoutOrderUseCase } from '../../../../application/payment/CheckoutOrderUseCase';
import { SetupPartnerFinancialAccountUseCase } from '../../../../application/payment/SetupPartnerFinancialAccountUseCase';
import { IPaymentRepository } from '../../../../domain/payment/repositories/IPaymentRepository';
import { IPartnerFinancialAccountRepository } from '../../../../domain/payment/repositories/IPartnerFinancialAccountRepository';
import { IOrderRepository } from '../../../../domain/order/repositories/IOrderRepository';
import { IPartnerRepository } from '../../../../domain/partner/repositories/IPartnerRepository';
import { SecurityLogger } from '../../../../infrastructure/logging/SecurityLogger';
import { getClientIp } from '../../middlewares/RateLimitMiddleware';

export class PaymentController extends BaseController {
  constructor(
    private readonly checkoutOrderUseCase: CheckoutOrderUseCase,
    private readonly setupFinancialAccountUseCase: SetupPartnerFinancialAccountUseCase,
    private readonly paymentRepository: IPaymentRepository,
    private readonly financialAccountRepository: IPartnerFinancialAccountRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly partnerRepository: IPartnerRepository
  ) {
    super();
  }

  protected async executeImpl(_req: Request, res: Response): Promise<void | any> {
    return this.ok(res, { message: 'PaymentController ativo.' });
  }

  public async checkout(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) return this.unauthorized(res, 'Não autenticado.');

      const { orderId, method, creditCardToken, customerInfo, forceNew, changeFor } = req.body;
      const idempotencyKey =
        (req.headers ? ((req.headers['idempotency-key'] as string) || (req.headers['x-idempotency-key'] as string)) : undefined) ||
        req.body.idempotencyKey;

      const result = await this.checkoutOrderUseCase.execute({
        orderId,
        consumerId: user.id,
        method,
        creditCardToken,
        customerInfo,
        idempotencyKey,
        forceNew: !!forceNew,
        changeFor: changeFor !== undefined ? Number(changeFor) : undefined,
      });

      if (result.isFailure) {
        return this.badRequest(res, result.getError());
      }

      return this.ok(res, result.getValue());
    } catch (err: any) {
      return this.serverError(res, err.message || 'Erro ao processar checkout.');
    }
  }

  public async getPaymentByOrderId(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) return this.unauthorized(res, 'Não autenticado.');

      const { orderId } = req.params;
      const payment = await this.paymentRepository.findByOrderId(orderId);
      if (!payment) {
        return this.notFound(res, 'Nenhum pagamento gerado para este pedido.');
      }

      // Validação de Autorização BOLA/IDOR
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return this.notFound(res, 'Pedido associado não encontrado.');
      }

      const isConsumerOwner = order.consumerId === user.id;
      const isAdmin = user.role === 'ADMIN';
      let isPartnerOwner = false;

      if (!isConsumerOwner && !isAdmin) {
        const partner = await this.partnerRepository.findById(order.partnerId);
        if (partner && partner.userId === user.id) {
          isPartnerOwner = true;
        }
      }

      if (!isConsumerOwner && !isAdmin && !isPartnerOwner) {
        const ip = getClientIp(req);
        SecurityLogger.logBolaViolation(
          ip,
          user.id,
          'OrderPayment',
          orderId,
          `/payments/order/${orderId}`
        );
        return this.forbidden(res, 'Você não tem permissão para visualizar os detalhes deste pagamento.');
      }

      return this.ok(res, payment.toJSON());
    } catch (err: any) {
      return this.serverError(res, err.message || 'Erro ao consultar pagamento.');
    }
  }

  public async setupFinancialAccount(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) return this.unauthorized(res, 'Não autenticado.');

      const { partnerId } = req.params;
      const { pixKey, pixKeyType, bankCode, agencyNumber, accountNumber, accountType } = req.body;

      const result = await this.setupFinancialAccountUseCase.execute({
        partnerId,
        userId: user.id,
        userRole: user.role,
        pixKey,
        pixKeyType,
        bankCode,
        agencyNumber,
        accountNumber,
        accountType,
      });

      if (result.isFailure) {
        const error = result.getError();
        if (error.includes('Acesso negado')) return this.forbidden(res, error);
        return this.badRequest(res, error);
      }

      return this.ok(res, result.getValue().toJSON());
    } catch (err: any) {
      return this.serverError(res, err.message || 'Erro ao configurar conta financeira.');
    }
  }

  public async getPartnerFinancialAccount(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) return this.unauthorized(res, 'Não autenticado.');

      const { partnerId } = req.params;

      // Validação de Autorização BOLA/IDOR
      const partner = await this.partnerRepository.findById(partnerId);
      if (!partner) {
        return this.notFound(res, 'Estabelecimento parceiro não encontrado.');
      }

      const isAdmin = user.role === 'ADMIN';
      const isPartnerOwner = partner.userId === user.id;

      if (!isAdmin && !isPartnerOwner) {
        const ip = getClientIp(req);
        SecurityLogger.logBolaViolation(
          ip,
          user.id,
          'PartnerFinancialAccount',
          partnerId,
          `/payments/partner/${partnerId}/financial-account`
        );
        return this.forbidden(res, 'Acesso negado. Apenas o responsável pelo estabelecimento ou administradores podem visualizar dados financeiros.');
      }

      const account = await this.financialAccountRepository.findByPartnerId(partnerId);
      if (!account) {
        return this.notFound(res, 'Conta financeira ainda não configurada para este parceiro.');
      }

      return this.ok(res, account.toJSON());
    } catch (err: any) {
      return this.serverError(res, err.message || 'Erro ao buscar dados financeiros.');
    }
  }
}
