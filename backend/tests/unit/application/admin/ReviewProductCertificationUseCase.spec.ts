// backend/tests/unit/application/admin/ReviewProductCertificationUseCase.spec.ts
import { ReviewProductCertificationUseCase } from '../../../../src/application/admin/certifications/ReviewProductCertificationUseCase';
import {
  IProductCertificationRepository,
  AdminCertificationListItem,
  ListCertificationsFilters,
  PaginatedCertificationsResult,
} from '../../../../src/domain/catalog/repositories/IProductCertificationRepository';
import { ProductCertification, CertificationVerificationStatus } from '../../../../src/domain/catalog/ProductCertification';
import { IAuditLogRepository } from '../../../../src/domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../../../src/domain/audit/AuditLog';

class InMemoryCertificationRepository implements IProductCertificationRepository {
  public certs: ProductCertification[] = [];

  async findById(id: string): Promise<ProductCertification | null> {
    return this.certs.find(c => c.id === id) || null;
  }

  async findItemDetailsById(id: string): Promise<AdminCertificationListItem | null> {
    const cert = this.certs.find(c => c.id === id);
    if (!cert) return null;
    return {
      id: cert.id,
      productId: cert.productId || 'p-1',
      productName: 'Pão Francês Sem Glúten',
      productBrand: 'CeliBakery',
      certificationType: cert.certificationType,
      certifyingEntity: cert.certifyingEntity,
      certificateCode: cert.certificateCode,
      validUntil: cert.validUntil,
      verificationStatus: cert.verificationStatus,
      verificationNotes: cert.verificationNotes,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
    };
  }

  async listForAdmin(filters: ListCertificationsFilters): Promise<PaginatedCertificationsResult> {
    const items = this.certs.map(c => ({
      id: c.id,
      productId: c.productId || 'p-1',
      productName: 'Pão Francês Sem Glúten',
      productBrand: 'CeliBakery',
      certificationType: c.certificationType,
      certifyingEntity: c.certifyingEntity,
      certificateCode: c.certificateCode,
      validUntil: c.validUntil,
      verificationStatus: c.verificationStatus,
      verificationNotes: c.verificationNotes,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    return { items, total: items.length, page: 1, limit: 20, totalPages: 1 };
  }

  async updateStatus(
    id: string,
    status: CertificationVerificationStatus,
    notes?: string,
    adminId?: string
  ): Promise<void> {
    const cert = this.certs.find(c => c.id === id);
    if (cert) {
      if (status === 'VERIFIED_BY_CELILAC') cert.markAsVerified(notes);
      else if (status === 'REJECTED') cert.markAsRejected(notes || '');
    }
  }
}

class InMemoryAuditLogRepository implements IAuditLogRepository {
  public logs: AuditLog[] = [];
  async save(log: AuditLog): Promise<void> {
    this.logs.push(log);
  }
  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.logs.filter(l => l.entityType === entityType && l.entityId === entityId);
  }
}

describe('ReviewProductCertificationUseCase', () => {
  let certRepo: InMemoryCertificationRepository;
  let auditRepo: InMemoryAuditLogRepository;
  let useCase: ReviewProductCertificationUseCase;

  beforeEach(() => {
    certRepo = new InMemoryCertificationRepository();
    auditRepo = new InMemoryAuditLogRepository();
    useCase = new ReviewProductCertificationUseCase(certRepo, auditRepo);
  });

  const createSampleCert = () => {
    const cert = ProductCertification.create({
      productId: 'prod-123',
      certificationType: 'ACELBRA',
      certifyingEntity: 'ACELBRA Nacional',
      certificateCode: 'ACEL-2026',
      validUntil: '2027-12-31',
    }, 'cert-123').getValue();
    certRepo.certs.push(cert);
    return cert;
  };

  it('deve aprovar certificação com sucesso e gravar log de auditoria', async () => {
    createSampleCert();

    const result = await useCase.execute({
      certificationId: 'cert-123',
      action: 'APPROVE',
      notes: 'Laudo verificado e código válido no portal da ACELBRA.',
      adminId: 'admin-1',
      adminEmail: 'admin@celilac.com.br',
    });

    expect(result.isSuccess).toBe(true);
    const updated = result.getValue();
    expect(updated.verificationStatus).toBe('VERIFIED_BY_CELILAC');
    expect(updated.verificationNotes).toContain('ACELBRA');

    expect(auditRepo.logs.length).toBe(1);
    expect(auditRepo.logs[0].action).toBe('CERTIFICATION_VERIFIED');
    expect(auditRepo.logs[0].actorRole).toBe('ADMIN');
  });

  it('deve rejeitar certificação com justificativa obrigatória', async () => {
    createSampleCert();

    const result = await useCase.execute({
      certificationId: 'cert-123',
      action: 'REJECT',
      notes: 'Foto do laudo ilegível. Favor reenviar imagem nítida.',
      adminId: 'admin-1',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().verificationStatus).toBe('REJECTED');
    expect(auditRepo.logs[0].action).toBe('CERTIFICATION_REJECTED');
  });

  it('deve falhar ao rejeitar sem justificativa', async () => {
    createSampleCert();

    const result = await useCase.execute({
      certificationId: 'cert-123',
      action: 'REJECT',
      notes: '',
      adminId: 'admin-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Justificativa é obrigatória');
  });

  it('deve falhar para certificação inexistente', async () => {
    const result = await useCase.execute({
      certificationId: 'cert-inexistente',
      action: 'APPROVE',
      adminId: 'admin-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('não encontrada');
  });
});
