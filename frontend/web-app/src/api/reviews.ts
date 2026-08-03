// frontend/web-app/src/api/reviews.ts
import { apiClient } from './client';

export interface ReviewDTO {
  id: string;
  userId: string;
  productId?: string;
  partnerId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubmitReviewPayload {
  productId?: string;
  partnerId?: string;
  rating: number;
  comment?: string;
}

export const reviewApi = {
  submit: (payload: SubmitReviewPayload, token: string): Promise<ReviewDTO> => {
    return apiClient.post<ReviewDTO>('/reviews', payload, token);
  },

  getByProduct: (productId: string): Promise<ReviewDTO[]> => {
    return apiClient.get<ReviewDTO[]>(`/reviews/product/${productId}`);
  },

  getByPartner: (partnerId: string): Promise<ReviewDTO[]> => {
    return apiClient.get<ReviewDTO[]>(`/reviews/partner/${partnerId}`);
  },
};
