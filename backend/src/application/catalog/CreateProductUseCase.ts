// backend/src/application/catalog/CreateProductUseCase.ts
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Product, AnalysisStatus, CommercialOrigin, PublicationStatus, NutritionalInfo, CrossContaminationDetails } from '../../domain/catalog/Product';
import { ProductImageType } from '../../domain/catalog/ProductImage';
import { AllergenPresence } from '../../domain/catalog/value-objects/AllergenPresence';
import { DietaryFeature } from '../../domain/catalog/value-objects/DietaryFeature';
import { InformationOrigin } from '../../domain/catalog/value-objects/InformationOrigin';
import { CertificationVerificationStatus } from '../../domain/catalog/ProductCertification';
import { Result } from '../../domain/Result';
import { VerifyPartnerPublicationCapability } from '../../domain/partner/services/VerifyPartnerPublicationCapability';

export interface ProductImageDTO {
  id?:           string;
  url:           string;
  imageType:     ProductImageType;
  caption?:      string;
  displayOrder?: number;
  isCover?:      boolean;
}

export interface ProductCertificationDTO {
  id?:                 string;
  certificationType:   string;
  certifyingEntity:    string;
  certificateCode?:    string;
  validUntil?:         string;
  imageId?:            string;
  verificationStatus?: CertificationVerificationStatus;
  verificationNotes?:  string;
}

export interface CreateProductDTO {
  name:                        string;
  brand?:                      string;
  ingredients?:                string;
  hasGluten?:                  boolean;
  crossContamination?:         string;
  partnerId?:                  string;
  price?:                      number;
  category?:                   string;
  imageUrl?:                   string;
  // Campos da Fase 1
  shortDescription?:           string;
  netContent?:                 number;
  unitOfMeasure?:              string;
  sku?:                        string;
  ean?:                        string;
  commercialOrigin?:           CommercialOrigin;
  mayContainTraces?:           string;
  compositionNotes?:           string;
  publicationStatus?:          PublicationStatus;
  // Campos da Fase 2 - Galeria de Imagens
  images?:                     ProductImageDTO[];
  // Campos da Fase 3 - Segurança Avançada, Estilos e Evidências
  declaredAllergens?:          Record<string, AllergenPresence>;
  crossContaminationDetails?: CrossContaminationDetails;
  dietaryFeatures?:            DietaryFeature[];
  informationOrigin?:          InformationOrigin;
  nutritionalInfo?:           NutritionalInfo;
  certifications?:             ProductCertificationDTO[];
}

