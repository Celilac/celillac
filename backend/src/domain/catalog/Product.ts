// backend/src/domain/catalog/Product.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { ProductImage, ProductImageType } from './ProductImage';
import { AllergenPresence } from './value-objects/AllergenPresence';
import { DietaryFeature } from './value-objects/DietaryFeature';
import { InformationOrigin } from './value-objects/InformationOrigin';
import { ProductCertification, CertificationVerificationStatus } from './ProductCertification';

export type AnalysisStatus = 'PENDENTE_DE_ANALISE' | 'ANALISADO';
export type CommercialOrigin = 'OWN_MANUFACTURE' | 'THIRD_PARTY_RESELL';
export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export interface NutritionalInfo {
  servingSize?:    string; // Ex: "50g (2 fatias)"
  calories?:       number; // kcal
  carbohydrates?:  number; // g
  totalSugars?:    number; // g
  addedSugars?:    number; // g
  proteins?:       number; // g
  totalFat?:       number; // g
  saturatedFat?:   number; // g
  dietaryFiber?:   number; // g
  sodium?:         number; // mg
}

export interface CrossContaminationDetails {
  environmentRisk?:       'EXCLUSIVE_ENVIRONMENT' | 'SHARED_WITH_PROTOCOL' | 'SHARED_ENVIRONMENT' | 'UNKNOWN_RISK';
  allergenRisks?:         Record<string, 'EXCLUSIVE_ENVIRONMENT' | 'SHARED_WITH_PROTOCOL' | 'SHARED_ENVIRONMENT' | 'UNKNOWN_RISK'>;
  cleaningProtocolNotes?: string;
  riskLevel?:             string;
  isolationProtocols?:    string;
  sanitizationProtocol?:  string;
}

export interface ProductProps {
  name:                       string;
  brand:                      string;
  ingredients:                string;
  hasGluten:                  boolean;
  crossContamination:         string;
  analysisStatus:             AnalysisStatus;
  partnerId?:                 string;
  price:                      number;
  category:                   string;
  imageUrl?:                  string;
  isActive:                   boolean;
  // Campos da Fase 1 - Identificação & Composição
  shortDescription?:          string;
  netContent?:                number;
  unitOfMeasure?:             string;
  sku?:                       string;
  ean?:                       string;
  commercialOrigin:           CommercialOrigin;
  mayContainTraces:           string;
  compositionNotes?:          string;
  publicationStatus:          PublicationStatus;
  // Campos da Fase 2 - Galeria de Imagens Funcionais
  images:                     ProductImage[];
  // Campos da Fase 3 - Segurança Avançada, Estilos e Evidências
  declaredAllergens:          Record<string, AllergenPresence>;
  crossContaminationDetails?: CrossContaminationDetails;
  dietaryFeatures:            DietaryFeature[];
  informationOrigin:          InformationOrigin;
  nutritionalInfo?:           NutritionalInfo;
  certifications:             ProductCertification[];
}

/**
 * Product — Agregado Raiz do Contexto de Catálogo.
 * 
 * Regras:
 * 1. Produto sem ingredientes tem status PENDENTE_DE_ANALISE.
 * 2. cross_contamination é obrigatório (mesmo que string vazia).
 * 3. preço não pode ser negativo.
 * 4. categoria é obrigatória (padrão 'Geral').
 * 5. Se publicationStatus === 'DRAFT', permite criação com dados preliminares.
 * 6. Se EAN for fornecido, deve conter entre 8 e 14 dígitos numéricos.
 * 7. Galeria de imagens sincroniza a capa com o campo imageUrl legado.
 */
