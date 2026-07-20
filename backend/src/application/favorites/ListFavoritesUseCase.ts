// backend/src/application/favorites/ListFavoritesUseCase.ts
import { IFavoriteRepository } from '../../domain/favorites/repositories/IFavoriteRepository';
import { Result } from '../../domain/Result';

export interface FavoriteResponseDTO {
  id:         string;
  userId:    string;
  productId?: string;
  partnerId?: string;
  createdAt:  Date;
}

export class ListFavoritesUseCase {
  constructor(private readonly favoriteRepository: IFavoriteRepository) {}

  async execute(userId: string): Promise<Result<FavoriteResponseDTO[]>> {
    if (!userId || userId.trim() === '') {
      return Result.fail<FavoriteResponseDTO[]>('O ID do usuário é obrigatório.');
    }

    const favorites = await this.favoriteRepository.findByUser(userId);

    const data = favorites.map(fav => ({
      id:        fav.id,
      userId:    fav.userId,
      productId: fav.productId,
      partnerId: fav.partnerId,
      createdAt: fav.createdAt,
    }));

    return Result.ok<FavoriteResponseDTO[]>(data);
  }
}
