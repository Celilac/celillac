// backend/src/domain/favorites/repositories/IFavoriteRepository.ts
import { Favorite } from '../Favorite';

export interface FavoriteWithDetails {
  favorite: Favorite;
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

export interface IFavoriteRepository {
  save(favorite: Favorite): Promise<void>;
  delete(userId: string, targetId: string): Promise<void>;
  findByUser(userId: string): Promise<FavoriteWithDetails[]>;
  findByUserAndProduct(userId: string, productId: string): Promise<Favorite | null>;
  findByUserAndPartner(userId: string, partnerId: string): Promise<Favorite | null>;
}

