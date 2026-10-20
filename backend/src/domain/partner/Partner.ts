// backend/src/domain/partner/Partner.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { Cnpj } from './value-objects/Cnpj';
import { Cpf } from './value-objects/Cpf';

export enum PartnerType {
  RESTAURANT = 'RESTAURANT',
  MARKET = 'MARKET',
  INDEPENDENT_PRODUCER = 'INDEPENDENT_PRODUCER',
}

export enum PartnerApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum PartnerOperationalStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED',
}

export type LegalNature = 'PJ' | 'PF';
export type DocumentType = 'CNPJ' | 'CPF';

export interface PartnerProps {
  userId: string;
  name: string;
  cnpj?: string;
  legalNature?: LegalNature;
  documentNumber?: string;
  documentType?: DocumentType;
  documentUrl?: string;
  companyName?: string;
  responsibleName?: string;
  description: string;
  address: string;
  phone: string;
  type: PartnerType;
  approvalStatus?: PartnerApprovalStatus;
  operationalStatus?: PartnerOperationalStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  city?: string;
  state?: string;
  deliveryRegion?: string;
  logoUrl?: string;
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
  get legalNature(): LegalNature { return this.props.legalNature || 'PJ'; }
  get documentNumber(): string | undefined { return this.props.documentNumber || this.props.cnpj; }
  get documentType(): DocumentType { return this.props.documentType || (this.props.legalNature === 'PF' ? 'CPF' : 'CNPJ'); }
  get documentUrl(): string | undefined { return this.props.documentUrl; }
  get companyName(): string | undefined { return this.props.companyName; }
  get responsibleName(): string | undefined { return this.props.responsibleName; }
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
  get logoUrl(): string | undefined { return this.props.logoUrl; }

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
    this.props.operationalStatus = PartnerOperationalStatus.ACTIVE;
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
    this.props.operationalStatus = PartnerOperationalStatus.ACTIVE;
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
    const criticalFields: Array<keyof typeof details> = [
      'name', 'type', 'cnpj', 'address', 'phone', 'city', 'state',
      'legalNature', 'documentNumber', 'companyName', 'responsibleName'
    ];
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
    if (details.legalNature !== undefined) {
      if (details.legalNature !== 'PJ' && details.legalNature !== 'PF') {
        return Result.fail<void>('Natureza jurídica inválida. Deve ser PJ ou PF.');
      }
      this.props.legalNature = details.legalNature;
    }

    // Validação de documento (CPF ou CNPJ de acordo com a natureza)
    const effectiveNature = details.legalNature || this.props.legalNature || 'PJ';
    const rawDoc = details.documentNumber !== undefined ? details.documentNumber : details.cnpj;

    if (rawDoc !== undefined) {
      if (effectiveNature === 'PF') {
        const cpfResult = Cpf.create(rawDoc);
        if (cpfResult.isFailure) {
          return Result.fail<void>(cpfResult.getError());
        }
        const validCpf = cpfResult.getValue();
        this.props.documentNumber = validCpf ? validCpf.formatted : undefined;
        this.props.documentType = 'CPF';
      } else {
        const cnpjResult = Cnpj.create(rawDoc);
        if (cnpjResult.isFailure) {
          return Result.fail<void>(cnpjResult.getError());
        }
        const validCnpj = cnpjResult.getValue();
        this.props.cnpj = validCnpj ? validCnpj.formatted : undefined;
        this.props.documentNumber = validCnpj ? validCnpj.formatted : undefined;
        this.props.documentType = 'CNPJ';
      }
    }

