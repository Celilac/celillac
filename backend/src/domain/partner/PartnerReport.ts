// backend/src/domain/partner/PartnerReport.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { ReportStatus } from '../admin/value-objects/ReportStatus';

export interface PartnerReportProps {
  reporterId: string;
  partnerId: string;
  reason: string;
  details?: string;
  isFoodSafetyRisk?: boolean;
  status?: ReportStatus;
  createdAt?: Date;
}

export class PartnerReport extends Entity<PartnerReportProps> {
  private constructor(props: PartnerReportProps, id?: string) {
    super(
      {
        ...props,
        isFoodSafetyRisk: props.isFoodSafetyRisk ?? false,
        status: props.status || ReportStatus.PENDING,
        createdAt: props.createdAt || new Date(),
      },
      id,
    );
  }

  get reporterId(): string {
    return this.props.reporterId;
  }

  get partnerId(): string {
    return this.props.partnerId;
  }

  get reason(): string {
    return this.props.reason;
  }

  get details(): string | undefined {
    return this.props.details;
  }

  get isFoodSafetyRisk(): boolean {
    return !!this.props.isFoodSafetyRisk;
  }

  get status(): ReportStatus {
    return this.props.status || ReportStatus.PENDING;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  static create(props: PartnerReportProps, id?: string): Result<PartnerReport> {
    if (!props.reporterId || props.reporterId.trim().length === 0) {
      return Result.fail<PartnerReport>('O reporterId não pode ser vazio.');
    }
    if (!props.partnerId || props.partnerId.trim().length === 0) {
      return Result.fail<PartnerReport>('O partnerId não pode ser vazio.');
    }
    if (!props.reason || props.reason.trim().length === 0) {
      return Result.fail<PartnerReport>('O motivo da denúncia não pode ser vazio.');
    }
    return Result.ok<PartnerReport>(new PartnerReport(props, id));
  }
}
