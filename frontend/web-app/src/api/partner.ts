// frontend/web-app/src/api/partner.ts
import { apiClient } from './client';

export interface PartnerSummary {
  id:                 string;
  userId:             string;
  name:               string;
  cnpj?:              string;
  description:        string;
  address:            string;
  phone:              string;
  type:               string;
  approvalStatus:     string;
  operationalStatus:  string;
  rejectionReason?:   string;
  suspensionReason?:  string;
  city?:              string;
  state?:             string;
  deliveryRegion?:    string;
  logoUrl?:           string;
}

export const partnerApi = {
  // Cadastrar parceiro
  register: (body: Omit<PartnerSummary, 'id' | 'userId' | 'approvalStatus' | 'operationalStatus'>, token: string) =>
    apiClient.post<PartnerSummary>('/partners', body, token),

  // Atualizar cadastro do parceiro
  update: (id: string, body: Partial<Omit<PartnerSummary, 'id' | 'userId' | 'approvalStatus' | 'operationalStatus'>>, token: string) =>
    apiClient.put<void>(`/partners/${id}`, body, token),

  // Submeter parceiro para revisão
  submit: (id: string, token: string) =>
    apiClient.post<void>(`/partners/${id}/submit`, {}, token),

  // Atualizar status operacional (Ativo, Inativo, Fechado)
  updateOperationalStatus: (id: string, status: string, token: string) =>
    apiClient.patch<void>(`/partners/${id}/operational-status`, { status }, token),

  // Obter detalhes de um parceiro específico
  get: (id: string, token?: string) =>
    apiClient.get<PartnerSummary>(`/partners/${id}`, token),

  // Listar todos os parceiros do usuário logado
  listUserPartners: (token: string) =>
    apiClient.get<PartnerSummary[]>('/partners/me/all', token),

  // Obter o parceiro principal do usuário logado (legado)
  getMe: (token: string) =>
    apiClient.get<{ success: boolean; data: PartnerSummary }>('/partners/me', token),

  // Listar parceiros públicos
  listPublicPartners: () =>
    apiClient.get<PartnerSummary[]>('/partners'),

  // --- Ações do Administrador ---
  // Listar todos os parceiros para moderação
  listAdminPartners: (token: string) =>
    apiClient.get<PartnerSummary[]>('/admin/partners', token),

  // Aprovar parceiro
  approve: (id: string, token: string) =>
    apiClient.post<void>(`/partners/${id}/approve`, {}, token),

  // Rejeitar parceiro (com justificativa)
  reject: (id: string, reason: string, token: string) =>
    apiClient.post<void>(`/partners/${id}/reject`, { reason }, token),

  // Suspender parceiro (com justificativa)
  suspend: (id: string, reason: string, token: string) =>
    apiClient.post<void>(`/partners/${id}/suspend`, { reason }, token),

  // Reativar parceiro
  reactivate: (id: string, token: string) =>
    apiClient.post<void>(`/partners/${id}/reactivate`, {}, token),
};
