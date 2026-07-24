import { SubmitReviewUseCase } from '../../../../src/application/reviews/SubmitReviewUseCase';
import { IReviewRepository } from '../../../../src/domain/reviews/repositories/IReviewRepository';
import { IProductRepository } from '../../../../src/domain/allergen-engine/repositories/IProductRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Product } from '../../../../src/domain/catalog/Product';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';
import { Review } from '../../../../src/domain/reviews/Review';

describe('SubmitReviewUseCase', () => {
  let submitReviewUseCase: SubmitReviewUseCase;
  let mockReviewRepo: jest.Mocked<IReviewRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockPartnerRepo: jest.Mocked<IPartnerRepository>;

  const activePartner = Partner.create({
    userId: 'user-2',
    name: 'Sabor Celíaco',
    cnpj: '12.345.678/0001-95',
    address: 'Rua das Flores, 123',
    description: '100% livre de glúten',
    phone: '1234-5678',
    type: PartnerType.RESTAURANT,
    approvalStatus: PartnerApprovalStatus.APPROVED,
    operationalStatus: PartnerOperationalStatus.ACTIVE,
  }, 'partner-1').getValue();

  beforeEach(() => {
    mockReviewRepo = {
      save: jest.fn(),
      findByUserAndProduct: jest.fn(),
      findByProduct: jest.fn(),
      findByUserAndPartner: jest.fn(),
      findByPartner: jest.fn(),
    };

    mockProductRepo = {
      findById: jest.fn(),
    };

    mockPartnerRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;

    submitReviewUseCase = new SubmitReviewUseCase(mockReviewRepo, mockProductRepo, mockPartnerRepo);
  });

  it('deve submeter uma avaliação com sucesso para um produto existente', async () => {
    mockProductRepo.findById.mockResolvedValue(
      Product.create({ name: 'Pão', brand: '', ingredients: 'Farinha', hasGluten: true, crossContamination: '' }).getValue()
    );

    mockReviewRepo.findByUserAndProduct.mockResolvedValue(null);

    const result = await submitReviewUseCase.execute({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 4,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockReviewRepo.save).toHaveBeenCalledTimes(1);
    expect(result.getValue().rating).toBe(4);
  });

  it('deve submeter uma avaliação com sucesso para um parceiro existente', async () => {
    mockPartnerRepo.findById.mockResolvedValue(activePartner);
    mockReviewRepo.findByUserAndPartner.mockResolvedValue(null);

    const result = await submitReviewUseCase.execute({
      userId: 'user-1',
      partnerId: 'partner-1',
      rating: 5,
      comment: 'Lugar maravilhoso e seguro!',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockReviewRepo.save).toHaveBeenCalledTimes(1);
    expect(result.getValue().rating).toBe(5);
    expect(result.getValue().partnerId).toBe('partner-1');
  });

  it('deve atualizar a avaliação de parceiro se o usuário já avaliou o parceiro', async () => {
    mockPartnerRepo.findById.mockResolvedValue(activePartner);

    const existingReview = Review.create({
      userId: 'user-1',
      partnerId: 'partner-1',
      rating: 3,
    }, 'review-1').getValue();

    mockReviewRepo.findByUserAndPartner.mockResolvedValue(existingReview);

    const result = await submitReviewUseCase.execute({
      userId: 'user-1',
      partnerId: 'partner-1',
      rating: 5,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().id).toBe('review-1'); // O ID foi preservado
    expect(result.getValue().rating).toBe(5);
  });

  it('deve falhar se o produto não existir', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    const result = await submitReviewUseCase.execute({
      userId: 'user-1',
      productId: 'prod-1',
      rating: 4,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Produto não encontrado no catálogo.');
  });

  it('deve falhar se o parceiro não existir', async () => {
    mockPartnerRepo.findById.mockResolvedValue(null);

    const result = await submitReviewUseCase.execute({
      userId: 'user-1',
      partnerId: 'partner-inexistente',
      rating: 4,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Parceiro comercial não encontrado.');
  });
});
