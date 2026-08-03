// frontend/web-app/src/api/reports.ts
import { apiClient } from './client';

export enum ReportReason {
  INCORRECT_INGREDIENTS = 'INCORRECT_INGREDIENTS',
  MISSING_ALLERGEN = 'MISSING_ALLERGEN',
  WRONG_CROSS_CONTAMINATION = 'WRONG_CROSS_CONTAMINATION',
  OTHER = 'OTHER',
}

export interface ReportDTO {
  id: string;
  reporterId: string;
  productId?: string;
  partnerId?: string;
  reason: ReportReason | string;
  details?: string;
  isFoodSafetyRisk: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportPayload {
  productId?: string;
  partnerId?: string;
  reason: string;
  details?: string;
  isFoodSafetyRisk?: boolean;
}

export const reportApi = {
  create: (payload: CreateReportPayload, token: string): Promise<ReportDTO> => {
    return apiClient.post<ReportDTO>('/admin/reports', payload, token);
  },
};
