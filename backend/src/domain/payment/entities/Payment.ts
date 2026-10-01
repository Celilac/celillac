// backend/src/domain/payment/entities/Payment.ts
import { Entity } from '../../Entity';
import { Result } from '../../Result';
import { PaymentMethod, PaymentStatus, SplitCalculator } from '../value-objects/PaymentStatus';

export interface PaymentProps {
  orderId: string;
  consumerId: string;
  partnerId: string;
  gateway: string;
  gatewayTransactionId?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  grossAmount: number;
  netPartnerAmount: number;
  platformFeeAmount: number;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpiresAt?: Date;
  paidAt?: Date;
  failureReason?: string;
  idempotencyKey?: string;
  changeFor?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInputProps {
  orderId: string;
  consumerId: string;
  partnerId: string;
  gateway?: string;
  gatewayTransactionId?: string;
  method: PaymentMethod;
  subtotalAmount: number;
  deliveryFee?: number;
  platformFeeRate?: number;
  status?: PaymentStatus;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpiresAt?: Date;
  paidAt?: Date;
  failureReason?: string;
  idempotencyKey?: string;
  changeFor?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Payment extends Entity<PaymentProps> {
  private constructor(props: PaymentProps, id?: string) {
    super(props, id);
  }

  get orderId(): string { return this.props.orderId; }
  get consumerId(): string { return this.props.consumerId; }
  get partnerId(): string { return this.props.partnerId; }
  get gateway(): string { return this.props.gateway; }
  get gatewayTransactionId(): string | undefined { return this.props.gatewayTransactionId; }
  get method(): PaymentMethod { return this.props.method; }
  get status(): PaymentStatus { return this.props.status; }
  get grossAmount(): number { return this.props.grossAmount; }
  get netPartnerAmount(): number { return this.props.netPartnerAmount; }
  get platformFeeAmount(): number { return this.props.platformFeeAmount; }
  get pixQrCode(): string | undefined { return this.props.pixQrCode; }
  get pixCopyPaste(): string | undefined { return this.props.pixCopyPaste; }
  get pixExpiresAt(): Date | undefined { return this.props.pixExpiresAt; }
  get paidAt(): Date | undefined { return this.props.paidAt; }
  get failureReason(): string | undefined { return this.props.failureReason; }
  get idempotencyKey(): string | undefined { return this.props.idempotencyKey; }
  get changeFor(): number | undefined { return this.props.changeFor; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public static create(props: CreatePaymentInputProps, id?: string): Result<Payment> {
    if (!props.orderId || props.orderId.trim() === '') {
      return Result.fail<Payment>('O ID do pedido é obrigatório.');
    }
    if (!props.consumerId || props.consumerId.trim() === '') {
      return Result.fail<Payment>('O ID do consumidor é obrigatório.');
    }
    if (!props.partnerId || props.partnerId.trim() === '') {
      return Result.fail<Payment>('O ID do parceiro é obrigatório.');
    }
    if (props.subtotalAmount <= 0) {
      return Result.fail<Payment>('O valor subtotal deve ser maior que zero.');
    }

    const split = SplitCalculator.calculate(
      props.subtotalAmount,
      props.deliveryFee ?? 0,
      props.platformFeeRate
    );

    const payment = new Payment(
      {
        orderId: props.orderId,
        consumerId: props.consumerId,
        partnerId: props.partnerId,
        gateway: props.gateway || 'ASAAS',
        gatewayTransactionId: props.gatewayTransactionId,
        method: props.method,
        status: props.status || PaymentStatus.PENDING,
        grossAmount: split.grossAmount,
        netPartnerAmount: split.netPartnerAmount,
        platformFeeAmount: split.platformFeeAmount,
        pixQrCode: props.pixQrCode,
        pixCopyPaste: props.pixCopyPaste,
        pixExpiresAt: props.pixExpiresAt,
        paidAt: props.paidAt,
        failureReason: props.failureReason,
        idempotencyKey: props.idempotencyKey,
        changeFor: props.changeFor ? Number(props.changeFor) : undefined,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id
    );

    return Result.ok<Payment>(payment);
  }

  public static reconstitute(props: PaymentProps, id: string): Payment {
    return new Payment(props, id);
  }

  public setGatewayTransactionId(id: string): void {
    this.props.gatewayTransactionId = id;
    this.props.updatedAt = new Date();
  }

  public setPixDetails(qrCode: string, copyPaste: string, expiresAt: Date): void {
    this.props.pixQrCode = qrCode;
    this.props.pixCopyPaste = copyPaste;
    this.props.pixExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  public markAsPaid(paidAt: Date = new Date()): Result<void> {
    if (this.props.status === PaymentStatus.PAID) {
      return Result.ok<void>(undefined); // idempotente
    }
    if (this.props.status === PaymentStatus.REFUNDED) {
      return Result.fail<void>('Não é possível marcar como pago um pagamento já estornado.');
    }
    this.props.status = PaymentStatus.PAID;
    this.props.paidAt = paidAt;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public markAsFailed(reason: string): Result<void> {
    if (this.props.status === PaymentStatus.PAID) {
      return Result.fail<void>('Não é possível falhar um pagamento já confirmado.');
    }
    this.props.status = PaymentStatus.FAILED;
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public markAsRefunded(): Result<void> {
    if (this.props.status !== PaymentStatus.PAID) {
      return Result.fail<void>('Apenas pagamentos confirmados podem ser marcados como estornados.');
    }
    this.props.status = PaymentStatus.REFUNDED;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  /**
   * Zera a cobrança de taxa de intermediação CeLiLac quando a entrega
   * falha por ausência ou recusa de pagamento do cliente.
   */
  public waivePlatformFee(): void {
    this.props.platformFeeAmount = 0;
    this.props.netPartnerAmount = this.props.grossAmount;
    this.props.updatedAt = new Date();
  }
}
