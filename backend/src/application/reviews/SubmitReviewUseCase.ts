import { IReviewRepository } from '../../domain/reviews/repositories/IReviewRepository';
import { IProductRepository } from '../../domain/allergen-engine/repositories/IProductRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Review } from '../../domain/reviews/Review';
import { Result } from '../../domain/Result';

export interface SubmitReviewDTO {
  userId:     string;
  productId?: string;
  partnerId?: string;
  rating:     number;
  comment?:   string;
}

export class SubmitReviewUseCase {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly productRepo: IProductRepository,
    private readonly partnerRepo?: IPartnerRepository
  ) {}

  public async execute(dto: SubmitReviewDTO): Promise<Result<Review>> {
    const hasProduct = dto.productId && dto.productId.trim() !== '';
    const hasPartner = dto.partnerId && dto.partnerId.trim() !== '';

    if (!hasProduct && !hasPartner) {
      return Result.fail<Review>('A avaliação deve ser associada a um produto ou a um parceiro.');
    }

    // 1. Validar existências
    if (hasProduct) {
      const product = await this.productRepo.findById(dto.productId!);
      if (!product) {
        return Result.fail<Review>('Produto não encontrado no catálogo.');
      }
    }

    if (hasPartner && this.partnerRepo) {
      const partner = await this.partnerRepo.findById(dto.partnerId!);
      if (!partner) {
        return Result.fail<Review>('Parceiro comercial não encontrado.');
      }
    }

    // 2. Verificar se o usuário já avaliou para fazer Upsert
    let existingReview: Review | null = null;
    if (hasProduct) {
      existingReview = await this.reviewRepo.findByUserAndProduct(dto.userId, dto.productId!);
    } else if (hasPartner) {
      existingReview = await this.reviewRepo.findByUserAndPartner(dto.userId, dto.partnerId!);
    }

    const reviewOrError = Review.create(
      {
        userId: dto.userId,
        productId: hasProduct ? dto.productId : undefined,
        partnerId: hasPartner ? dto.partnerId : undefined,
        rating: dto.rating,
        comment: dto.comment,
      },
      existingReview ? existingReview.id : undefined // Se existe, reaproveita o ID
    );

    if (reviewOrError.isFailure) {
      return Result.fail<Review>(reviewOrError.getError());
    }

    const review = reviewOrError.getValue();
    await this.reviewRepo.save(review);

    return Result.ok<Review>(review);
  }
}
