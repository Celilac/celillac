// backend/src/domain/catalog/repositories/IProductCertificationRepository.ts
import { ProductCertification, CertificationVerificationStatus } from '../ProductCertification';

export interface AdminCertificationListItem {
  id:                  string;
  productId:           string;
  productName:         string;
  productBrand:        string;
  partnerId?:          string;
  partnerName?:        string;
  certificationType:   string;
  certifyingEntity:    string;
  certificateCode?:    string;
  validUntil?:         string;
  imageId?:            string;
  imageUrl?:           string;
  verificationStatus:  CertificationVerificationStatus;
  verificationNotes?:  string;
  createdAt:           string;
  updatedAt:           string;
}

export interface ListCertificationsFilters {
  status?: CertificationVerificationStatus;
  productId?: string;
  page: number;
  limit: number;
}

export interface PaginatedCertificationsResult {
  items: AdminCertificationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IProductCertificationRepository {
  findById(id: string): Promise<ProductCertification | null>;
  findItemDetailsById(id: string): Promise<AdminCertificationListItem | null>;
  listForAdmin(filters: ListCertificationsFilters): Promise<PaginatedCertificationsResult>;
  updateStatus(
    id: string,
    status: CertificationVerificationStatus,
    notes?: string,
    adminId?: string
  ): Promise<void>;
}
