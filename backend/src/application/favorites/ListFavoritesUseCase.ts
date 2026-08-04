// backend/src/application/favorites/ListFavoritesUseCase.ts
import { IFavoriteRepository } from '../../domain/favorites/repositories/IFavoriteRepository';
import { Result } from '../../domain/Result';

export interface FavoriteResponseDTO {
  id:         string;
  userId:    string;
  productId?: string;
  partnerId?: string;
  createdAt:  Date;
  product?: {
    id: string;
    name: string;
    brand?: string;
    category?: string;
    imageUrl?: string;
    price?: number;
  };
  partner?: {
    id: string;
    name: string;
    type?: string;
    city?: string;
    state?: string;
  };
}

export class ListFavoritesUseCase {
  constructor(private readonly favoriteRepository: IFavoriteRepository) {}

  async execute(userId: string): Promise<Result<FavoriteResponseDTO[]>> {
    if (!userId || userId.trim() === '') {
      return Result.fail<FavoriteResponseDTO[]>('O ID do usuário é obrigatório.');
    }

    const items = await this.favoriteRepository.findByUser(userId);

    const data = items.map(item => ({
      id:        item.favorite.id,
      userId:    item.favorite.userId,
      productId: item.favorite.productId,
      partnerId: item.favorite.partnerId,
      createdAt: item.favorite.createdAt,
      product:   item.product,
      partner:   item.partner,
    }));

    return Result.ok<FavoriteResponseDTO[]>(data);
  }
}
