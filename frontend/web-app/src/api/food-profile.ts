// frontend/web-app/src/api/food-profile.ts
import { apiClient } from './client';

export interface RestrictionInput {
  allergen: string; // AllergenType do backend
  severity: string; // SeverityLevel do backend
}

export interface CreateProfileRequest {
  userId:       string;
  restrictions: RestrictionInput[];
}

export interface RestrictionDTO {
  id:       string;
  allergen: string;
  severity: string;
}

export interface FoodProfileResponse {
  id:                          string;
  userId:                      string;
  isActive:                    boolean;
  requiresHistoryRevalidation: boolean;
  restrictions:                RestrictionDTO[];
}

export interface UpdateProfileRequest {
  restrictions: RestrictionInput[];
}

export const foodProfileApi = {
  create: (body: CreateProfileRequest, token: string) =>
    apiClient.post<FoodProfileResponse>('/food-profile', body, token),

  update: (userId: string, body: UpdateProfileRequest, token: string) =>
    apiClient.put<FoodProfileResponse>(`/food-profile/${userId}`, body, token),

  getByUserId: (userId: string, token: string) =>
    apiClient.get<FoodProfileResponse>(`/food-profile/${userId}`, token),
};
