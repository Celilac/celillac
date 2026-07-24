// backend/src/domain/partner/Partner.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export enum PartnerType {
  RESTAURANT           = 'RESTAURANT',
  MARKET               = 'MARKET',
  INDEPENDENT_PRODUCER = 'INDEPENDENT_PRODUCER',
}

export enum PartnerApprovalStatus {
  DRAFT          = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED       = 'APPROVED',
  REJECTED       = 'REJECTED',
  SUSPENDED      = 'SUSPENDED',
}

export enum PartnerOperationalStatus {
  ACTIVE             = 'ACTIVE',
  INACTIVE           = 'INACTIVE',
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED',
}

export interface PartnerProps {
  userId:             string;
  name:               string;
  cnpj?:              string;
  description:        string;
  address:            string;
  phone:              string;
  type:               PartnerType;
  approvalStatus?:    PartnerApprovalStatus;
  operationalStatus?: PartnerOperationalStatus;
  rejectionReason?:   string;
  suspensionReason?:  string;
  city?:              string;
  state?:             string;
  deliveryRegion?:    string;
}

/**
 * Partner — Entidade raiz do Bounded Context de Catálogo de Parceiros.
 * Mapeia estabelecimentos no ecossistema CeLiLac.
 */
export class Partner extends Entity<PartnerProps> {
  private constructor(props: PartnerProps, id?: string) {
    super(props, id);
  }

  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get cnpj(): string | undefined { return this.props.cnpj; }
  get description(): string { return this.props.description; }
  get address(): string { return this.props.address; }
  get phone(): string { return this.props.phone; }
  get type(): PartnerType { return this.props.type; }
  get approvalStatus(): PartnerApprovalStatus { return this.props.approvalStatus || PartnerApprovalStatus.DRAFT; }
  get operationalStatus(): PartnerOperationalStatus { return this.props.operationalStatus || PartnerOperationalStatus.INACTIVE; }
  get rejectionReason(): string | undefined { return this.props.rejectionReason; }
  get suspensionReason(): string | undefined { return this.props.suspensionReason; }
  get city(): string | undefined { return this.props.city; }
  get state(): string | undefined { return this.props.state; }
  get deliveryRegion(): string | undefined { return this.props.deliveryRegion; }

  // Compatibilidade retroativa para código legado
  get isActive(): boolean {
    return this.approvalStatus === PartnerApprovalStatus.APPROVED &&
           this.operationalStatus === PartnerOperationalStatus.ACTIVE;
  }

  activate(): void {
    this.props.approvalStatus = PartnerApprovalStatus.APPROVED;
    this.props.operationalStatus = PartnerOperationalStatus.ACTIVE;
    this.props.rejectionReason = undefined;
    this.props.suspensionReason = undefined;
  }

  inactivate(): void {
    this.props.operationalStatus = PartnerOperationalStatus.INACTIVE;
  }

  submitForReview(): Result<void> {
    if (this.approvalStatus !== PartnerApprovalStatus.DRAFT && this.approvalStatus !== PartnerApprovalStatus.REJECTED) {
      return Result.fail<void>('O parceiro só pode ser submetido para revisão a partir do estado de Rascunho ou Rejeitado.');
    }
    if (!this.props.name || this.props.name.trim().length === 0) {
      return Result.fail<void>('O nome comercial do parceiro é obrigatório.');
    }
    if (!this.props.address || this.props.address.trim().length === 0) {
      return Result.fail<void>('O endereço do parceiro é obrigatório.');
    }
    if (!this.props.phone || this.props.phone.trim().length === 0) {
      return Result.fail<void>('O telefone de contato é obrigatório.');
    }
    this.props.approvalStatus = PartnerApprovalStatus.PENDING_REVIEW;
    return Result.ok<void>(undefined);
  }

  approve(): Result<void> {
    if (this.approvalStatus !== PartnerApprovalStatus.PENDING_REVIEW) {
      return Result.fail<void>('Apenas parceiros pendentes de revisão podem ser aprovados.');
    }
    this.props.approvalStatus = PartnerApprovalStatus.APPROVED;
    this.props.rejectionReason = undefined;
    this.props.suspensionReason = undefined;
    return Result.ok<void>(undefined);
  }

  reject(reason: string): Result<void> {
    if (this.approvalStatus !== PartnerApprovalStatus.PENDING_REVIEW) {
      return Result.fail<void>('Apenas parceiros pendentes de revisão podem ser rejeitados.');
    }
    if (!reason || reason.trim().length === 0) {
      return Result.fail<void>('É obrigatório informar o motivo da rejeição.');
    }
    this.props.approvalStatus = PartnerApprovalStatus.REJECTED;
    this.props.rejectionReason = reason.trim();
    return Result.ok<void>(undefined);
  }

  suspend(reason: string): Result<void> {
    if (this.approvalStatus !== PartnerApprovalStatus.APPROVED) {
      return Result.fail<void>('Apenas parceiros aprovados podem ser suspensos.');
    }
    if (!reason || reason.trim().length === 0) {
      return Result.fail<void>('É obrigatório informar o motivo da suspensão.');
    }
    this.props.approvalStatus = PartnerApprovalStatus.SUSPENDED;
    this.props.suspensionReason = reason.trim();
    this.props.operationalStatus = PartnerOperationalStatus.INACTIVE;
    return Result.ok<void>(undefined);
  }