export interface ProductResponseDTO {
  id:                          string;
  name:                        string;
  brand:                       string;
  ingredients:                 string;
  hasGluten:                   boolean;
  crossContamination:          string;
  analysisStatus:              AnalysisStatus;
  partnerId?:                  string;
  price:                       number;
  category:                    string;
  imageUrl?:                   string;
  isActive:                    boolean;
  shortDescription?:           string;
  netContent?:                 number;
  unitOfMeasure?:              string;
  sku?:                        string;
  ean?:                        string;
  commercialOrigin:            CommercialOrigin;
  mayContainTraces:            string;
  compositionNotes?:           string;
  publicationStatus:           PublicationStatus;
  images:                      ProductImageDTO[];
  declaredAllergens?:          Record<string, AllergenPresence>;
  crossContaminationDetails?: CrossContaminationDetails;
  dietaryFeatures?:            DietaryFeature[];
  informationOrigin?:          InformationOrigin;
  nutritionalInfo?:           NutritionalInfo;
  certifications?:             ProductCertificationDTO[];
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductCatalogRepository,
    private readonly partnerRepository?: IPartnerRepository
  ) {}

  async execute(dto: CreateProductDTO): Promise<Result<ProductResponseDTO>> {
    // Validação de Segurança: O partnerId é obrigatório e deve ser de um parceiro ativo
    if (!dto.partnerId) {
      return Result.fail<ProductResponseDTO>('O preenchimento do parceiro comercial (partnerId) é obrigatório.');
    }

    if (this.partnerRepository) {
      const partner = await this.partnerRepository.findById(dto.partnerId);
      if (!partner) {
        return Result.fail<ProductResponseDTO>('Parceiro comercial não encontrado no sistema.');
      }
      const canPublish = VerifyPartnerPublicationCapability.check(partner);
      if (!canPublish) {
        return Result.fail<ProductResponseDTO>('O parceiro comercial não está autorizado a cadastrar produtos (cadastro deve estar aprovado e não suspenso/inativo).');
      }
    }

    const publicationStatus = dto.publicationStatus ?? 'PUBLISHED';

    // Se estiver publicando, ingredientes são obrigatórios
    if (publicationStatus === 'PUBLISHED' && (!dto.ingredients || dto.ingredients.trim().length === 0)) {
      return Result.fail<ProductResponseDTO>('A lista de ingredientes é obrigatória para publicar o produto no catálogo.');
    }

    const productResult = Product.create({
      name:                        dto.name,
      brand:                       dto.brand || '',
      ingredients:                 dto.ingredients || '',
      hasGluten:                   dto.hasGluten ?? false,
      crossContamination:          dto.crossContamination ?? '',
      partnerId:                   dto.partnerId,
      price:                       dto.price ?? 0,
      category:                    dto.category || 'Geral',
      imageUrl:                    dto.imageUrl,
      shortDescription:            dto.shortDescription,
      netContent:                  dto.netContent,
      unitOfMeasure:               dto.unitOfMeasure,
      sku:                         dto.sku,
      ean:                         dto.ean,
      commercialOrigin:            dto.commercialOrigin ?? 'OWN_MANUFACTURE',
      mayContainTraces:            dto.mayContainTraces ?? '',
      compositionNotes:            dto.compositionNotes,
      publicationStatus,
      images:                      dto.images,
      declaredAllergens:           dto.declaredAllergens,
      crossContaminationDetails:  dto.crossContaminationDetails,
      dietaryFeatures:             dto.dietaryFeatures,
      informationOrigin:           dto.informationOrigin,
      nutritionalInfo:            dto.nutritionalInfo,
      certifications:              dto.certifications,
    });

    if (productResult.isFailure) {
      return Result.fail<ProductResponseDTO>(productResult.getError());
    }

    const product = productResult.getValue();
    await this.productRepository.create(product);

    return Result.ok<ProductResponseDTO>({
      id:                          product.id,
      name:                        product.name,
      brand:                       product.brand,
      ingredients:                 product.ingredients,
      hasGluten:                   product.hasGluten,
      crossContamination:          product.crossContamination,
      analysisStatus:              product.analysisStatus,
      partnerId:                   product.partnerId,
      price:                       product.price,
      category:                    product.category,
      imageUrl:                    product.imageUrl,
      isActive:                    product.isActive,
      shortDescription:            product.shortDescription,
      netContent:                  product.netContent,
      unitOfMeasure:               product.unitOfMeasure,
      sku:                         product.sku,
      ean:                         product.ean,
      commercialOrigin:            product.commercialOrigin,
      mayContainTraces:            product.mayContainTraces,
      compositionNotes:            product.compositionNotes,
      publicationStatus:           product.publicationStatus,
      images:                      product.images.map(img => ({
        id:           img.id,
        url:          img.url,
        imageType:    img.imageType,
        caption:      img.caption,
        displayOrder: img.displayOrder,
        isCover:      img.isCover,
      })),
      declaredAllergens:           product.declaredAllergens,
      crossContaminationDetails:  product.crossContaminationDetails,
      dietaryFeatures:             product.dietaryFeatures,
      informationOrigin:           product.informationOrigin,
      nutritionalInfo:            product.nutritionalInfo,
      certifications:              product.certifications.map(c => ({
        id:                 c.id,
        certificationType:   c.certificationType,
        certifyingEntity:    c.certifyingEntity,
        certificateCode:    c.certificateCode,
        validUntil:         c.validUntil,
        imageId:            c.imageId,
        verificationStatus: c.verificationStatus,
        verificationNotes:  c.verificationNotes,
      })),
    });
  }
}