    if (details.companyName !== undefined) {
      this.props.companyName = details.companyName && details.companyName.trim().length > 0 ? details.companyName.trim() : undefined;
    }
    if (details.responsibleName !== undefined) {
      this.props.responsibleName = details.responsibleName && details.responsibleName.trim().length > 0 ? details.responsibleName.trim() : undefined;
    }
    if (details.documentUrl !== undefined) {
      this.props.documentUrl = details.documentUrl && details.documentUrl.trim().length > 0 ? details.documentUrl.trim() : undefined;
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
    if (details.logoUrl !== undefined) {
      this.props.logoUrl = details.logoUrl && details.logoUrl.trim().length > 0 ? details.logoUrl.trim() : undefined;
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
    if (!props.address || props.address.trim().length === 0) {
      return Result.fail<Partner>('O endereço do parceiro é obrigatório.');
    }
    if (!props.type || !Object.values(PartnerType).includes(props.type)) {
      return Result.fail<Partner>('Tipo de parceiro inválido ou não informado.');
    }

    const legalNature = props.legalNature || 'PJ';
    let formattedDoc: string | undefined;
    let formattedCnpj: string | undefined;
    let documentType: DocumentType = legalNature === 'PF' ? 'CPF' : 'CNPJ';

    const inputDoc = props.documentNumber !== undefined ? props.documentNumber : props.cnpj;

    if (inputDoc !== undefined) {
      if (legalNature === 'PF') {
        const cpfResult = Cpf.create(inputDoc);
        if (cpfResult.isFailure) {
          return Result.fail<Partner>(cpfResult.getError());
        }
        const validCpf = cpfResult.getValue();
        formattedDoc = validCpf ? validCpf.formatted : undefined;
        documentType = 'CPF';
      } else {
        const cnpjResult = Cnpj.create(inputDoc);
        if (cnpjResult.isFailure) {
          return Result.fail<Partner>(cnpjResult.getError());
        }
        const validCnpj = cnpjResult.getValue();
        formattedCnpj = validCnpj ? validCnpj.formatted : undefined;
        formattedDoc = formattedCnpj;
        documentType = 'CNPJ';
      }
    }

    return Result.ok<Partner>(
      new Partner(
        {
          userId: props.userId,
          name: props.name.trim(),
          cnpj: formattedCnpj,
          legalNature,
          documentNumber: formattedDoc,
          documentType,
          documentUrl: props.documentUrl ? props.documentUrl.trim() : undefined,
          companyName: props.companyName ? props.companyName.trim() : undefined,
          responsibleName: props.responsibleName ? props.responsibleName.trim() : undefined,
          description: (props.description || '').trim(),
          address: props.address.trim(),
          phone: (props.phone || '').trim(),
          type: props.type,
          approvalStatus: props.approvalStatus || PartnerApprovalStatus.DRAFT,
          operationalStatus: props.operationalStatus || PartnerOperationalStatus.INACTIVE,
          rejectionReason: props.rejectionReason,
          suspensionReason: props.suspensionReason,
          city: props.city ? props.city.trim() : undefined,
          state: props.state ? props.state.trim() : undefined,
          deliveryRegion: props.deliveryRegion ? props.deliveryRegion.trim() : undefined,
          logoUrl: props.logoUrl ? props.logoUrl.trim() : undefined,
        },
        id
      )
    );
  }

  /**
   * Reconstitui um Partner a partir da persistência (PostgreSQL).
   * Tolera dados legados sem quebrar consultas.
   */
  static reconstitute(props: PartnerProps, id: string): Partner {
    const legalNature = props.legalNature || 'PJ';
    let formattedDoc = props.documentNumber || props.cnpj;
    let formattedCnpj = props.cnpj;
    let documentType: DocumentType = props.documentType || (legalNature === 'PF' ? 'CPF' : 'CNPJ');

    if (props.documentNumber || props.cnpj) {
      const raw = props.documentNumber || props.cnpj;
      if (legalNature === 'PF') {
        const cpfResult = Cpf.create(raw);
        if (cpfResult.isSuccess) {
          const validCpf = cpfResult.getValue();
          formattedDoc = validCpf ? validCpf.formatted : formattedDoc;
        }
        documentType = 'CPF';
      } else {
        const cnpjResult = Cnpj.create(raw);
        if (cnpjResult.isSuccess) {
          const validCnpj = cnpjResult.getValue();
          formattedCnpj = validCnpj ? validCnpj.formatted : formattedCnpj;
          formattedDoc = formattedCnpj;
        }
        documentType = 'CNPJ';
      }
    }

    return new Partner(
      {
        userId: props.userId,
        name: (props.name || '').trim(),
        cnpj: formattedCnpj,
        legalNature,
        documentNumber: formattedDoc,
        documentType,
        documentUrl: props.documentUrl ? props.documentUrl.trim() : undefined,
        companyName: props.companyName ? props.companyName.trim() : undefined,
        responsibleName: props.responsibleName ? props.responsibleName.trim() : undefined,
        description: (props.description || '').trim(),
        address: (props.address || '').trim(),
        phone: (props.phone || '').trim(),
        type: props.type,
        approvalStatus: props.approvalStatus || PartnerApprovalStatus.DRAFT,
        operationalStatus: props.operationalStatus || PartnerOperationalStatus.INACTIVE,
        rejectionReason: props.rejectionReason,
        suspensionReason: props.suspensionReason,
        city: props.city ? props.city.trim() : undefined,
        state: props.state ? props.state.trim() : undefined,
        deliveryRegion: props.deliveryRegion ? props.deliveryRegion.trim() : undefined,
        logoUrl: props.logoUrl ? props.logoUrl.trim() : undefined,
      },
      id
    );
  }
}

