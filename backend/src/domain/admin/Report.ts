// backend/src/domain/admin/Report.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { ReportStatus } from './value-objects/ReportStatus';
import { ReportReason } from './value-objects/ReportReason';

export interface ReportProps {
  reporterId: string;
  productId?: string;
  partnerId?: string;
  reason: ReportReason;
  details?: string;
  isFoodSafetyRisk: boolean;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report — Entidade que representa uma denúncia de um produto ou parceiro comercial.
 * Raiz de agregado do contexto de Administração.
 */
export class Report extends Entity<ReportProps> {
  private constructor(props: ReportProps, id?: string) {
    super(props, id);
  }

  get reporterId(): string {
    return this.props.reporterId;
  }

  get productId(): string | undefined {
    return this.props.productId;
  }

  get partnerId(): string | undefined {
    return this.props.partnerId;
  }

  get reason(): ReportReason {
    return this.props.reason;
  }

  get details(): string | undefined {
    return this.props.details;
  }

  get isFoodSafetyRisk(): boolean {
    return this.props.isFoodSafetyRisk;
  }

  get status(): ReportStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Altera o status da denúncia.
   * Regra de negócio: Não é possível reabrir uma denúncia já fechada (RESOLVED/DISMISSED).
   */
  changeStatus(newStatus: ReportStatus): Result<void> {
    if (this.props.status === ReportStatus.RESOLVED || this.props.status === ReportStatus.DISMISSED) {
      return Result.fail('Cannot change status of a closed report.');
    }
    
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined as void);
  }

  static create(
    props: Omit<ReportProps, 'status' | 'createdAt' | 'updatedAt' | 'isFoodSafetyRisk'> &
      Partial<Pick<ReportProps, 'status' | 'createdAt' | 'updatedAt' | 'isFoodSafetyRisk'>>, 
    id?: string
  ): Result<Report> {
    if (!props.reporterId || props.reporterId.trim() === '') {
      return Result.fail<Report>('Reporter ID is required.');
    }

    const hasProduct = !!props.productId && props.productId.trim() !== '';
    const hasPartner = !!props.partnerId && props.partnerId.trim() !== '';

    if (!hasProduct && !hasPartner) {
      return Result.fail<Report>('Product ID or Partner ID is required.');
    }
    
    if (!Object.values(ReportReason).includes(props.reason)) {
      return Result.fail<Report>(`Invalid report reason: ${props.reason}`);
    }
    
    const status = props.status ?? ReportStatus.PENDING;
    if (!Object.values(ReportStatus).includes(status)) {
      return Result.fail<Report>(`Invalid report status: ${status}`);
    }

    // Determina automaticamente o risco alimentar com base no motivo se não for explicitamente informado
    const isFoodSafetyRisk =
      props.isFoodSafetyRisk ??
      (props.reason === ReportReason.MISSING_ALLERGEN ||
        props.reason === ReportReason.WRONG_CROSS_CONTAMINATION);

    const report = new Report({
      reporterId: props.reporterId.trim(),
      productId: hasProduct ? props.productId?.trim() : undefined,
      partnerId: hasPartner ? props.partnerId?.trim() : undefined,
      reason: props.reason,
      details: props.details,
      isFoodSafetyRisk,
      status,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    }, id);

    return Result.ok<Report>(report);
  }
}