  reactivate(): Result<void> {
    if (this.approvalStatus !== PartnerApprovalStatus.SUSPENDED) {
      return Result.fail<void>('Apenas parceiros suspensos podem ser reativados.');
    }
    this.props.approvalStatus = PartnerApprovalStatus.APPROVED;
    this.props.suspensionReason = undefined;
    return Result.ok<void>(undefined);
  }

  updateOperationalStatus(status: PartnerOperationalStatus): Result<void> {
    if (this.approvalStatus === PartnerApprovalStatus.SUSPENDED) {
      return Result.fail<void>('Parceiros suspensos não podem ter seu status operacional alterado.');
    }
    if (!Object.values(PartnerOperationalStatus).includes(status)) {
      return Result.fail<void>('Status operacional inválido.');
    }
    this.props.operationalStatus = status;
    return Result.ok<void>(undefined);
  }

  updateDetails(details: Partial<Omit<PartnerProps, 'userId' | 'approvalStatus' | 'operationalStatus' | 'rejectionReason' | 'suspensionReason'>>): Result<void> {
    const criticalFields: Array<keyof typeof details> = ['name', 'type', 'cnpj', 'address', 'phone', 'city', 'state'];
    let changedCritical = false;

    for (const key of criticalFields) {
      if (details[key] !== undefined && details[key] !== this.props[key]) {
        changedCritical = true;
        break;
      }
    }

    if (details.name !== undefined) {
      if (details.name.trim().length === 0) {
        return Result.fail<void>('O nome comercial do parceiro é obrigatório.');
      }
      this.props.name = details.name.trim();
    }
    if (details.type !== undefined) {
      if (!Object.values(PartnerType).includes(details.type)) {
        return Result.fail<void>('Tipo de parceiro inválido ou não informado.');
      }
      this.props.type = details.type;
    }
    if (details.cnpj !== undefined) {
      if (details.cnpj && details.cnpj.trim().length > 0) {
        const cleanCnpj = details.cnpj.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) {
          return Result.fail<void>('CNPJ inválido (deve conter 14 dígitos).');
        }
        this.props.cnpj = details.cnpj.trim();
      } else {
        this.props.cnpj = undefined;
      }
    }
    if (details.address !== undefined) {
      if (details.address.trim().length === 0) {
        return Result.fail<void>('O endereço do parceiro é obrigatório.');
      }
      this.props.address = details.address.trim();
    }
    if (details.phone !== undefined) {
      this.props.phone = details.phone.trim();
    }
    if (details.description !== undefined) {
      this.props.description = details.description.trim();
    }
    if (details.city !== undefined) {
      this.props.city = details.city.trim();
    }
    if (details.state !== undefined) {
      this.props.state = details.state.trim();
    }
    if (details.deliveryRegion !== undefined) {
      this.props.deliveryRegion = details.deliveryRegion.trim();
    }

    if (changedCritical && this.approvalStatus === PartnerApprovalStatus.APPROVED) {
      this.props.approvalStatus = PartnerApprovalStatus.PENDING_REVIEW;
    }

    return Result.ok<void>(undefined);
  }

  static create(props: PartnerProps, id?: string): Result<Partner> {
    if (!props.userId) {
      return Result.fail<Partner>('O ID de usuário do dono é obrigatório.');
    }
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Partner>('O nome comercial do parceiro é obrigatório.');
    }
    if (props.cnpj && props.cnpj.trim().length > 0) {
      const cleanCnpj = props.cnpj.replace(/\D/g, '');
      if (cleanCnpj.length !== 14) {
        return Result.fail<Partner>('CNPJ inválido (deve conter 14 dígitos).');
      }
    }
    if (!props.address || props.address.trim().length === 0) {
      return Result.fail<Partner>('O endereço do parceiro é obrigatório.');
    }
    if (!props.type || !Object.values(PartnerType).includes(props.type)) {
      return Result.fail<Partner>('Tipo de parceiro inválido ou não informado.');
    }

    return Result.ok<Partner>(
      new Partner(
        {
          userId:            props.userId,
          name:              props.name.trim(),
          cnpj:              props.cnpj ? props.cnpj.trim() : undefined,
          description:       (props.description || '').trim(),
          address:           props.address.trim(),
          phone:             (props.phone || '').trim(),
          type:              props.type,
          approvalStatus:    props.approvalStatus || PartnerApprovalStatus.DRAFT,
          operationalStatus: props.operationalStatus || PartnerOperationalStatus.INACTIVE,
          rejectionReason:   props.rejectionReason,
          suspensionReason:  props.suspensionReason,
          city:              props.city ? props.city.trim() : undefined,
          state:             props.state ? props.state.trim() : undefined,
          deliveryRegion:    props.deliveryRegion ? props.deliveryRegion.trim() : undefined,
        },
        id
      )
    );
  }
}
