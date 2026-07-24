// backend/src/interfaces/http/controllers/partner/PartnerController.ts
import { Request, Response } from 'express';
import { BaseController } from '../BaseController';
import { RegisterPartnerUseCase } from '../../../../application/partner/RegisterPartnerUseCase';
import { GetPartnerUseCase } from '../../../../application/partner/GetPartnerUseCase';
import { ApprovePartnerUseCase } from '../../../../application/partner/ApprovePartnerUseCase';
import { SubmitPartnerForReviewUseCase } from '../../../../application/partner/SubmitPartnerForReviewUseCase';
import { UpdatePartnerUseCase } from '../../../../application/partner/UpdatePartnerUseCase';
import { RejectPartnerUseCase } from '../../../../application/partner/RejectPartnerUseCase';
import { SuspendPartnerUseCase } from '../../../../application/partner/SuspendPartnerUseCase';
import { ReactivatePartnerUseCase } from '../../../../application/partner/ReactivatePartnerUseCase';
import { UpdatePartnerOperationalStatusUseCase } from '../../../../application/partner/UpdatePartnerOperationalStatusUseCase';
import { ListUserPartnersUseCase } from '../../../../application/partner/ListUserPartnersUseCase';
import { ListAdminPartnersUseCase } from '../../../../application/partner/ListAdminPartnersUseCase';
import { ListPublicPartnersUseCase } from '../../../../application/partner/ListPublicPartnersUseCase';

export class PartnerController extends BaseController {
  constructor(
    private readonly registerPartnerUseCase: RegisterPartnerUseCase,
    private readonly getPartnerUseCase: GetPartnerUseCase,
    private readonly approvePartnerUseCase: ApprovePartnerUseCase,
    private readonly submitPartnerForReviewUseCase: SubmitPartnerForReviewUseCase,
    private readonly updatePartnerUseCase: UpdatePartnerUseCase,
    private readonly rejectPartnerUseCase: RejectPartnerUseCase,
    private readonly suspendPartnerUseCase: SuspendPartnerUseCase,
    private readonly reactivatePartnerUseCase: ReactivatePartnerUseCase,
    private readonly updatePartnerOperationalStatusUseCase: UpdatePartnerOperationalStatusUseCase,
    private readonly listUserPartnersUseCase: ListUserPartnersUseCase,
    private readonly listAdminPartnersUseCase: ListAdminPartnersUseCase,
    private readonly listPublicPartnersUseCase: ListPublicPartnersUseCase
  ) {
    super();
  }

  // Fallback obrigatório pela herança de BaseController, mas não usado diretamente
  protected async executeImpl(req: Request, res: Response): Promise<void> {
    this.badRequest(res, 'Método HTTP não especificado.');
  }

  async register(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { name, cnpj, description, address, phone, type, city, state, deliveryRegion } = req.body;

    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
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
      city,
      state,
      deliveryRegion,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.created(res, result.getValue());
  }

  async update(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, cnpj, description, address, phone, type, city, state, deliveryRegion } = req.body;

    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.updatePartnerUseCase.execute({
      partnerId: id,
      userId,
      name,
      cnpj,
      description,
      address,
      phone,
      type,
      city,
      state,
      deliveryRegion,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res);
  }

  async submitForReview(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.submitPartnerForReviewUseCase.execute({
      partnerId: id,
      userId,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res);
  }

  async updateOperationalStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.updatePartnerOperationalStatusUseCase.execute({
      partnerId: id,
      userId,
      status,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res);
  }

  async approve(req: Request, res: Response): Promise<void> {
    const adminUserId = req.user?.id;
    const { id } = req.params;

    if (!adminUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.approvePartnerUseCase.execute({
      partnerId: id,
      adminUserId,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res);
  }

  async reject(req: Request, res: Response): Promise<void> {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!adminUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.rejectPartnerUseCase.execute({
      partnerId: id,
      adminUserId,
      reason,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res);
  }

  async suspend(req: Request, res: Response): Promise<void> {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!adminUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.suspendPartnerUseCase.execute({
      partnerId: id,
      adminUserId,
      reason,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res);
  }

  async reactivate(req: Request, res: Response): Promise<void> {
    const adminUserId = req.user?.id;
    const { id } = req.params;

    if (!adminUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.reactivatePartnerUseCase.execute({
      partnerId: id,
      adminUserId,
    });

    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res);
  }

  async getPartner(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const result = await this.getPartnerUseCase.execute({ partnerId: id });
    if (result.isFailure) {
      this.notFound(res, result.getError());
      return;
    }
    this.ok(res, result.getValue());
  }

  async listUserPartners(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.listUserPartnersUseCase.execute({ userId });
    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res, result.getValue());
  }

  async listAdminPartners(req: Request, res: Response): Promise<void> {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      this.unauthorized(res, 'Usuário não autenticado.');
      return;
    }

    const result = await this.listAdminPartnersUseCase.execute({ adminUserId });
    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res, result.getValue());
  }

  async listPublicPartners(req: Request, res: Response): Promise<void> {
    const result = await this.listPublicPartnersUseCase.execute();
    if (result.isFailure) {
      this.badRequest(res, result.getError());
      return;
    }
    this.ok(res, result.getValue());
  }
}
