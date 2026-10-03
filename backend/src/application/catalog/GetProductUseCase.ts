// backend/src/application/catalog/GetProductUseCase.ts
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { ProductResponseDTO } from './CreateProductUseCase';
import { CompatibilityReport } from '../../domain/allergen-engine/CompatibilityReport';
import { AllergenEngine } from '../../domain/allergen-engine/AllergenEngine';
import { toProductSnapshot } from './mappers/toProductSnapshot';
import { Result } from '../../domain/Result';

export interface ProductDetailsResponseDTO extends ProductResponseDTO {
  compatibilityReport?: CompatibilityReport;
}

export interface GetProductDTO {
  id:                      string;
  userIdForCompatibility?: string;
}

export class GetProductUseCase {
  constructor(
    private readonly productRepository: IProductCatalogRepository,
    private readonly foodProfileRepository?: IFoodProfileRepository
  ) {}

  async execute(dto: GetProductDTO): Promise<Result<ProductDetailsResponseDTO>> {
    if (!dto.id) {
      return Result.fail<ProductDetailsResponseDTO>('O ID do produto é obrigatório.');
    }

    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail<ProductDetailsResponseDTO>('Produto não encontrado.');
    }

    const response: ProductDetailsResponseDTO = {
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
      images:                      product.images.map((img) => ({
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
      certifications:              product.certifications.map((c) => ({
        id:                 c.id,
        certificationType:   c.certificationType,
        certifyingEntity:    c.certifyingEntity,
        certificateCode:    c.certificateCode,
        validUntil:         c.validUntil,
        imageId:            c.imageId,
        verificationStatus: c.verificationStatus,
        verificationNotes:  c.verificationNotes,
      })),
    };

    // Calcular compatibilidade dinamicamente se o perfil do usuário for solicitado
    if (dto.userIdForCompatibility && this.foodProfileRepository) {
      const userProfile = await this.foodProfileRepository.findByUserId(dto.userIdForCompatibility);
      if (userProfile && userProfile.isActive()) {
        const compatibilityReport = AllergenEngine.check(userProfile, toProductSnapshot(product));
        response.compatibilityReport = compatibilityReport;
      }
    }

    return Result.ok<ProductDetailsResponseDTO>(response);
  }
}

