// backend/src/application/favorites/AddFavoriteUseCase.ts
import { IFavoriteRepository } from '../../domain/favorites/repositories/IFavoriteRepository';
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Favorite } from '../../domain/favorites/Favorite';
import { Result } from '../../domain/Result';

export interface AddFavoriteDTO {
  userId:     string;
  productId?: string;
  partnerId?: string;
}

export class AddFavoriteUseCase {
  constructor(
    private readonly favoriteRepository: IFavoriteRepository,
    private readonly productRepository: IProductCatalogRepository,
    private readonly partnerRepository: IPartnerRepository
  ) {}

  async execute(dto: AddFavoriteDTO): Promise<Result<Favorite>> {
    const hasProduct = dto.productId && dto.productId.trim() !== '';
    const hasPartner = dto.partnerId && dto.partnerId.trim() !== '';

    if (!hasProduct && !hasPartner) {
      return Result.fail<Favorite>('É necessário especificar um produto ou um parceiro comercial para favoritar.');
    }

    // 1. Validar existências
    if (hasProduct) {
      const product = await this.productRepository.findById(dto.productId!);
      if (!product) {
        return Result.fail<Favorite>('Produto não encontrado.');
      }

      // Evita duplicidade
      const existing = await this.favoriteRepository.findByUserAndProduct(dto.userId, dto.productId!);
      if (existing) {
        return Result.ok<Favorite>(existing);
      }
    }

    if (hasPartner) {
      const partner = await this.partnerRepository.findById(dto.partnerId!);
      if (!partner) {
        return Result.fail<Favorite>('Parceiro comercial não encontrado.');
      }

      // Evita duplicidade
      const existing = await this.favoriteRepository.findByUserAndPartner(dto.userId, dto.partnerId!);
      if (existing) {
        return Result.ok<Favorite>(existing);
      }
    }

    // 2. Criar e salvar
    const favoriteOrError = Favorite.create({
      userId: dto.userId,
      productId: dto.productId,
      partnerId: dto.partnerId,
    });

    if (favoriteOrError.isFailure) {
      return Result.fail<Favorite>(favoriteOrError.getError());
    }

    const favorite = favoriteOrError.getValue();
    await this.favoriteRepository.save(favorite);

    return Result.ok<Favorite>(favorite);
  }
}
