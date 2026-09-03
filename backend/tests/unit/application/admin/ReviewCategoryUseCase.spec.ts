// backend/tests/unit/application/admin/ReviewCategoryUseCase.spec.ts
import { ReviewCategoryUseCase } from '../../../../src/application/admin/ReviewCategoryUseCase';
import { ICategoryRepository } from '../../../../src/domain/catalog/repositories/ICategoryRepository';
import { IAuditLogRepository } from '../../../../src/domain/audit/repositories/IAuditLogRepository';
import { Category } from '../../../../src/domain/catalog/Category';

describe('ReviewCategoryUseCase', () => {
  let categoryRepository: jest.Mocked<ICategoryRepository>;
  let auditLogRepository: jest.Mocked<IAuditLogRepository>;
  let useCase: ReviewCategoryUseCase;

  const mockCategory = Category.create({
    name: 'Doces Artesanais',
    partnerId: 'partner-1',
    status: 'PENDING_APPROVAL',
    visibility: 'RESTRICTED',
  }, 'cat-1').getValue();

  beforeEach(() => {
    categoryRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockCategory),
      findByNormalizedName: jest.fn(),
      update: jest.fn(),
      listAvailableForPartner: jest.fn(),
      listPublicCategories: jest.fn(),
      listAllForAdmin: jest.fn(),
    };

    auditLogRepository = {
      save: jest.fn(),
      findByEntity: jest.fn(),
    };

    useCase = new ReviewCategoryUseCase(categoryRepository, auditLogRepository);
  });

  it('should approve category as global', async () => {
    const result = await useCase.execute({
      categoryId: 'cat-1',
      action: 'APPROVE_GLOBAL',
      adminId: 'admin-1',
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.status).toBe('APPROVED');
    expect(dto.visibility).toBe('GLOBAL');
    expect(categoryRepository.update).toHaveBeenCalledTimes(1);
    expect(auditLogRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should approve category as restricted to partner', async () => {
    const result = await useCase.execute({
      categoryId: 'cat-1',
      action: 'APPROVE_RESTRICTED',
      adminId: 'admin-1',
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.status).toBe('APPROVED');
    expect(dto.visibility).toBe('RESTRICTED');
    expect(categoryRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should reject category with reason', async () => {
    const result = await useCase.execute({
      categoryId: 'cat-1',
      action: 'REJECT',
      rejectionReason: 'Categoria não condiz com as diretrizes do CeliLac.',
      adminId: 'admin-1',
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.status).toBe('REJECTED');
    expect(dto.rejectionReason).toBe('Categoria não condiz com as diretrizes do CeliLac.');
    expect(categoryRepository.update).toHaveBeenCalledTimes(1);
  });

  it('should fail if category is not found', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      categoryId: 'cat-not-found',
      action: 'APPROVE_GLOBAL',
      adminId: 'admin-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Categoria não encontrada');
  });

  it('should fail rejecting without reason', async () => {
    const result = await useCase.execute({
      categoryId: 'cat-1',
      action: 'REJECT',
      rejectionReason: '',
      adminId: 'admin-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('motivo da rejeição');
  });
});
