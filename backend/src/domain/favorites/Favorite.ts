// backend/src/domain/favorites/Favorite.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

interface FavoriteProps {
  userId:     string;
  productId?: string;
  partnerId?: string;
  createdAt:  Date;
}

export class Favorite extends Entity<FavoriteProps> {
  get userId(): string {
    return this.props.userId;
  }

  get productId(): string | undefined {
    return this.props.productId;
  }

  get partnerId(): string | undefined {
    return this.props.partnerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: FavoriteProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: { userId: string; productId?: string; partnerId?: string; createdAt?: Date },
    id?: string
  ): Result<Favorite> {
    if (!props.userId || props.userId.trim() === '') {
      return Result.fail<Favorite>('O ID do usuário é obrigatório.');
    }

    const hasProduct = props.productId && props.productId.trim() !== '';
    const hasPartner = props.partnerId && props.partnerId.trim() !== '';

    if (!hasProduct && !hasPartner) {
      return Result.fail<Favorite>('O favorito deve estar associado a um produto ou a um parceiro comercial.');
    }

    const favorite = new Favorite({
      userId: props.userId.trim(),
      productId: hasProduct ? props.productId?.trim() : undefined,
      partnerId: hasPartner ? props.partnerId?.trim() : undefined,
      createdAt: props.createdAt ?? new Date(),
    }, id);

    return Result.ok<Favorite>(favorite);
  }
}
