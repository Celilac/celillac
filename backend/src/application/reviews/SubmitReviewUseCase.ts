import { IReviewRepository } from '../../domain/reviews/repositories/IReviewRepository';
import { IProductRepository } from '../../domain/catalog/repositories/IProductRepository';
import { Review } from '../../domain/reviews/Review';
import { Result } from '../../domain/Result';

export interface SubmitReviewDTO {
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
}

export class SubmitReviewUseCase {
  constructor(
    private reviewRepo: IReviewRepository,
    private productRepo: IProductRepository
  ) {}

  public async execute(dto: SubmitReviewDTO): Promise<Result<Review>> {
    // 1. Validar se o produto existe
    const product = await this.productRepo.findById(dto.productId);
    if (!product) {
      return Result.fail<Review>('Produto não encontrado no catálogo.');
    }

    // 2. Criar a entidade Review (que já valida os limites 1-5 estrelas)
    // Se o usuário já tiver uma review, nós a sobrescrevemos (usando o mesmo ID se necessário,
    // mas por simplicidade e no repositório, faremos um Upsert baseado no par userId+productId)
    
    // Verificamos se já existe para retornar o mesmo ID e atualizar, mantendo a regra de 1 por usuário.
    const existingReview = await this.reviewRepo.findByUserAndProduct(dto.userId, dto.productId);
    
    const reviewOrError = Review.create(
      {
        userId: dto.userId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
      },
      existingReview ? existingReview.id : undefined // Se existe, reaproveita o ID
    );

    if (reviewOrError.isFailure) {
      return Result.fail<Review>(reviewOrError.error as string);
    }

    const review = reviewOrError.getValue();

    // 3. Persistir
    await this.reviewRepo.save(review);

    return Result.ok<Review>(review);
  }
}
