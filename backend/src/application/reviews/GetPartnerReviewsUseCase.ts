// backend/src/application/reviews/GetPartnerReviewsUseCase.ts
import { IReviewRepository } from '../../domain/reviews/repositories/IReviewRepository';
import { Review } from '../../domain/reviews/Review';
import { Result } from '../../domain/Result';

export class GetPartnerReviewsUseCase {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  public async execute(partnerId: string): Promise<Result<Review[]>> {
    if (!partnerId || partnerId.trim() === '') {
      return Result.fail<Review[]>('O ID do parceiro comercial é obrigatório.');
    }

    const reviews = await this.reviewRepo.findByPartner(partnerId);
    return Result.ok<Review[]>(reviews);
  }
}
