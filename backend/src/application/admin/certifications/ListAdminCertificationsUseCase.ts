// backend/src/application/admin/certifications/ListAdminCertificationsUseCase.ts
import {
  IProductCertificationRepository,
  PaginatedCertificationsResult,
} from '../../../domain/catalog/repositories/IProductCertificationRepository';
import { CertificationVerificationStatus } from '../../../domain/catalog/ProductCertification';
import { Result } from '../../../domain/Result';

export interface ListAdminCertificationsDTO {
  status?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

export class ListAdminCertificationsUseCase {
  constructor(private readonly certificationRepository: IProductCertificationRepository) {}

  async execute(dto: ListAdminCertificationsDTO): Promise<Result<PaginatedCertificationsResult>> {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(100, Math.max(1, dto.limit || 20));

    let statusFilter: CertificationVerificationStatus | undefined;
    if (dto.status && ['DECLARED_BY_PARTNER', 'VERIFIED_BY_CELILAC', 'REJECTED'].includes(dto.status)) {
      statusFilter = dto.status as CertificationVerificationStatus;
    }

    const result = await this.certificationRepository.listForAdmin({
      status: statusFilter,
      productId: dto.productId,
      page,
      limit,
    });

    return Result.ok<PaginatedCertificationsResult>(result);
  }
}
