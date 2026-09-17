// backend/tests/unit/domain/catalog/Product.spec.ts
import { Product } from '../../../../src/domain/catalog/Product';

describe('Product Entity', () => {
  it('deve criar um produto ANALISADO se possuir ingredientes', () => {
    const result = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: 'Arroz cru',
      hasGluten: false,
      crossContamination: '',
    });

    expect(result.isSuccess).toBe(true);
    const product = result.getValue();
    expect(product.analysisStatus).toBe('ANALISADO');
    expect(product.isActive).toBe(true); // Default
  });

  it('deve criar um produto PENDENTE_DE_ANALISE se não possuir ingredientes', () => {
    const result = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: '',
    });

    expect(result.isSuccess).toBe(true);
    const product = result.getValue();
    expect(product.analysisStatus).toBe('PENDENTE_DE_ANALISE');
  });

  it('deve permitir criar produto inativo', () => {
    const result = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: '',
      isActive: false,
    });

    expect(result.isSuccess).toBe(true);
    const product = result.getValue();
    expect(product.isActive).toBe(false);
  });

  it('deve inativar e reativar produto', () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: '',
    }).getValue();

    expect(product.isActive).toBe(true);
    product.inactivate();
    expect(product.isActive).toBe(false);
    product.activate();
    expect(product.isActive).toBe(true);
  });

  it('deve falhar se crossContamination não for fornecido', () => {
    const result = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: undefined as any,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('crossContamination é obrigatório');
  });

  it('deve falhar se o nome for vazio', () => {
    const result = Product.create({
      name: '   ',
      brand: 'Marca A',
      ingredients: 'Ingredientes',
      hasGluten: false,
      crossContamination: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('nome do produto é obrigatório');
  });

  it('deve atualizar ingredientes e recalcular status', () => {
    const product = Product.create({
      name: 'Arroz',
      brand: 'Marca A',
      ingredients: '',
      hasGluten: false,
      crossContamination: '',
    }).getValue();

    expect(product.analysisStatus).toBe('PENDENTE_DE_ANALISE');

    product.updateIngredients('Arroz agulhinha');
    expect(product.ingredients).toBe('Arroz agulhinha');
    expect(product.analysisStatus).toBe('ANALISADO');
  });

  describe('Novos Campos da Fase 1 - Identificação e Composição', () => {
    it('deve criar produto com todos os campos opcionais da Fase 1 preenchidos', () => {
      const result = Product.create({
        name: 'Pão Artesanal',
        brand: 'Padaria Segura',
        ingredients: 'Farinha de arroz, polvilho doce, água',
        hasGluten: false,
        crossContamination: 'Ambiente 100% sem glúten',
        shortDescription: 'Pão fatiado macio',
        netContent: 450,
        unitOfMeasure: 'g',
        sku: 'PAO-450G',
        ean: '7891234567890',
        commercialOrigin: 'OWN_MANUFACTURE',
        mayContainTraces: 'Pode conter ovos',
        compositionNotes: 'Fermentação biológica lenta',
        publicationStatus: 'PUBLISHED',
      });

      expect(result.isSuccess).toBe(true);
      const product = result.getValue();
      expect(product.shortDescription).toBe('Pão fatiado macio');
      expect(product.netContent).toBe(450);
      expect(product.unitOfMeasure).toBe('g');
      expect(product.sku).toBe('PAO-450G');
      expect(product.ean).toBe('7891234567890');
      expect(product.commercialOrigin).toBe('OWN_MANUFACTURE');
      expect(product.mayContainTraces).toBe('Pode conter ovos');
      expect(product.compositionNotes).toBe('Fermentação biológica lenta');
      expect(product.publicationStatus).toBe('PUBLISHED');
    });

    it('deve falhar se netContent for negativo', () => {
      const result = Product.create({
        name: 'Bolo de Milho',
        brand: 'Marca',
        ingredients: 'Milho',
        hasGluten: false,
        crossContamination: '',
        netContent: -10,
      });

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('quantidade/peso do produto não pode ser negativa');
    });

    it('deve falhar se EAN for inválido (letras ou tamanho incorreto)', () => {
      const resultAlpha = Product.create({
        name: 'Biscoito',
        crossContamination: '',
        ean: '789ABC123456',
      });
      expect(resultAlpha.isFailure).toBe(true);
      expect(resultAlpha.getError()).toContain('código de barras (EAN)');

      const resultShort = Product.create({
        name: 'Biscoito',
        crossContamination: '',
        ean: '12345',
      });
      expect(resultShort.isFailure).toBe(true);
      expect(resultShort.getError()).toContain('código de barras (EAN)');
    });

    it('deve permitir salvar como rascunho e publicar posteriormente', () => {
      const product = Product.create({
        name: 'Rascunho de Biscoito',
        crossContamination: '',
        publicationStatus: 'DRAFT',
      }).getValue();

      expect(product.publicationStatus).toBe('DRAFT');

      // Tentar publicar sem ingredientes deve falhar
      const pubFail = product.publish();
      expect(pubFail.isFailure).toBe(true);
      expect(pubFail.getError()).toContain('ingredientes é obrigatória');

      // Atualizar ingredientes e publicar com sucesso
      product.updateIngredients('Polvilho, sal, água');
      const pubSuccess = product.publish();
      expect(pubSuccess.isSuccess).toBe(true);
      expect(product.publicationStatus).toBe('PUBLISHED');
    });
  });

  describe('Novos Campos da Fase 2 - Galeria de Imagens do Produto', () => {
    it('deve criar produto com galeria de imagens e sincronizar a capa automaticamente com imageUrl', () => {
      const result = Product.create({
        name: 'Bolo de Cenoura',
        brand: 'Doceria',
        ingredients: 'Cenoura, ovos, açúcar, farinha de arroz',
        hasGluten: false,
        crossContamination: 'Sem glúten',
        images: [
          {
            url: 'https://cdn.example.com/bolo-1.jpg',
            imageType: 'PRODUCT',
            caption: 'Foto do bolo fatiado',
            displayOrder: 0,
            isCover: false,
          },
          {
            url: 'https://cdn.example.com/rotulo.jpg',
            imageType: 'LABEL',
            caption: 'Rótulo frontal',
            displayOrder: 1,
            isCover: true,
          },
        ],
      });

      expect(result.isSuccess).toBe(true);
      const product = result.getValue();
      expect(product.images).toHaveLength(2);
      expect(product.coverImage).toBeDefined();
      expect(product.coverImage?.url).toBe('https://cdn.example.com/rotulo.jpg');
      expect(product.coverImage?.imageType).toBe('LABEL');
      expect(product.imageUrl).toBe('https://cdn.example.com/rotulo.jpg');
    });

    it('deve definir a primeira imagem como capa caso nenhuma tenha sido marcada explicitamente', () => {
      const result = Product.create({
        name: 'Cookie de Chocolate',
        crossContamination: '',
        images: [
          {
            url: 'https://cdn.example.com/cookie-main.jpg',
            imageType: 'PRODUCT',
          },
          {
            url: 'https://cdn.example.com/cookie-ingredients.jpg',
            imageType: 'INGREDIENTS',
          },
        ],
      });

      expect(result.isSuccess).toBe(true);
      const product = result.getValue();
      expect(product.images).toHaveLength(2);
      expect(product.coverImage?.url).toBe('https://cdn.example.com/cookie-main.jpg');
      expect(product.coverImage?.isCover).toBe(true);
      expect(product.imageUrl).toBe('https://cdn.example.com/cookie-main.jpg');
    });
  });

  describe('Novos Campos da Fase 3 - Segurança Avançada, Estilos e Evidências', () => {
    it('deve sincronizar hasGluten automaticamente a partir de declaredAllergens', () => {
      const pContains = Product.create({
        name: 'Cerveja Tradicional de Trigo',
        crossContamination: 'Ambiente com trigo',
        declaredAllergens: {
          GLUTEN: 'CONTAINS',
          MILK: 'FREE',
        },
      }).getValue();
      expect(pContains.hasGluten).toBe(true);
      expect(pContains.declaredAllergens['GLUTEN']).toBe('CONTAINS');
      expect(pContains.declaredAllergens['MILK']).toBe('FREE');

      const pFree = Product.create({
        name: 'Pão de Mandioca Sem Glúten',
        crossContamination: 'Cozinha sem glúten',
        hasGluten: true, // Fornecido true, mas a matriz declara FREE
        declaredAllergens: {
          GLUTEN: 'FREE',
          EGGS: 'CONTAINS',
        },
      }).getValue();
      expect(pFree.hasGluten).toBe(false);
      expect(pFree.declaredAllergens['GLUTEN']).toBe('FREE');
    });

    it('deve registrar estilos de vida, informações nutricionais e origem da informação', () => {
      const result = Product.create({
        name: 'Granola Low Carb Vegana',
        crossContamination: 'Sem contaminação cruzada',
        dietaryFeatures: ['VEGAN', 'NO_ADDED_SUGAR', 'ORGANIC'],
        informationOrigin: 'PARTNER_DECLARED',
        nutritionalInfo: {
          servingSize: '40g',
          calories: 180,
          carbohydrates: 12,
          totalSugars: 2,
          addedSugars: 0,
          proteins: 6,
          totalFat: 11,
          saturatedFat: 2,
          dietaryFiber: 5,
          sodium: 25,
        },
        crossContaminationDetails: {
          environmentRisk: 'EXCLUSIVE_ENVIRONMENT',
          cleaningProtocolNotes: 'Higienização com autoclave e linhas dedicadas sem alérgenos',
        },
      });

      expect(result.isSuccess).toBe(true);
      const product = result.getValue();
      expect(product.dietaryFeatures).toEqual(['VEGAN', 'NO_ADDED_SUGAR', 'ORGANIC']);
      expect(product.informationOrigin).toBe('PARTNER_DECLARED');
      expect(product.nutritionalInfo?.calories).toBe(180);
      expect(product.nutritionalInfo?.addedSugars).toBe(0);
      expect(product.crossContaminationDetails?.environmentRisk).toBe('EXCLUSIVE_ENVIRONMENT');
    });

    it('deve instanciar certificações associadas ao produto', () => {
      const result = Product.create({
        name: 'Farinha de Amêndoas Pura',
        crossContamination: 'Linha exclusiva',
        certifications: [
          {
            certificationType: 'ACELBRA_SEAL',
            certifyingEntity: 'ACELBRA',
            certificateCode: 'CERT-12345',
            validUntil: '2027-12-31',
          },
          {
            certificationType: 'VEGAN_SVB',
            certifyingEntity: 'SVB',
          },
        ],
      });

      expect(result.isSuccess).toBe(true);
      const product = result.getValue();
      expect(product.certifications).toHaveLength(2);
      expect(product.certifications[0].certificationType).toBe('ACELBRA_SEAL');
      expect(product.certifications[0].certificateCode).toBe('CERT-12345');
      expect(product.certifications[1].certifyingEntity).toBe('SVB');
    });
  });
});

