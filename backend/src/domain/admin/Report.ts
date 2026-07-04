// backend/src/domain/admin/Report.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { ReportStatus } from './value-objects/ReportStatus';
import { ReportReason } from './value-objects/ReportReason';

export interface ReportProps {
  reporterId: string;
  productId: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report — Entidade que representa uma denúncia de um produto.
 * Raiz de agregado do contexto de Administração.
 */
export class Report extends Entity<ReportProps> {
  private constructor(props: ReportProps, id?: string) {
    super(props, id);
  }

  get reporterId(): string {
    return this.props.reporterId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get reason(): ReportReason {
    return this.props.reason;
  }

  get details(): string | undefined {
    return this.props.details;
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
    props: Omit<ReportProps, 'status' | 'createdAt' | 'updatedAt'> & Partial<Pick<ReportProps, 'status' | 'createdAt' | 'updatedAt'>>, 
    id?: string
  ): Result<Report> {
    if (!props.reporterId) return Result.fail<Report>('Reporter ID is required.');
    if (!props.productId) return Result.fail<Report>('Product ID is required.');
    
    if (!Object.values(ReportReason).includes(props.reason)) {
      return Result.fail<Report>(`Invalid report reason: ${props.reason}`);
    }
    
    const status = props.status ?? ReportStatus.PENDING;
    if (!Object.values(ReportStatus).includes(status)) {
      return Result.fail<Report>(`Invalid report status: ${status}`);
    }

    const report = new Report({
      ...props,
      status,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    }, id);

    return Result.ok<Report>(report);
  }
}
