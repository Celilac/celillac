// backend/tests/unit/application/catalog/UpdateProductUseCase.spec.ts
import { UpdateProductUseCase } from '../../../../src/application/catalog/UpdateProductUseCase';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Product } from '../../../../src/domain/catalog/Product';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('UpdateProductUseCase', () => {
  let repository: jest.Mocked<IProductCatalogRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let useCase: UpdateProductUseCase;

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
    useCase = new UpdateProductUseCase(repository, partnerRepository);
  });

  it('deve atualizar um produto com sucesso se o parceiro for o dono', async () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: 'Arroz cru',
      hasGluten: false,
      crossContamination: '',
      partnerId: 'partner-1',
    }, 'prod-1').getValue();

    repository.findById.mockResolvedValue(product);
    partnerRepository.findAllByUserId.mockResolvedValue([mockPartner]);

    const result = await useCase.execute({
      id: 'prod-1',
      partnerUserId: 'user-1',
      name: 'Arroz Agulhinha',
      brand: 'Marca A Novo',
      ingredients: 'Arroz cru especial',
      hasGluten: false,
      crossContamination: 'Pode conter soja',
      price: 12.90,
      category: 'Cereais',
      imageUrl: 'http://image.com/arroz.jpg',
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.update).toHaveBeenCalled();
    const updated = result.getValue();
    expect(updated.name).toBe('Arroz Agulhinha');
    expect(updated.brand).toBe('Marca A Novo');
    expect(updated.price).toBe(12.90);
  });

  it('deve falhar se o parceiro solicitante não for o dono do produto', async () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: 'Arroz cru',
      hasGluten: false,
      crossContamination: '',
      partnerId: 'partner-1',
    }, 'prod-1').getValue();

    repository.findById.mockResolvedValue(product);
    partnerRepository.findAllByUserId.mockResolvedValue([mockAnotherPartner]); // Outro parceiro

    const result = await useCase.execute({
      id: 'prod-1',
      partnerUserId: 'user-2',
      name: 'Arroz Agulhinha',
      brand: 'Marca A Novo',
      ingredients: 'Arroz cru especial',
      hasGluten: false,
      crossContamination: '',
      price: 12.90,
      category: 'Cereais',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Acesso negado: Este produto pertence a outro parceiro');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('deve falhar se o produto não existir', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      id: 'prod-inexistente',
      partnerUserId: 'user-1',
      name: 'Arroz Agulhinha',
      brand: 'Marca A Novo',
      ingredients: 'Arroz cru especial',
      hasGluten: false,
      crossContamination: '',
      price: 12.90,
      category: 'Cereais',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Produto não encontrado.');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
