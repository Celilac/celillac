// backend/tests/unit/application/catalog/InactivateProductUseCase.spec.ts
import { InactivateProductUseCase } from '../../../../src/application/catalog/InactivateProductUseCase';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Product } from '../../../../src/domain/catalog/Product';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('InactivateProductUseCase', () => {
  let repository: jest.Mocked<IProductCatalogRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let useCase: InactivateProductUseCase;

  const mockPartner = Partner.create({
    userId: 'user-1',
    name: 'Sabor Celíaco',
    cnpj: '12.345.678/0001-95',
    address: 'Rua das Flores, 123',
    description: 'Restaurante sem glúten',
    phone: '1234-5678',
    type: PartnerType.RESTAURANT,
    approvalStatus: PartnerApprovalStatus.APPROVED,
    operationalStatus: PartnerOperationalStatus.ACTIVE,
  }, 'partner-1').getValue();

  const mockAnotherPartner = Partner.create({
    userId: 'user-2',
    name: 'Confeitaria SemG',
    cnpj: '12.345.678/0001-90',
    address: 'Rua das Flores, 124',
    description: 'Doces artesanais',
    phone: '1234-5678',
    type: PartnerType.INDEPENDENT_PRODUCER,
    approvalStatus: PartnerApprovalStatus.APPROVED,
    operationalStatus: PartnerOperationalStatus.ACTIVE,
  }, 'partner-2').getValue();

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      search: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;
    useCase = new InactivateProductUseCase(repository, partnerRepository);
  });

  it('deve inativar um produto com sucesso se o parceiro for o dono', async () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: 'Arroz cru',
      hasGluten: false,
      crossContamination: '',
      partnerId: 'partner-1',
      isActive: true,
    }, 'prod-1').getValue();

    repository.findById.mockResolvedValue(product);
    partnerRepository.findAllByUserId.mockResolvedValue([mockPartner]);

    const result = await useCase.execute({
      id: 'prod-1',
      partnerUserId: 'user-1',
      isActive: false, // Inativar
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.update).toHaveBeenCalled();
    expect(product.isActive).toBe(false);
  });

  it('deve reativar um produto com sucesso se o parceiro for o dono', async () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: 'Arroz cru',
      hasGluten: false,
      crossContamination: '',
      partnerId: 'partner-1',
      isActive: false, // Começa inativo
    }, 'prod-1').getValue();

    repository.findById.mockResolvedValue(product);
    partnerRepository.findAllByUserId.mockResolvedValue([mockPartner]);

    const result = await useCase.execute({
      id: 'prod-1',
      partnerUserId: 'user-1',
      isActive: true, // Ativar
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.update).toHaveBeenCalled();
    expect(product.isActive).toBe(true);
  });

  it('deve falhar ao inativar se o parceiro solicitante não for dono', async () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: 'Arroz cru',
      hasGluten: false,
      crossContamination: '',
      partnerId: 'partner-1',
      isActive: true,
    }, 'prod-1').getValue();

    repository.findById.mockResolvedValue(product);
    partnerRepository.findAllByUserId.mockResolvedValue([mockAnotherPartner]);

    const result = await useCase.execute({
      id: 'prod-1',
      partnerUserId: 'user-2',
      isActive: false,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Acesso negado: Este produto pertence a outro parceiro');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
