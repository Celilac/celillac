import { Entity } from '../Entity';
import { Result } from '../Result';

interface ReviewProps {
  userId: string;
  productId?: string;
  partnerId?: string;
  rating: number; // 1 a 5 estrelas
  comment?: string;
  createdAt: Date;
}

export class Review extends Entity<ReviewProps> {
  get userId(): string {
    return this.props.userId;
  }

  get productId(): string | undefined {
    return this.props.productId;
  }

  get partnerId(): string | undefined {
    return this.props.partnerId;
  }

  get rating(): number {
    return this.props.rating;
  }

  get comment(): string | undefined {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: ReviewProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: { userId: string; productId?: string; partnerId?: string; rating: number; comment?: string; createdAt?: Date },
    id?: string
  ): Result<Review> {
    if (!props.userId || props.userId.trim() === '') {
      return Result.fail<Review>('User ID é obrigatório.');
    }
    
    const hasProduct = props.productId && props.productId.trim() !== '';
    const hasPartner = props.partnerId && props.partnerId.trim() !== '';

    if (!hasProduct && !hasPartner) {
      return Result.fail<Review>('A avaliação deve estar associada a um produto ou a um parceiro comercial.');
    }

    if (props.rating < 1 || props.rating > 5) {
      return Result.fail<Review>('A avaliação deve ser entre 1 e 5 estrelas.');
    }

    const review = new Review({
      userId: props.userId,
      productId: hasProduct ? props.productId?.trim() : undefined,
      partnerId: hasPartner ? props.partnerId?.trim() : undefined,
      rating: props.rating,
      comment: props.comment,
      createdAt: props.createdAt ?? new Date(),
    }, id);

    return Result.ok<Review>(review);
  }
}
