// frontend/web-app/src/api/favorites.ts
import { apiClient } from './client';

export interface FavoriteDTO {
  id: string;
  userId: string;
  productId?: string;
  partnerId?: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    category?: string;
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

export interface AddFavoritePayload {
  productId?: string;
  partnerId?: string;
}

export const favoriteApi = {
  add: (payload: AddFavoritePayload, token: string): Promise<FavoriteDTO> => {
    return apiClient.post<FavoriteDTO>('/favorites', payload, token);
  },

  remove: (targetId: string, token: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/favorites/${targetId}`, token);
  },

  list: (token: string): Promise<FavoriteDTO[]> => {
    return apiClient.get<FavoriteDTO[]>('/favorites', token);
  },
};
