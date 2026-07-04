import { Entity } from '../Entity';
import { Result } from '../Result';

interface ReviewProps {
  userId: string;
  productId: string;
  rating: number; // 1 a 5 estrelas
  comment?: string;
  createdAt: Date;
}

export class Review extends Entity<ReviewProps> {
  get userId(): string {
    return this.props.userId;
  }

  get productId(): string {
    return this.props.productId;
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
    props: { userId: string; productId: string; rating: number; comment?: string },
    id?: string
  ): Result<Review> {
    if (!props.userId || props.userId.trim() === '') {
      return Result.fail<Review>('User ID é obrigatório.');
    }
    if (!props.productId || props.productId.trim() === '') {
      return Result.fail<Review>('Product ID é obrigatório.');
    }
    if (props.rating < 1 || props.rating > 5) {
      return Result.fail<Review>('A avaliação deve ser entre 1 e 5 estrelas.');
    }

    const review = new Review({
      ...props,
      createdAt: new Date(),
    }, id);

    return Result.ok<Review>(review);
  }
}
