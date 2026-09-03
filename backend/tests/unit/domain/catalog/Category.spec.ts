// backend/tests/unit/domain/catalog/Category.spec.ts
import { Category } from '../../../../src/domain/catalog/Category';

describe('Category Domain Entity', () => {
  it('should create a valid Category instance with default status and visibility', () => {
    const result = Category.create({
      name: 'Pães Especiais',
      partnerId: 'partner-123',
      createdByUserId: 'user-123',
    });

    expect(result.isSuccess).toBe(true);
    const category = result.getValue();
    expect(category.name).toBe('Pães Especiais');
    expect(category.normalizedName).toBe('PAES ESPECIAIS');
    expect(category.partnerId).toBe('partner-123');
    expect(category.createdByUserId).toBe('user-123');
    expect(category.status).toBe('PENDING_APPROVAL');
    expect(category.visibility).toBe('RESTRICTED');
    expect(category.isPending()).toBe(true);
    expect(category.isApproved()).toBe(false);
    expect(category.isPubliclyVisible()).toBe(false);
  });

  it('should fail if name is empty or less than 2 chars', () => {
    const result = Category.create({
      name: ' ',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('pelo menos 2 caracteres');
  });

  it('should fail if name exceeds 100 chars', () => {
    const result = Category.create({
      name: 'a'.repeat(101),
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('não pode exceder 100 caracteres');
  });

  it('should approve as global successfully', () => {
    const category = Category.create({
      name: 'Doces Veganos',
      partnerId: 'partner-123',
    }).getValue();

    category.approveAsGlobal();

    expect(category.isApproved()).toBe(true);
    expect(category.isGlobal()).toBe(true);
    expect(category.isRestricted()).toBe(false);
    expect(category.isPubliclyVisible()).toBe(true);
    expect(category.rejectionReason).toBeUndefined();
  });

  it('should approve as restricted to partner successfully', () => {
    const category = Category.create({
      name: 'Receitas Exclusivas da Casa',
      partnerId: 'partner-123',
    }).getValue();

    category.approveAsRestricted();

    expect(category.isApproved()).toBe(true);
    expect(category.isRestricted()).toBe(true);
    expect(category.isGlobal()).toBe(false);
    expect(category.isPubliclyVisible()).toBe(true);
    expect(category.rejectionReason).toBeUndefined();
  });

  it('should reject category with reason', () => {
    const category = Category.create({
      name: 'Categoria Inapropriada',
      partnerId: 'partner-123',
    }).getValue();

    const rejectResult = category.reject('Nome fora do padrão alimentar do CeLiLac.');

    expect(rejectResult.isSuccess).toBe(true);
    expect(category.isRejected()).toBe(true);
    expect(category.isApproved()).toBe(false);
    expect(category.rejectionReason).toBe('Nome fora do padrão alimentar do CeLiLac.');
  });

  it('should fail rejecting category without reason', () => {
    const category = Category.create({
      name: 'Categoria Teste',
      partnerId: 'partner-123',
    }).getValue();

    const rejectResult = category.reject('');

    expect(rejectResult.isFailure).toBe(true);
    expect(rejectResult.getError()).toContain('motivo da rejeição');
  });
});
