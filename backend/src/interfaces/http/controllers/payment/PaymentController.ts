// backend/src/interfaces/http/controllers/payment/PaymentController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { CheckoutOrderUseCase } from '../../../../application/payment/CheckoutOrderUseCase';
import { SetupPartnerFinancialAccountUseCase } from '../../../../application/payment/SetupPartnerFinancialAccountUseCase';
import { IPaymentRepository } from '../../../../domain/payment/repositories/IPaymentRepository';
import { IPartnerFinancialAccountRepository } from '../../../../domain/payment/repositories/IPartnerFinancialAccountRepository';

export class PaymentController extends BaseController {
  constructor(
    private readonly checkoutOrderUseCase: CheckoutOrderUseCase,
    private readonly setupFinancialAccountUseCase: SetupPartnerFinancialAccountUseCase,
    private readonly paymentRepository: IPaymentRepository,
    private readonly financialAccountRepository: IPartnerFinancialAccountRepository
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

      const { orderId, method, creditCardToken, customerInfo } = req.body;
      const result = await this.checkoutOrderUseCase.execute({
        orderId,
        consumerId: user.id,
        method,
        creditCardToken,
        customerInfo,
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
