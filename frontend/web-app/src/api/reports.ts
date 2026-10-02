// frontend/web-app/src/api/reports.ts
import { apiClient } from './client';

export enum ReportReason {
  INCORRECT_INGREDIENTS = 'INCORRECT_INGREDIENTS',
  MISSING_ALLERGEN = 'MISSING_ALLERGEN',
  WRONG_CROSS_CONTAMINATION = 'WRONG_CROSS_CONTAMINATION',
  CLIENT_REFUSED_PAYMENT = 'CLIENT_REFUSED_PAYMENT',
  CLIENT_ABSENT = 'CLIENT_ABSENT',
  FRAUDULENT_ORDER = 'FRAUDULENT_ORDER',
  ADDRESS_UNREACHABLE = 'ADDRESS_UNREACHABLE',
  CLIENT_REQUESTED_CANCELLATION = 'CLIENT_REQUESTED_CANCELLATION',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  OTHER = 'OTHER',
}

export interface ReportDTO {
  id: string;
  reporterId: string;
  productId?: string;
  partnerId?: string;
  targetUserId?: string;
  orderId?: string;
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

export interface ListAdminReportsFilters {
  status?: string;
  isFoodSafetyRisk?: boolean;
}

export const reportApi = {
  create: (payload: CreateReportPayload, token: string): Promise<ReportDTO> => {
    return apiClient.post<ReportDTO>('/admin/reports', payload, token);
  },

  listAdminReports: (filters?: ListAdminReportsFilters, token?: string): Promise<ReportDTO[]> => {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.isFoodSafetyRisk !== undefined) {
      params.append('isFoodSafetyRisk', String(filters.isFoodSafetyRisk));
    }
    const queryString = params.toString();
    const url = `/admin/reports${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<ReportDTO[]>(url, token);
  },

  reviewReport: (id: string, newStatus: string, token: string, reason?: string): Promise<ReportDTO> => {
    return apiClient.patch<ReportDTO>(`/admin/reports/${id}/status`, { newStatus, reason }, token);
  },
};

