// backend/src/domain/favorites/repositories/IFavoriteRepository.ts
import { Favorite } from '../Favorite';

export interface IFavoriteRepository {
  save(favorite: Favorite): Promise<void>;
  delete(userId: string, targetId: string): Promise<void>;
  findByUser(userId: string): Promise<Favorite[]>;
  findByUserAndProduct(userId: string, productId: string): Promise<Favorite | null>;
  findByUserAndPartner(userId: string, partnerId: string): Promise<Favorite | null>;
}
