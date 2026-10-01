// backend/src/domain/order/entities/Order.ts
import { Entity } from '../../Entity';
import { Result } from '../../Result';
import { OrderItem } from './OrderItem';
import { OrderCancellationPolicy, OrderStatus } from '../value-objects/OrderStatus';

export interface OrderProps {
  consumerId: string;
  partnerId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  allergenCheckVerdict: 'SAFE' | 'WARNING';
  notes?: string;
  paymentMethod?: string;
  changeFor?: number;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInputProps {
  consumerId: string;
  partnerId: string;
  items: OrderItem[];
  deliveryFee?: number;
  allergenCheckVerdict: 'SAFE' | 'WARNING';
  notes?: string;
  paymentMethod?: string;
  changeFor?: number;
  status?: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

export class Order extends Entity<OrderProps> {
  private constructor(props: OrderProps, id?: string) {
    super(props, id);
  }

  get consumerId(): string {
    return this.props.consumerId;
  }

  get partnerId(): string {
    return this.props.partnerId;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get items(): OrderItem[] {
    return [...this.props.items];
  }

  get subtotalAmount(): number {
    return this.props.subtotalAmount;
  }

  get deliveryFee(): number {
    return this.props.deliveryFee;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get allergenCheckVerdict(): 'SAFE' | 'WARNING' {
    return this.props.allergenCheckVerdict;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get paymentMethod(): string | undefined {
    return this.props.paymentMethod;
  }

  get changeFor(): number | undefined {
    return this.props.changeFor;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get cancelReason(): string | undefined {
    return this.props.cancelReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(props: CreateOrderInputProps, id?: string): Result<Order> {
    if (!props.consumerId || props.consumerId.trim() === '') {
      return Result.fail<Order>('O ID do consumidor é obrigatório para criar um pedido.');
    }

    if (!props.partnerId || props.partnerId.trim() === '') {
      return Result.fail<Order>('O ID do parceiro comercial é obrigatório para criar um pedido.');
    }

    if (!props.items || props.items.length === 0) {
      return Result.fail<Order>('O pedido deve conter pelo menos um item.');
    }

    const deliveryFee = props.deliveryFee !== undefined ? props.deliveryFee : 0;
    if (deliveryFee < 0) {
      return Result.fail<Order>('A taxa de entrega não pode ser negativa.');
    }

    const subtotal = Number(
      props.items.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2)
    );
    const totalAmount = Number((subtotal + deliveryFee).toFixed(2));

    const order = new Order(
      {
        consumerId: props.consumerId,
        partnerId: props.partnerId,
        status: props.status || OrderStatus.CREATED,
        items: props.items,
        subtotalAmount: subtotal,
        deliveryFee,
        totalAmount,
        allergenCheckVerdict: props.allergenCheckVerdict,
        notes: props.notes,
        paymentMethod: props.paymentMethod,
        changeFor: props.changeFor ? Number(props.changeFor) : undefined,
        cancelledAt: props.cancelledAt,
        cancelReason: props.cancelReason,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id
    );

    return Result.ok<Order>(order);
  }

  public markAwaitingPayment(): Result<void> {
    if (this.props.status !== OrderStatus.CREATED) {
      return Result.fail<void>(`Não é possível aguardar pagamento a partir do status ${this.props.status}`);
    }
    this.props.status = OrderStatus.AWAITING_PAYMENT;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public markAsPaid(): Result<void> {
    if (
      this.props.status !== OrderStatus.CREATED &&
      this.props.status !== OrderStatus.AWAITING_PAYMENT
    ) {
      return Result.fail<void>(`Não é possível marcar como pago um pedido no status ${this.props.status}`);
    }
    this.props.status = OrderStatus.PAID;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public confirm(isDeliveryPayment: boolean = false): Result<void> {
    if (this.props.status !== OrderStatus.PAID && !isDeliveryPayment) {
      return Result.fail<void>('Apenas pedidos com pagamento confirmado podem ser aceitos pelo parceiro.');
    }
    this.props.status = OrderStatus.CONFIRMED;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public confirmDeliveryOrder(): Result<void> {
    return this.confirm(true);
  }

  public startPreparing(): Result<void> {
    if (this.props.status !== OrderStatus.CONFIRMED) {
      return Result.fail<void>('O pedido deve ser confirmado antes de iniciar o preparo.');
    }
    this.props.status = OrderStatus.PREPARING;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public markReadyForPickup(): Result<void> {
    if (this.props.status !== OrderStatus.PREPARING) {
      return Result.fail<void>('O pedido precisa estar em preparo para ser marcado como pronto.');
    }
    this.props.status = OrderStatus.READY_FOR_PICKUP;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public markOutForDelivery(): Result<void> {
    if (
      this.props.status !== OrderStatus.PREPARING &&
      this.props.status !== OrderStatus.READY_FOR_PICKUP
    ) {
      return Result.fail<void>('O pedido não está pronto para despacho.');
    }
    this.props.status = OrderStatus.OUT_FOR_DELIVERY;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public markDelivered(): Result<void> {
    if (
      this.props.status !== OrderStatus.OUT_FOR_DELIVERY &&
      this.props.status !== OrderStatus.READY_FOR_PICKUP
    ) {
      return Result.fail<void>('O pedido não pode ser finalizado sem ter sido disponibilizado ou despachado.');
    }
    this.props.status = OrderStatus.DELIVERED;
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  public cancel(reason: string, requestedByConsumer: boolean = false): Result<{ requiresRefund: boolean }> {
    if (!reason || reason.trim() === '') {
      return Result.fail<{ requiresRefund: boolean }>('O motivo do cancelamento é obrigatório.');
    }

    if (this.props.status === OrderStatus.DELIVERED) {
      return Result.fail<{ requiresRefund: boolean }>('Não é possível cancelar um pedido já entregue.');
    }

    if (this.props.status === OrderStatus.CANCELLED) {
      return Result.fail<{ requiresRefund: boolean }>('Este pedido já está cancelado.');
    }

    if (requestedByConsumer && !OrderCancellationPolicy.canConsumerCancel(this.props.status)) {
      return Result.fail<{ requiresRefund: boolean }>(
        'O cancelamento não é mais permitido pelo consumidor pois o estabelecimento já confirmou ou iniciou o pedido.'
      );
    }

    const requiresRefund = OrderCancellationPolicy.requiresRefund(this.props.status);

    this.props.status = OrderStatus.CANCELLED;
    this.props.cancelReason = reason;
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok<{ requiresRefund: boolean }>({ requiresRefund });
  }
}
