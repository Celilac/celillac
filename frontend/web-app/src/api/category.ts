// frontend/web-app/src/api/category.ts
import { apiClient } from './client';

export type CategoryStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type CategoryVisibility = 'GLOBAL' | 'RESTRICTED';

export interface CategorySummary {
  id: string;
  name: string;
  normalizedName: string;
  partnerId?: string;
  status: CategoryStatus;
  visibility: CategoryVisibility;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  partnerId: string;
}

export interface ReviewCategoryInput {
  action: 'APPROVE_GLOBAL' | 'APPROVE_RESTRICTED' | 'REJECT';
  rejectionReason?: string;
}

export interface AdminCategoryFilter {
  status?: string;
  visibility?: string;
  partnerId?: string;
}

export const categoryApi = {
  /**
   * Lista categorias disponíveis para um parceiro ao cadastrar produtos, ou públicas.
   */
  async list(partnerId?: string): Promise<CategorySummary[]> {
    const params = new URLSearchParams();
    if (partnerId) {
      params.append('partnerId', partnerId);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<{ success: boolean; data: CategorySummary[] }>(`/catalog/categories${queryString}`);
    return res.data || [];
  },

  /**
   * Registra uma nova categoria customizada pelo parceiro.
   */
  async create(data: CreateCategoryInput, token: string): Promise<CategorySummary> {
    const res = await apiClient.post<{ success: boolean; data: CategorySummary }>('/catalog/categories', data, token);
    return res.data;
  },

  /**
   * Lista categorias completas para o painel de moderação administrativa.
   */
  async listAdmin(token: string, filter?: AdminCategoryFilter): Promise<CategorySummary[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.visibility) params.append('visibility', filter.visibility);
    if (filter?.partnerId) params.append('partnerId', filter.partnerId);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get<{ success: boolean; data: CategorySummary[] }>(`/admin/categories${queryString}`, token);
    return res.data || [];
  },

  /**
   * Modera uma categoria (Aprova Global, Aprova Restrita ou Rejeita).
   */
  async review(id: string, decision: ReviewCategoryInput, token: string): Promise<CategorySummary> {
    const res = await apiClient.patch<{ success: boolean; data: CategorySummary }>(
      `/admin/categories/${id}/review`,
      decision,
      token
    );
    return res.data;
  },
};
