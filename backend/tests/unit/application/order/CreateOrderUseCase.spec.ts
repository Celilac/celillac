// backend/tests/unit/application/order/CreateOrderUseCase.spec.ts
import { CreateOrderUseCase } from '../../../../src/application/order/CreateOrderUseCase';
import { IOrderRepository } from '../../../../src/domain/order/repositories/IOrderRepository';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { IFoodProfileRepository } from '../../../../src/domain/food-profile/repositories/IFoodProfileRepository';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';
import { Product } from '../../../../src/domain/catalog/Product';
import { FoodProfile } from '../../../../src/domain/food-profile/FoodProfile';
import { Restriction } from '../../../../src/domain/food-profile/Restriction';
import { AllergenType } from '../../../../src/domain/food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../../../../src/domain/food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../../../../src/domain/food-profile/value-objects/RestrictionType';
import { Order } from '../../../../src/domain/order/entities/Order';

describe('CreateOrderUseCase Unit Tests', () => {
  let orderRepository: jest.Mocked<IOrderRepository>;
  let productRepository: jest.Mocked<IProductCatalogRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let foodProfileRepository: jest.Mocked<IFoodProfileRepository>;
  let useCase: CreateOrderUseCase;

  const partnerId = 'partner-100';
  const consumerId = 'consumer-200';

  const createMockPartner = (isActive = true) => {
    return Partner.create(
      {
        userId: 'user-partner-1',
        name: 'Restaurante Sem Glúten Seguro',
        description: 'Cozinha 100% livre de glúten',
        address: 'Rua Segura, 123',
        phone: '+5511999998888',
        type: PartnerType.RESTAURANT,
        approvalStatus: isActive ? PartnerApprovalStatus.APPROVED : PartnerApprovalStatus.PENDING_REVIEW,
        operationalStatus: isActive ? PartnerOperationalStatus.ACTIVE : PartnerOperationalStatus.INACTIVE,
      },
      partnerId
    ).getValue();
  };

  const createMockProfile = (hasFatalGluten = true) => {
    const restriction = Restriction.create({
      allergen: AllergenType.GLUTEN,
      severity: hasFatalGluten ? SeverityLevel.FATAL : SeverityLevel.LOW,
      type: RestrictionType.MEDICAL_RESTRICTION,
    }).getValue();

    return FoodProfile.create(
      {
        userId: consumerId,
        restrictions: [restriction],
        acceptsCrossContamination: false,
      },
      'profile-1'
    ).getValue();
  };

  const createMockProduct = (id: string, name: string, hasGluten: boolean, pId = partnerId) => {
    return Product.create(
      {
        name,
        brand: 'CeLiLac Marca',
        ingredients: hasGluten ? 'Farinha de trigo, água, fermento' : 'Farinha de arroz, polvilho doce, sal',
        hasGluten,
        crossContamination: hasGluten ? 'Contém trigo' : 'Instalação dedicada sem contaminação cruzada',
        price: 25.0,
        category: 'Padaria',
        partnerId: pId,
        isActive: true,
      },
      id
    ).getValue();
  };

  beforeEach(() => {
    orderRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByConsumerId: jest.fn(),
      findByPartnerId: jest.fn(),
    };

    productRepository = {
      create: jest.fn(),
      search: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    partnerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCnpj: jest.fn(),
      findAllByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    foodProfileRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    useCase = new CreateOrderUseCase(
      orderRepository,
      productRepository,
      partnerRepository,
      foodProfileRepository
    );
  });

  it('deve criar um pedido com sucesso para produtos 100% seguros', async () => {
    partnerRepository.findById.mockResolvedValue(createMockPartner(true));
    foodProfileRepository.findByUserId.mockResolvedValue(createMockProfile(true));

    const safeProduct = createMockProduct('prod-safe-1', 'Pão Seguro', false);
    productRepository.findById.mockResolvedValue(safeProduct);

    const result = await useCase.execute({
      consumerId,
      partnerId,
      items: [{ productId: 'prod-safe-1', quantity: 2 }],
      deliveryFee: 12.0,
      notes: 'Entregar na portaria',
    });

    expect(result.isSuccess).toBe(true);
    const output = result.getValue();
    expect(output.status).toBe('CREATED');
    expect(output.subtotalAmount).toBe(50.0);
    expect(output.deliveryFee).toBe(12.0);
    expect(output.totalAmount).toBe(62.0);
    expect(output.allergenCheckVerdict).toBe('SAFE');
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
  });

  it('deve BLOQUEAR a criação do pedido se o produto contiver alérgeno fatal (AllergenEngine Trava Biológica)', async () => {
    partnerRepository.findById.mockResolvedValue(createMockPartner(true));
    foodProfileRepository.findByUserId.mockResolvedValue(createMockProfile(true)); // Celíaco Fatal

    const dangerProduct = createMockProduct('prod-danger-1', 'Bolo Tradicional com Glúten', true);
    productRepository.findById.mockResolvedValue(dangerProduct);

    const result = await useCase.execute({
      consumerId,
      partnerId,
      items: [{ productId: 'prod-danger-1', quantity: 1 }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('BLOQUEIO DE SEGURANÇA ALIMENTAR');
    expect(result.getError()).toContain('Bolo Tradicional com Glúten');
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro não estiver ativo ou homologado', async () => {
    partnerRepository.findById.mockResolvedValue(createMockPartner(false));

    const result = await useCase.execute({
      consumerId,
      partnerId,
      items: [{ productId: 'prod-1', quantity: 1 }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('O estabelecimento parceiro não está apto ou ativo');
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('deve falhar se o consumidor não tiver perfil alimentar configurado', async () => {
    partnerRepository.findById.mockResolvedValue(createMockPartner(true));
    foodProfileRepository.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute({
      consumerId,
      partnerId,
      items: [{ productId: 'prod-1', quantity: 1 }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Você precisa ter um perfil alimentar configurado');
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('deve falhar se o produto não pertencer ao estabelecimento informado', async () => {
    partnerRepository.findById.mockResolvedValue(createMockPartner(true));
    foodProfileRepository.findByUserId.mockResolvedValue(createMockProfile(true));

    const otherPartnerProduct = createMockProduct('prod-other-1', 'Produto Alheio', false, 'other-partner-999');
    productRepository.findById.mockResolvedValue(otherPartnerProduct);

    const result = await useCase.execute({
      consumerId,
      partnerId,
      items: [{ productId: 'prod-other-1', quantity: 1 }],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('não pertence ao estabelecimento selecionado');
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});
