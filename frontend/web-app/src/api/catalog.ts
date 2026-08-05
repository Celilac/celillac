// frontend/web-app/src/api/catalog.ts
//
// ⚠️ REGRA ARQUITETURAL — FRONTEND_STRATEGY.md
// Esta é a ÚNICA camada autorizada a buscar produtos no catálogo.
// Nenhuma página deve usar fetch() diretamente para /catalog.
//
import { apiClient } from './client';

export interface ProductSummary {
  id:                 string;
  name:               string;
  brand:              string;
  ingredients:        string;
  hasGluten:          boolean;
  crossContamination: string;
  analysisStatus:     string;
}

export interface ProductDetails extends ProductSummary {
  partnerId?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  compatibilityReport?: {
    isCompatible: boolean;
    riskLevel: any;
    conflicts: Array<{ allergen: string; severity: string; reason: string }>;
    reasoning: string;
  };
}

export interface CatalogPage {
  data:  ProductSummary[];
  total: number;
  page:  number;
  limit: number;
}

export const catalogApi = {
  // Rota real do backend: GET /catalog/products?query=...
  search: (query: string, token: string) =>
    apiClient.get<CatalogPage>(`/catalog/products?query=${encodeURIComponent(query)}`, token),

  // Buscar detalhes de um produto por ID
  getById: (id: string, token?: string) =>
    apiClient.get<ProductDetails>(`/catalog/products/${id}`, token),

  // Buscar produtos pertencentes a um parceiro específico
  listByPartner: (partnerId: string, token?: string) =>
    apiClient.get<CatalogPage>(`/catalog/products?partnerId=${partnerId}`, token),
};
