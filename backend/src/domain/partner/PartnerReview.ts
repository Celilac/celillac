// backend/src/domain/partner/PartnerReview.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export interface PartnerReviewProps {
  consumerId: string;
  partnerId: string;
  rating: number;
  comment?: string;
  createdAt?: Date;
}

export class PartnerReview extends Entity<PartnerReviewProps> {
  private constructor(props: PartnerReviewProps, id?: string) {
    super({ ...props, createdAt: props.createdAt || new Date() }, id);
  }

  get consumerId(): string {
    return this.props.consumerId;
  }

  get partnerId(): string {
    return this.props.partnerId;
  }

  get rating(): number {
    return this.props.rating;
  }

  get comment(): string | undefined {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  static create(props: PartnerReviewProps, id?: string): Result<PartnerReview> {
    if (!props.consumerId || props.consumerId.trim().length === 0) {
      return Result.fail<PartnerReview>('O consumerId não pode ser vazio.');
    }
    if (!props.partnerId || props.partnerId.trim().length === 0) {
      return Result.fail<PartnerReview>('O partnerId não pode ser vazio.');
    }
    if (!props.rating || props.rating < 1 || props.rating > 5) {
      return Result.fail<PartnerReview>('A nota da avaliação deve estar entre 1 e 5.');
    }
    return Result.ok<PartnerReview>(new PartnerReview(props, id));
  }
}
