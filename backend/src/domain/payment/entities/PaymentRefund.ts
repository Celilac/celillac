// backend/src/domain/payment/entities/PaymentRefund.ts
import { Entity } from '../../Entity';
import { Result } from '../../Result';

export interface PaymentRefundProps {
  paymentId: string;
  gatewayRefundId?: string;
  refundAmount: number;
  reason: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

export class PaymentRefund extends Entity<PaymentRefundProps> {
  private constructor(props: PaymentRefundProps, id?: string) {
    super(props, id);
  }

  get paymentId(): string { return this.props.paymentId; }
  get gatewayRefundId(): string | undefined { return this.props.gatewayRefundId; }
  get refundAmount(): number { return this.props.refundAmount; }
  get reason(): string { return this.props.reason; }
  get status(): 'PENDING' | 'COMPLETED' | 'FAILED' { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }

  public static create(
    props: Omit<PaymentRefundProps, 'createdAt' | 'status'> & {
      status?: 'PENDING' | 'COMPLETED' | 'FAILED';
      createdAt?: Date;
    },
    id?: string
  ): Result<PaymentRefund> {
    if (!props.paymentId || props.paymentId.trim() === '') {
      return Result.fail<PaymentRefund>('O ID do pagamento é obrigatório para estorno.');
    }
    if (props.refundAmount <= 0) {
      return Result.fail<PaymentRefund>('O valor do estorno deve ser maior que zero.');
    }
    if (!props.reason || props.reason.trim() === '') {
      return Result.fail<PaymentRefund>('O motivo do estorno é obrigatório.');
    }

    const refund = new PaymentRefund(
      {
        ...props,
        status: props.status || 'PENDING',
        createdAt: props.createdAt || new Date(),
      },
      id
    );

    return Result.ok<PaymentRefund>(refund);
  }

  public complete(gatewayRefundId: string): void {
    this.props.status = 'COMPLETED';
    this.props.gatewayRefundId = gatewayRefundId;
  }

  public fail(): void {
    this.props.status = 'FAILED';
  }
}
