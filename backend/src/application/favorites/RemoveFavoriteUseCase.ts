// backend/src/application/favorites/RemoveFavoriteUseCase.ts
import { IFavoriteRepository } from '../../domain/favorites/repositories/IFavoriteRepository';
import { Result } from '../../domain/Result';

export interface RemoveFavoriteDTO {
  userId:   string;
  targetId: string; // Pode ser ID do produto ou do parceiro
}

export class RemoveFavoriteUseCase {
  constructor(private readonly favoriteRepository: IFavoriteRepository) {}

  async execute(dto: RemoveFavoriteDTO): Promise<Result<void>> {
    if (!dto.userId || dto.userId.trim() === '') {
      return Result.fail<void>('O ID do usuário é obrigatório.');
    }
    if (!dto.targetId || dto.targetId.trim() === '') {
      return Result.fail<void>('O ID do alvo (produto ou parceiro) é obrigatório.');
    }

    await this.favoriteRepository.delete(dto.userId, dto.targetId);

    return Result.ok<void>(undefined);
  }
}
