// backend/src/application/catalog/UpdateProductUseCase.ts
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Product, AnalysisStatus, CommercialOrigin, PublicationStatus, NutritionalInfo, CrossContaminationDetails } from '../../domain/catalog/Product';
import { Result } from '../../domain/Result';
import { ProductResponseDTO, ProductImageDTO, ProductCertificationDTO } from './CreateProductUseCase';
import { AllergenPresence } from '../../domain/catalog/value-objects/AllergenPresence';
import { DietaryFeature } from '../../domain/catalog/value-objects/DietaryFeature';
import { InformationOrigin } from '../../domain/catalog/value-objects/InformationOrigin';
import { VerifyPartnerPublicationCapability } from '../../domain/partner/services/VerifyPartnerPublicationCapability';

export interface UpdateProductDTO {
  id:                          string;
  partnerUserId:               string; // ID do usuário que solicita a alteração
  name:                        string;
  brand?:                      string;
  ingredients?:                string;
  hasGluten?:                  boolean;
  crossContamination?:         string;
  price?:                      number;
  category?:                   string;
  imageUrl?:                   string;
  isActive?:                   boolean;
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
  // Campos da Fase 2
  images?:                     ProductImageDTO[];
  // Campos da Fase 3
  declaredAllergens?:          Record<string, AllergenPresence>;
  crossContaminationDetails?: CrossContaminationDetails;
  dietaryFeatures?:            DietaryFeature[];
  informationOrigin?:          InformationOrigin;
  nutritionalInfo?:           NutritionalInfo;
  certifications?:             ProductCertificationDTO[];
}

export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: IProductCatalogRepository,
    private readonly partnerRepository: IPartnerRepository
  ) {}

  async execute(dto: UpdateProductDTO): Promise<Result<ProductResponseDTO>> {
    // 1. Buscar o produto
    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail<ProductResponseDTO>('Produto não encontrado.');
    }

    // 2. Buscar todos os parceiros gerenciados pelo usuário solicitante
    const partners = await this.partnerRepository.findAllByUserId(dto.partnerUserId);
    const partner = partners.find(p => p.id === product.partnerId);
    if (!partner) {
      return Result.fail<ProductResponseDTO>('Acesso negado: Este produto pertence a outro parceiro comercial ou você não tem permissão sobre ele.');
    }

    // 3. Validar se o parceiro pode atualizar o produto
    const canPublish = VerifyPartnerPublicationCapability.check(partner);
    if (!canPublish) {
      return Result.fail<ProductResponseDTO>('O parceiro comercial não está autorizado a atualizar produtos (cadastro deve estar aprovado e não suspenso/inativo).');
    }

    const publicationStatus = dto.publicationStatus ?? product.publicationStatus;
    const ingredients = dto.ingredients !== undefined ? dto.ingredients : product.ingredients;

    // Se estiver publicando, ingredientes são obrigatórios
    if (publicationStatus === 'PUBLISHED' && (!ingredients || ingredients.trim().length === 0)) {
      return Result.fail<ProductResponseDTO>('A lista de ingredientes é obrigatória para publicar o produto no catálogo.');
    }

    // 4. Criar a nova entidade com os novos dados preservando o ID original
    const updatedProductResult = Product.create(
      {
        name:                      dto.name !== undefined ? dto.name : product.name,
        brand:                     dto.brand !== undefined ? dto.brand : product.brand,
        ingredients:               ingredients,
        hasGluten:                 dto.hasGluten !== undefined ? dto.hasGluten : product.hasGluten,
        crossContamination:        dto.crossContamination !== undefined ? dto.crossContamination : product.crossContamination,
        partnerId:                 product.partnerId,
        price:                     dto.price !== undefined ? dto.price : product.price,
        category:                  dto.category !== undefined ? dto.category : product.category,
        imageUrl:                  dto.imageUrl !== undefined ? dto.imageUrl : product.imageUrl,
        isActive:                  dto.isActive !== undefined ? dto.isActive : product.isActive,
        shortDescription:          dto.shortDescription !== undefined ? dto.shortDescription : product.shortDescription,
        netContent:                dto.netContent !== undefined ? dto.netContent : product.netContent,
        unitOfMeasure:             dto.unitOfMeasure !== undefined ? dto.unitOfMeasure : product.unitOfMeasure,
        sku:                       dto.sku !== undefined ? dto.sku : product.sku,
        ean:                       dto.ean !== undefined ? dto.ean : product.ean,
        commercialOrigin:          dto.commercialOrigin !== undefined ? dto.commercialOrigin : product.commercialOrigin,
        mayContainTraces:          dto.mayContainTraces !== undefined ? dto.mayContainTraces : product.mayContainTraces,
        compositionNotes:          dto.compositionNotes !== undefined ? dto.compositionNotes : product.compositionNotes,
        publicationStatus:         publicationStatus,
        images:                    dto.images !== undefined ? dto.images : product.images,
        declaredAllergens:         dto.declaredAllergens !== undefined ? dto.declaredAllergens : product.declaredAllergens,
        crossContaminationDetails: dto.crossContaminationDetails !== undefined ? dto.crossContaminationDetails : product.crossContaminationDetails,
        dietaryFeatures:           dto.dietaryFeatures !== undefined ? dto.dietaryFeatures : product.dietaryFeatures,
        informationOrigin:         dto.informationOrigin !== undefined ? dto.informationOrigin : product.informationOrigin,
        nutritionalInfo:          dto.nutritionalInfo !== undefined ? dto.nutritionalInfo : product.nutritionalInfo,
        certifications:            dto.certifications !== undefined ? dto.certifications : product.certifications,
      },
      product.id
    );

    if (updatedProductResult.isFailure) {
      return Result.fail<ProductResponseDTO>(updatedProductResult.getError());
    }

    const updatedProduct = updatedProductResult.getValue();
    await this.productRepository.update(updatedProduct);

    return Result.ok<ProductResponseDTO>({
      id:                          updatedProduct.id,
      name:                        updatedProduct.name,
      brand:                       updatedProduct.brand,
      ingredients:                 updatedProduct.ingredients,
      hasGluten:                   updatedProduct.hasGluten,
      crossContamination:          updatedProduct.crossContamination,
      analysisStatus:              updatedProduct.analysisStatus,
      partnerId:                   updatedProduct.partnerId,
      price:                       updatedProduct.price,
      category:                    updatedProduct.category,
      imageUrl:                    updatedProduct.imageUrl,
      isActive:                    updatedProduct.isActive,
      shortDescription:            updatedProduct.shortDescription,
      netContent:                  updatedProduct.netContent,
      unitOfMeasure:               updatedProduct.unitOfMeasure,
      sku:                         updatedProduct.sku,
      ean:                         updatedProduct.ean,
      commercialOrigin:            updatedProduct.commercialOrigin,
      mayContainTraces:            updatedProduct.mayContainTraces,
      compositionNotes:            updatedProduct.compositionNotes,
      publicationStatus:           updatedProduct.publicationStatus,
      images:                      updatedProduct.images.map(img => ({
        id:           img.id,
        url:          img.url,
        imageType:    img.imageType,
        caption:      img.caption,
        displayOrder: img.displayOrder,
        isCover:      img.isCover,
      })),
      declaredAllergens:           updatedProduct.declaredAllergens,
      crossContaminationDetails:  updatedProduct.crossContaminationDetails,
      dietaryFeatures:             updatedProduct.dietaryFeatures,
      informationOrigin:           updatedProduct.informationOrigin,
      nutritionalInfo:            updatedProduct.nutritionalInfo,
      certifications:              updatedProduct.certifications.map(c => ({
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
