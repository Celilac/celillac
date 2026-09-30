// backend/src/interfaces/http/controllers/order/OrderController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { CreateOrderUseCase } from '../../../../application/order/CreateOrderUseCase';
import { CancelOrderUseCase } from '../../../../application/order/CancelOrderUseCase';
import { GetOrderUseCase } from '../../../../application/order/GetOrderUseCase';
import { ListConsumerOrdersUseCase } from '../../../../application/order/ListConsumerOrdersUseCase';
import { ListPartnerOrdersUseCase } from '../../../../application/order/ListPartnerOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../../../../application/order/UpdateOrderStatusUseCase';

export class OrderController extends BaseController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly listConsumerOrdersUseCase: ListConsumerOrdersUseCase,
    private readonly listPartnerOrdersUseCase: ListPartnerOrdersUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase
  ) {
    super();
  }

  protected async executeImpl(_req: Request, res: Response): Promise<void | any> {
    return this.ok(res, { message: 'OrderController endpoint ativo.' });
  }

  public async createOrder(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) {
        return this.unauthorized(res, 'Não autenticado.');
      }

      const { partnerId, items, deliveryFee, notes } = req.body;
      const result = await this.createOrderUseCase.execute({
        consumerId: user.id,
        partnerId,
        items,
        deliveryFee,
        notes,
      });

      if (result.isFailure) {
        return this.badRequest(res, result.getError());
      }

      return this.created(res, result.getValue());
    } catch (error: any) {
      return this.serverError(res, error.message || 'Erro ao criar pedido.');
    }
  }

  public async getOrder(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) {
        return this.unauthorized(res, 'Não autenticado.');
      }

      const { id } = req.params;
      const result = await this.getOrderUseCase.execute({
        orderId: id,
        userId: user.id,
        userRole: user.role,
      });

      if (result.isFailure) {
        const error = result.getError();
        if (error.includes('não encontrado')) return this.notFound(res, error);
        if (error.includes('Acesso negado')) return this.forbidden(res, error);
        return this.badRequest(res, error);
      }

      return this.ok(res, result.getValue().toJSON());
    } catch (error: any) {
      return this.serverError(res, error.message || 'Erro ao buscar pedido.');
    }
  }

  public async listMyOrders(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) {
        return this.unauthorized(res, 'Não autenticado.');
      }

      const result = await this.listConsumerOrdersUseCase.execute(user.id);
      if (result.isFailure) {
        return this.badRequest(res, result.getError());
      }

      return this.ok(res, result.getValue().map((o) => o.toJSON()));
    } catch (error: any) {
      return this.serverError(res, error.message || 'Erro ao listar pedidos do consumidor.');
    }
  }

  public async listPartnerOrders(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) {
        return this.unauthorized(res, 'Não autenticado.');
      }

      const { partnerId } = req.params;
      const result = await this.listPartnerOrdersUseCase.execute({
        partnerId,
        userId: user.id,
        userRole: user.role,
      });

      if (result.isFailure) {
        const error = result.getError();
        if (error.includes('não encontrado')) return this.notFound(res, error);
        if (error.includes('Acesso negado')) return this.forbidden(res, error);
        return this.badRequest(res, error);
      }

      return this.ok(res, result.getValue().map((o) => o.toJSON()));
    } catch (error: any) {
      return this.serverError(res, error.message || 'Erro ao listar pedidos do parceiro.');
    }
  }

  public async cancelOrder(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) {
        return this.unauthorized(res, 'Não autenticado.');
      }

      const { id } = req.params;
      const { reason } = req.body;

      const result = await this.cancelOrderUseCase.execute({
        orderId: id,
        userId: user.id,
        userRole: user.role,
        reason,
      });

      if (result.isFailure) {
        const error = result.getError();
        if (error.includes('não encontrado')) return this.notFound(res, error);
        if (error.includes('Acesso negado')) return this.forbidden(res, error);
        return this.badRequest(res, error);
      }

      return this.ok(res, result.getValue());
    } catch (error: any) {
      return this.serverError(res, error.message || 'Erro ao cancelar pedido.');
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      if (!user) {
        return this.unauthorized(res, 'Não autenticado.');
      }

      const { id } = req.params;
      const { action } = req.body;

      const result = await this.updateOrderStatusUseCase.execute({
        orderId: id,
        userId: user.id,
        userRole: user.role,
        action,
      });

      if (result.isFailure) {
        const error = result.getError();
        if (error.includes('não encontrado')) return this.notFound(res, error);
        if (error.includes('Acesso negado')) return this.forbidden(res, error);
        return this.badRequest(res, error);
      }

      return this.ok(res, result.getValue().toJSON());
    } catch (error: any) {
      return this.serverError(res, error.message || 'Erro ao atualizar status do pedido.');
    }
  }
}
