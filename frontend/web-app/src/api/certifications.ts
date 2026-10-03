// frontend/web-app/src/api/certifications.ts
import { apiClient } from './client';

export type CertificationVerificationStatus =
  | 'DECLARED_BY_PARTNER'
  | 'VERIFIED_BY_CELILAC'
  | 'REJECTED';

export interface AdminCertificationItem {
  id:                 string;
  productId:          string;
  productName:        string;
  productBrand:       string;
  partnerId?:         string;
  partnerName?:       string;
  certificationType:  string;
  certifyingEntity:   string;
  certificateCode?:   string;
  validUntil?:        string;
  imageId?:           string;
  imageUrl?:          string;
  verificationStatus: CertificationVerificationStatus;
  verificationNotes?: string;
  createdAt:          string;
  updatedAt:          string;
}

export interface PaginatedAdminCertifications {
  items: AdminCertificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListAdminCertificationsFilters {
  status?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

export interface ReviewCertificationPayload {
  action: 'APPROVE' | 'REJECT';
  notes?: string;
}

export const certificationsApi = {
  listAdmin: async (
    filters?: ListAdminCertificationsFilters,
    token?: string
  ): Promise<PaginatedAdminCertifications> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const query = params.toString();
    const url = `/admin/certifications${query ? `?${query}` : ''}`;
    const res = await apiClient.get<{ success: boolean; data: PaginatedAdminCertifications }>(url, token);
    return res.data;
  },

  review: async (
    id: string,
    payload: ReviewCertificationPayload,
    token?: string
  ): Promise<AdminCertificationItem> => {
    const res = await apiClient.patch<{ success: boolean; data: AdminCertificationItem; message: string }>(
      `/admin/certifications/${id}/review`,
      payload,
      token
    );
    return res.data;
  },
};
