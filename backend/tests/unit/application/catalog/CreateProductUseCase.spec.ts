// backend/tests/unit/application/catalog/CreateProductUseCase.spec.ts
import { CreateProductUseCase } from '../../../../src/application/catalog/CreateProductUseCase';
import { IProductCatalogRepository } from '../../../../src/domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../../../src/domain/partner/repositories/IPartnerRepository';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../../../src/domain/partner/Partner';

describe('CreateProductUseCase', () => {
  let repository: jest.Mocked<IProductCatalogRepository>;
  let partnerRepository: jest.Mocked<IPartnerRepository>;
  let useCase: CreateProductUseCase;

  const mockActivePartner = Partner.create({
    userId: 'user-1',
    name: 'Padaria SemG',
    address: 'Rua Central, 100',
    description: 'Cozinha sem contaminação',
    phone: '1234-5678',
    type: PartnerType.RESTAURANT,
    approvalStatus: PartnerApprovalStatus.APPROVED,
    operationalStatus: PartnerOperationalStatus.ACTIVE,
  }, 'partner-1').getValue();

  const mockInactivePartner = Partner.create({
    userId: 'user-2',
    name: 'Confeitaria Doce',
    address: 'Rua Central, 101',
    description: 'Doces artesanais',
    phone: '1234-5678',
    type: PartnerType.INDEPENDENT_PRODUCER,
    approvalStatus: PartnerApprovalStatus.DRAFT, // Rascunho
    operationalStatus: PartnerOperationalStatus.INACTIVE, // Inativo
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
    useCase = new CreateProductUseCase(repository, partnerRepository);
  });

  it('deve criar um produto com sucesso se o parceiro for ativo', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-1',
      price: 15.50,
      category: 'Biscoitos',
      imageUrl: 'http://image.com/biscoito.jpg',
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.create).toHaveBeenCalled();
    const product = result.getValue();
    expect(product.analysisStatus).toBe('ANALISADO');
    expect(product.price).toBe(15.50);
    expect(product.category).toBe('Biscoitos');
    expect(product.imageUrl).toBe('http://image.com/biscoito.jpg');
    expect(product.partnerId).toBe('partner-1');
  });

  it('deve falhar se o partnerId for nulo ou vazio', async () => {
    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('parceiro comercial (partnerId) é obrigatório');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro comercial não existir no banco', async () => {
    partnerRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-inexistente',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Parceiro comercial não encontrado');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve falhar se o parceiro comercial estiver inativo', async () => {
    partnerRepository.findById.mockResolvedValue(mockInactivePartner);

    const result = await useCase.execute({
      name: 'Biscoito',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-2',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('parceiro comercial não está autorizado a cadastrar produtos');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve falhar se os dados do produto forem inválidos', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: '',
      brand: 'Marca X',
      ingredients: 'Farinha',
      hasGluten: true,
      crossContamination: '',
      partnerId: 'partner-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('nome do produto é obrigatório');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve criar um produto com os campos da Fase 1 (origem comercial, peso, rascunho)', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: 'Pão de Mandioca',
      brand: 'Artesanal',
      ingredients: 'Polvilho doce, farinha de mandioca, água, sal',
      hasGluten: false,
      crossContamination: 'Nenhum',
      partnerId: 'partner-1',
      price: 18.00,
      category: 'Padaria & Confeitaria',
      shortDescription: 'Pão fresco sem glúten',
      netContent: 500,
      unitOfMeasure: 'g',
      sku: 'PAO-MAN-500',
      ean: '7891234567890',
      commercialOrigin: 'OWN_MANUFACTURE',
      mayContainTraces: 'Pode conter traços de gergelim',
      compositionNotes: 'Receita tradicional da família',
      publicationStatus: 'PUBLISHED',
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.create).toHaveBeenCalled();
    const product = result.getValue();
    expect(product.commercialOrigin).toBe('OWN_MANUFACTURE');
    expect(product.netContent).toBe(500);
    expect(product.unitOfMeasure).toBe('g');
    expect(product.sku).toBe('PAO-MAN-500');
    expect(product.ean).toBe('7891234567890');
    expect(product.mayContainTraces).toBe('Pode conter traços de gergelim');
    expect(product.publicationStatus).toBe('PUBLISHED');
  });

  it('deve permitir salvar como DRAFT mesmo sem ingredientes', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: 'Novo Produto em Desenvolvimento',
      partnerId: 'partner-1',
      publicationStatus: 'DRAFT',
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.create).toHaveBeenCalled();
    const product = result.getValue();
    expect(product.publicationStatus).toBe('DRAFT');
    expect(product.name).toBe('Novo Produto em Desenvolvimento');
  });

  it('deve falhar ao tentar publicar com PUBLISHED se ingredientes estiverem vazios', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: 'Produto Sem Ingredientes',
      ingredients: '   ',
      partnerId: 'partner-1',
      publicationStatus: 'PUBLISHED',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('ingredientes é obrigatória');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve criar produto com galeria de imagens da Fase 2 e retornar no DTO', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: 'Pão de Queijo Mineiro',
      brand: 'Delícias de Minas',
      ingredients: 'Polvilho azedo, queijo minas curado, ovos, óleo vegetal, sal',
      hasGluten: false,
      crossContamination: 'Ambiente controlado',
      partnerId: 'partner-1',
      price: 22.50,
      images: [
        {
          url: 'https://images.example.com/pao-embalagem.jpg',
          imageType: 'PACKAGING',
          caption: 'Embalagem de 500g',
          displayOrder: 0,
          isCover: false,
        },
        {
          url: 'https://images.example.com/pao-pronto.jpg',
          imageType: 'PRODUCT',
          caption: 'Pão de queijo assado quentinho',
          displayOrder: 1,
          isCover: true,
        },
        {
          url: 'https://images.example.com/pao-rotulo.jpg',
          imageType: 'LABEL',
          caption: 'Rótulo com selo Sem Glúten',
          displayOrder: 2,
          isCover: false,
        },
      ],
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.create).toHaveBeenCalled();
    const product = result.getValue();
    expect(product.images).toBeDefined();
    expect(product.images).toHaveLength(3);
    expect(product.imageUrl).toBe('https://images.example.com/pao-pronto.jpg');
    expect(product.images![1].isCover).toBe(true);
    expect(product.images![1].imageType).toBe('PRODUCT');
  });

  it('deve criar produto com dados completos da Fase 3 (matriz, estilos, nutricional e certificações)', async () => {
    partnerRepository.findById.mockResolvedValue(mockActivePartner);

    const result = await useCase.execute({
      name: 'Iogurte Vegano de Coco',
      brand: 'Vida Pura',
      ingredients: 'Leite de coco, fermento lácteo vegetal, polpa de morango',
      hasGluten: false,
      crossContamination: 'Sem traços',
      partnerId: 'partner-1',
      price: 12.90,
      declaredAllergens: {
        GLUTEN: 'FREE',
        MILK: 'FREE',
        SOY: 'FREE',
        EGGS: 'FREE',
      },
      crossContaminationDetails: {
        environmentRisk: 'EXCLUSIVE_ENVIRONMENT',
        cleaningProtocolNotes: 'Linha isolada para produtos vegetais',
      },
      dietaryFeatures: ['VEGAN', 'NO_ADDED_SUGAR', 'ORGANIC'],
      informationOrigin: 'PARTNER_DECLARED',
      nutritionalInfo: {
        servingSize: '150g',
        calories: 95,
        carbohydrates: 6,
        totalSugars: 4,
        addedSugars: 0,
        proteins: 2,
        totalFat: 7,
        saturatedFat: 6,
        dietaryFiber: 1,
        sodium: 15,
      },
      certifications: [
        {
          certificationType: 'VEGAN_SVB',
          certifyingEntity: 'Sociedade Vegetariana Brasileira',
          certificateCode: 'SVB-VEG-9021',
          validUntil: '2027-06-30',
        },
      ],
    });

    expect(result.isSuccess).toBe(true);
    expect(repository.create).toHaveBeenCalled();
    const product = result.getValue();
    expect(product.declaredAllergens?.['GLUTEN']).toBe('FREE');
    expect(product.declaredAllergens?.['MILK']).toBe('FREE');
    expect(product.dietaryFeatures).toContain('VEGAN');
    expect(product.dietaryFeatures).toContain('ORGANIC');
    expect(product.crossContaminationDetails?.environmentRisk).toBe('EXCLUSIVE_ENVIRONMENT');
    expect(product.nutritionalInfo?.calories).toBe(95);
    expect(product.certifications).toHaveLength(1);
    expect(product.certifications?.[0].certificationType).toBe('VEGAN_SVB');
    expect(product.certifications?.[0].certificateCode).toBe('SVB-VEG-9021');
  });
});

