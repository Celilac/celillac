// backend/src/domain/partner/PartnerFavorite.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export interface PartnerFavoriteProps {
  consumerId: string;
  partnerId: string;
  createdAt?: Date;
}

export class PartnerFavorite extends Entity<PartnerFavoriteProps> {
  private constructor(props: PartnerFavoriteProps, id?: string) {
    super({ ...props, createdAt: props.createdAt || new Date() }, id);
  }

  get consumerId(): string {
    return this.props.consumerId;
  }

  get partnerId(): string {
    return this.props.partnerId;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  static create(props: PartnerFavoriteProps, id?: string): Result<PartnerFavorite> {
    if (!props.consumerId || props.consumerId.trim().length === 0) {
      return Result.fail<PartnerFavorite>('O consumerId não pode ser vazio.');
    }
    if (!props.partnerId || props.partnerId.trim().length === 0) {
      return Result.fail<PartnerFavorite>('O partnerId não pode ser vazio.');
    }
    return Result.ok<PartnerFavorite>(new PartnerFavorite(props, id));
  }
}