export class Product extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: string) {
    super(props, id);
  }

  get name(): string { return this.props.name; }
  get brand(): string { return this.props.brand; }
  get ingredients(): string { return this.props.ingredients; }
  get hasGluten(): boolean { return this.props.hasGluten; }
  get crossContamination(): string { return this.props.crossContamination; }
  get analysisStatus(): AnalysisStatus { return this.props.analysisStatus; }
  get partnerId(): string | undefined { return this.props.partnerId; }
  get price(): number { return this.props.price; }
  get category(): string { return this.props.category; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get isActive(): boolean { return this.props.isActive; }

  // Getters Fase 1
  get shortDescription(): string | undefined { return this.props.shortDescription; }
  get netContent(): number | undefined { return this.props.netContent; }
  get unitOfMeasure(): string | undefined { return this.props.unitOfMeasure; }
  get sku(): string | undefined { return this.props.sku; }
  get ean(): string | undefined { return this.props.ean; }
  get commercialOrigin(): CommercialOrigin { return this.props.commercialOrigin; }
  get mayContainTraces(): string { return this.props.mayContainTraces; }
  get compositionNotes(): string | undefined { return this.props.compositionNotes; }
  get publicationStatus(): PublicationStatus { return this.props.publicationStatus; }

  // Getters Fase 2 - Galeria de Imagens
  get images(): ProductImage[] { return this.props.images ?? []; }
  get coverImage(): ProductImage | undefined {
    const list = this.images;
    return list.find(img => img.isCover) || list[0];
  }

  // Getters Fase 3 - Segurança Avançada, Estilos e Evidências
  get declaredAllergens(): Record<string, AllergenPresence> {
    return this.props.declaredAllergens ?? {};
  }
  get crossContaminationDetails(): CrossContaminationDetails | undefined {
    return this.props.crossContaminationDetails;
  }
  get dietaryFeatures(): DietaryFeature[] {
    return this.props.dietaryFeatures ?? [];
  }
  get informationOrigin(): InformationOrigin {
    return this.props.informationOrigin ?? 'PARTNER_DECLARED';
  }
  get nutritionalInfo(): NutritionalInfo | undefined {
    return this.props.nutritionalInfo;
  }
  get certifications(): ProductCertification[] {
    return this.props.certifications ?? [];
  }

  setDeclaredAllergen(allergen: string, presence: AllergenPresence): void {
    if (!this.props.declaredAllergens) {
      this.props.declaredAllergens = {};
    }
    this.props.declaredAllergens[allergen] = presence;
    if (allergen === 'GLUTEN') {
      if (presence === 'CONTAINS') this.props.hasGluten = true;
      else if (presence === 'FREE') this.props.hasGluten = false;
    }
  }

  setDietaryFeatures(features: DietaryFeature[]): void {
    this.props.dietaryFeatures = features;
  }

  setNutritionalInfo(info: NutritionalInfo): void {
    this.props.nutritionalInfo = info;
  }

  setCertifications(certifications: ProductCertification[]): void {
    this.props.certifications = certifications;
  }

  /**
   * Atualiza a coleção de imagens e sincroniza a imagem de capa com imageUrl
   */
  setImages(images: ProductImage[]): void {
    this.props.images = images;
    const cover = this.coverImage;
    if (cover) {
      this.props.imageUrl = cover.url;
    }
  }

  /**
   * Adiciona uma nova imagem à galeria
   */
  addImage(image: ProductImage): void {
    if (!this.props.images) {
      this.props.images = [];
    }
    this.props.images.push(image);
    if (!this.props.imageUrl || image.isCover) {
      this.props.imageUrl = image.url;
    }
  }

  /**
   * Remove uma imagem por índice
   */
  removeImage(index: number): void {
    if (this.props.images && index >= 0 && index < this.props.images.length) {
      this.props.images.splice(index, 1);
      const cover = this.coverImage;
      this.props.imageUrl = cover ? cover.url : undefined;
    }
  }

  /**
   * Desativa o produto (exclusão lógica / indisponível)
   */
  inactivate(): void {
    this.props.isActive = false;
    this.props.publicationStatus = 'INACTIVE';
  }

  /**
   * Ativa o produto
   */
  activate(): void {
    this.props.isActive = true;
    if (this.props.publicationStatus === 'INACTIVE') {
      this.props.publicationStatus = 'PUBLISHED';
    }
  }

  /**
   * Salva como rascunho
   */
  saveAsDraft(): void {
    this.props.publicationStatus = 'DRAFT';
  }

  /**
   * Publica o produto no catálogo após validação de requisitos
   */
  publish(): Result<void> {
    if (!this.props.ingredients || this.props.ingredients.trim().length === 0) {
      return Result.fail<void>('A lista de ingredientes é obrigatória para publicar o produto.');
    }
    this.props.publicationStatus = 'PUBLISHED';
    this.props.isActive = true;
    return Result.ok<void>(undefined as any);
  }

  /**
   * Atualiza os ingredientes e recalcula o status de análise
   */
  updateIngredients(ingredients: string): void {
    this.props.ingredients = ingredients;
    this.props.analysisStatus = Product.determineAnalysisStatus(ingredients);
  }

  static create(
    props: {
      name:                        string;
      brand?:                      string;
      ingredients?:                string;
      hasGluten?:                  boolean;
      crossContamination?:         string;
      analysisStatus?:             AnalysisStatus;
      partnerId?:                  string;
      price?:                      number;
      category?:                   string;
      imageUrl?:                   string;
      isActive?:                   boolean;
      shortDescription?:           string;
      netContent?:                 number;
      unitOfMeasure?:              string;
      sku?:                        string;
      ean?:                        string;
      commercialOrigin?:           CommercialOrigin;
      mayContainTraces?:           string;
      compositionNotes?:           string;
      publicationStatus?:          PublicationStatus;
      images?:                     Array<ProductImage | {
        id?:           string;
        productId?:    string;
        url:           string;
        imageType?:    ProductImageType;
        caption?:      string;
        displayOrder?: number;
        isCover?:      boolean;
      }>;
      declaredAllergens?:          Record<string, AllergenPresence>;
      crossContaminationDetails?: CrossContaminationDetails;
      dietaryFeatures?:            DietaryFeature[];
      informationOrigin?:          InformationOrigin;
      nutritionalInfo?:           NutritionalInfo;
      certifications?:             Array<ProductCertification | {
        id?:                 string;
        productId?:          string;
        certificationType:   string;
        certifyingEntity:    string;
        certificateCode?:    string;
        validUntil?:         string;
        imageId?:            string;
        verificationStatus?: CertificationVerificationStatus;
        verificationNotes?:  string;
      }>;
    },
    id?: string
  ): Result<Product> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Product>('O nome do produto é obrigatório.');
    }
    
    const publicationStatus: PublicationStatus = props.publicationStatus ?? 'PUBLISHED';

    if (publicationStatus !== 'DRAFT') {
      if (props.crossContamination === undefined || props.crossContamination === null) {
        return Result.fail<Product>('O campo crossContamination é obrigatório.');
      }
    }

    const crossContamination = props.crossContamination !== undefined && props.crossContamination !== null
      ? props.crossContamination.trim()
      : '';

    const price = props.price ?? 0.00;
    if (price < 0) {
      return Result.fail<Product>('O preço do produto não pode ser negativo.');
    }

    if (props.netContent !== undefined && props.netContent !== null && props.netContent < 0) {
      return Result.fail<Product>('A quantidade/peso do produto não pode ser negativa.');
    }

    if (props.ean && props.ean.trim().length > 0) {
      const cleanEan = props.ean.trim();
      if (!/^\d{8,14}$/.test(cleanEan)) {
        return Result.fail<Product>('O código de barras (EAN) deve conter entre 8 e 14 dígitos numéricos.');
      }
    }

    const category = props.category ? props.category.trim() : 'Geral';
    if (category.length === 0) {
      return Result.fail<Product>('A categoria do produto é obrigatória.');
    }

    const analysisStatus = props.analysisStatus ?? Product.determineAnalysisStatus(props.ingredients);
    const isActive = props.isActive ?? (publicationStatus !== 'INACTIVE');
    const commercialOrigin: CommercialOrigin = props.commercialOrigin ?? 'OWN_MANUFACTURE';
    const mayContainTraces = (props.mayContainTraces || '').trim();

    // Mapeamento e instanciação segura de ProductImage
    const domainImages: ProductImage[] = [];
    if (props.images && props.images.length > 0) {
      let hasExplicitCover = false;
      for (let i = 0; i < props.images.length; i++) {
        const item = props.images[i];
        if (item instanceof ProductImage) {
          if (item.isCover) hasExplicitCover = true;
          domainImages.push(item);
        } else {
          const isCover = Boolean(item.isCover);
          if (isCover) hasExplicitCover = true;
          const imgRes = ProductImage.create({
            productId: item.productId || id,
            url: item.url,
            imageType: item.imageType,
            caption: item.caption,
            displayOrder: item.displayOrder !== undefined ? item.displayOrder : i,
            isCover,
          }, item.id);
          if (imgRes.isSuccess) {
            domainImages.push(imgRes.getValue());
          }
        }
      }
      // Se nenhuma imagem foi explicitamente marcada como capa, define a primeira
      if (!hasExplicitCover && domainImages.length > 0) {
        domainImages[0].markAsCover();
      }
    }

    // Sincronização de imageUrl: se não fornecida diretamente, herda da capa
    let resolvedImageUrl = props.imageUrl ? props.imageUrl.trim() : undefined;
    if (!resolvedImageUrl && domainImages.length > 0) {
      const cover = domainImages.find(img => img.isCover) || domainImages[0];
      resolvedImageUrl = cover?.url;
    }

    // Sincronização com hasGluten a partir de declaredAllergens se presente
    let resolvedHasGluten = props.hasGluten ?? false;
    const declaredAllergens = props.declaredAllergens || {};
    if (declaredAllergens['GLUTEN'] === 'CONTAINS') {
      resolvedHasGluten = true;
    } else if (declaredAllergens['GLUTEN'] === 'FREE') {
      resolvedHasGluten = false;
    }

    const dietaryFeatures = props.dietaryFeatures || [];
    const informationOrigin: InformationOrigin = props.informationOrigin || 'PARTNER_DECLARED';
    const nutritionalInfo = props.nutritionalInfo;
    const crossContaminationDetails = props.crossContaminationDetails;

    // Mapeamento e instanciação segura de ProductCertification
    const domainCertifications: ProductCertification[] = [];
    if (props.certifications && props.certifications.length > 0) {
      for (const cert of props.certifications) {
        if (cert instanceof ProductCertification) {
          domainCertifications.push(cert);
        } else {
          const certRes = ProductCertification.create({
            productId: cert.productId || id,
            certificationType: cert.certificationType,
            certifyingEntity: cert.certifyingEntity,
            certificateCode: cert.certificateCode,
            validUntil: cert.validUntil,
            imageId: cert.imageId,
            verificationStatus: cert.verificationStatus,
            verificationNotes: cert.verificationNotes,
          }, cert.id);
          if (certRes.isSuccess) {
            domainCertifications.push(certRes.getValue());
          }
        }
      }
    }

    return Result.ok<Product>(
      new Product(
        {
          name: props.name.trim(),
          brand: (props.brand || '').trim(),
          ingredients: (props.ingredients || '').trim(),
          hasGluten: resolvedHasGluten,
          crossContamination: crossContamination,
          analysisStatus,
          partnerId: props.partnerId,
          price,
          category,
          imageUrl: resolvedImageUrl,
          isActive,
          shortDescription: props.shortDescription ? props.shortDescription.trim() : undefined,
          netContent: props.netContent !== undefined && props.netContent !== null ? Number(props.netContent) : undefined,
          unitOfMeasure: props.unitOfMeasure ? props.unitOfMeasure.trim() : undefined,
          sku: props.sku ? props.sku.trim() : undefined,
          ean: props.ean ? props.ean.trim() : undefined,
          commercialOrigin,
          mayContainTraces,
          compositionNotes: props.compositionNotes ? props.compositionNotes.trim() : undefined,
          publicationStatus,
          images: domainImages,
          declaredAllergens,
          crossContaminationDetails,
          dietaryFeatures,
          informationOrigin,
          nutritionalInfo,
          certifications: domainCertifications,
        },
        id
      )
    );
  }

  private static determineAnalysisStatus(ingredients?: string): AnalysisStatus {
    if (!ingredients || ingredients.trim().length === 0) {
      return 'PENDENTE_DE_ANALISE';
    }
    return 'ANALISADO';
  }
}

