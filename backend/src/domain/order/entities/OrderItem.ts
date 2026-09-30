// backend/src/domain/order/entities/OrderItem.ts
import { Entity } from '../../Entity';
import { Result } from '../../Result';

export interface OrderItemProps {
  orderId?: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export class OrderItem extends Entity<OrderItemProps> {
  private constructor(props: OrderItemProps, id?: string) {
    super(props, id);
  }

  get orderId(): string | undefined {
    return this.props.orderId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get productName(): string {
    return this.props.productName;
  }

  get unitPrice(): number {
    return this.props.unitPrice;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get totalPrice(): number {
    return this.props.totalPrice;
  }

  public static create(
    props: Omit<OrderItemProps, 'totalPrice'> & { totalPrice?: number },
    id?: string
  ): Result<OrderItem> {
    if (!props.productId || props.productId.trim() === '') {
      return Result.fail<OrderItem>('O ID do produto é obrigatório no item do pedido.');
    }

    if (!props.productName || props.productName.trim() === '') {
      return Result.fail<OrderItem>('O nome do produto é obrigatório no item do pedido.');
    }

    if (props.quantity === undefined || props.quantity <= 0 || !Number.isInteger(props.quantity)) {
      return Result.fail<OrderItem>('A quantidade do produto deve ser um número inteiro positivo maior que zero.');
    }

    if (props.unitPrice === undefined || props.unitPrice < 0) {
      return Result.fail<OrderItem>('O preço unitário não pode ser negativo.');
    }

    const calculatedTotal = Number((props.unitPrice * props.quantity).toFixed(2));
    const totalPrice = props.totalPrice !== undefined ? props.totalPrice : calculatedTotal;

    return Result.ok<OrderItem>(
      new OrderItem(
        {
          ...props,
          totalPrice,
        },
        id
      )
    );
  }
}
