// frontend/web-app/src/api/catalog.ts
//
// ⚠️ REGRA ARQUITETURAL — FRONTEND_STRATEGY.md
// Esta é a ÚNICA camada autorizada a interagir com produtos no catálogo.
// Nenhuma página deve usar fetch() diretamente para /catalog.
//
import { apiClient } from './client';

export type CommercialOrigin = 'OWN_MANUFACTURE' | 'THIRD_PARTY_RESELL';
export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export type ProductImageType =
  | 'PRODUCT'
  | 'PACKAGING'
  | 'LABEL'
  | 'INGREDIENTS'
  | 'NUTRITIONAL_INFO'
  | 'CERTIFICATION';

export interface ProductImageDTO {
  id?: string;
  productId?: string;
  url: string;
  imageType?: ProductImageType;
  caption?: string;
  displayOrder?: number;
  isCover?: boolean;
}

export type AllergenPresence = 'FREE' | 'CONTAINS' | 'TRACES' | 'NOT_INFORMED';

export type EnvironmentRiskLevel =
  | 'EXCLUSIVE_ENVIRONMENT'
  | 'SHARED_WITH_PROTOCOL'
  | 'SHARED_ENVIRONMENT'
  | 'UNKNOWN_RISK';

export interface CrossContaminationDetails {
  environmentRisk?: EnvironmentRiskLevel;
  allergenRisks?: Record<string, EnvironmentRiskLevel>;
  cleaningProtocolNotes?: string;
}

export type DietaryFeature =
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'NO_ADDED_SUGAR'
  | 'SUGAR_FREE'
  | 'ORGANIC'
  | 'KOSHER'
  | 'HALAL';

export type InformationOrigin = 'PARTNER_DECLARED' | 'VERIFIED_BY_CELILAC';

export interface NutritionalInfo {
  servingSize?:    string; // Ex: "50g (2 fatias)"
  calories?:       number; // kcal
  carbohydrates?:  number; // g
  totalSugars?:    number; // g
  addedSugars?:    number; // g
  proteins?:       number; // g
  totalFat?:       number; // g
  saturatedFat?:   number; // g
  dietaryFiber?:   number; // g
  sodium?:         number; // mg
}

export interface ProductCertificationDTO {
  id?:                 string;
  productId?:          string;
  certificationType:   string;
  certifyingEntity:    string;
  certificateCode?:    string;
  validUntil?:         string;
  imageId?:            string;
  verificationStatus?: 'DECLARED_BY_PARTNER' | 'VERIFIED_BY_CELILAC' | 'REJECTED';
  verificationNotes?:  string;
}

export interface ProductSummary {
  id:                          string;
  name:                        string;
  brand:                       string;
  ingredients:                 string;
  hasGluten:                   boolean;
  crossContamination:          string;
  analysisStatus:              string;
  imageUrl?:                   string;
  shortDescription?:           string;
  netContent?:                 number;
  unitOfMeasure?:              string;
  sku?:                        string;
  ean?:                        string;
  commercialOrigin?:           CommercialOrigin;
  mayContainTraces?:           string;
  compositionNotes?:           string;
  publicationStatus?:          PublicationStatus;
  images?:                     ProductImageDTO[];
  declaredAllergens?:          Record<string, AllergenPresence>;
  crossContaminationDetails?: CrossContaminationDetails;
  dietaryFeatures?:            DietaryFeature[];
  informationOrigin?:          InformationOrigin;
  nutritionalInfo?:           NutritionalInfo;
  certifications?:             ProductCertificationDTO[];
}

export interface ProductDetails extends ProductSummary {
  partnerId?: string;
  price?: number;
  category?: string;
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

export interface CreateProductInput {
  name:                        string;
  brand?:                      string;
  ingredients?:                string;
  hasGluten?:                  boolean;
  crossContamination?:         string;
  partnerId:                   string;
  price?:                      number;
  category?:                   string;
  imageUrl?:                   string;
  shortDescription?:           string;
  netContent?:                 number;
  unitOfMeasure?:              string;
  sku?:                        string;
  ean?:                        string;
  commercialOrigin?:           CommercialOrigin;
  mayContainTraces?:           string;
  compositionNotes?:           string;
  publicationStatus?:          PublicationStatus;
  images?:                     ProductImageDTO[];
  declaredAllergens?:          Record<string, AllergenPresence>;
  crossContaminationDetails?: CrossContaminationDetails;
  dietaryFeatures?:            DietaryFeature[];
  informationOrigin?:          InformationOrigin;
  nutritionalInfo?:           NutritionalInfo;
  certifications?:             ProductCertificationDTO[];
}

export const catalogApi = {
  // Rota real do backend: GET /catalog/products?query=...
  search: (query: string, token?: string) =>
    apiClient.get<CatalogPage>(`/catalog/products?query=${encodeURIComponent(query)}`, token),

  // Buscar detalhes de um produto por ID
  getById: (id: string, token?: string) =>
    apiClient.get<ProductDetails>(`/catalog/products/${id}`, token),

  // Buscar produtos pertencentes a um parceiro específico
  listByPartner: (partnerId: string, token?: string) =>
    apiClient.get<CatalogPage>(`/catalog/products?partnerId=${partnerId}`, token),

  // Criar / publicar novo produto no catálogo
  create: (data: CreateProductInput, token: string) =>
    apiClient.post<ProductSummary>('/catalog/products', data, token),
};
