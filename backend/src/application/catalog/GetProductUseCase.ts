// backend/src/application/catalog/GetProductUseCase.ts
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { ProductSearchResponseDTO } from './SearchProductsUseCase';
import { AllergenEngine } from '../../domain/allergen-engine/AllergenEngine';
import { Result } from '../../domain/Result';

export interface GetProductDTO {
  id:                      string;
  userIdForCompatibility?: string;
}

export class GetProductUseCase {
  constructor(
    private readonly productRepository: IProductCatalogRepository,
    private readonly foodProfileRepository?: IFoodProfileRepository
  ) {}

  async execute(dto: GetProductDTO): Promise<Result<ProductSearchResponseDTO>> {
    if (!dto.id) {
      return Result.fail<ProductSearchResponseDTO>('O ID do produto é obrigatório.');
    }

    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail<ProductSearchResponseDTO>('Produto não encontrado.');
    }

    const response: ProductSearchResponseDTO = {
      id:                 product.id,
      name:               product.name,
      brand:              product.brand,
      ingredients:        product.ingredients,
      hasGluten:          product.hasGluten,
      crossContamination: product.crossContamination,
      analysisStatus:     product.analysisStatus,
      partnerId:          product.partnerId,
      price:              product.price,
      category:           product.category,
      imageUrl:           product.imageUrl,
    };

    // Calcular compatibilidade dinamicamente se o perfil do usuário for solicitado
    if (dto.userIdForCompatibility && this.foodProfileRepository) {
      const userProfile = await this.foodProfileRepository.findByUserId(dto.userIdForCompatibility);
      if (userProfile && userProfile.isActive()) {
        const productSnapshot = {
          id:                 product.id,
          name:               product.name,
          ingredients:        product.ingredients,
          hasGluten:          product.hasGluten,
          crossContamination: product.crossContamination,
        };

        const compatibilityReport = AllergenEngine.check(userProfile, productSnapshot);
        response.compatibilityReport = compatibilityReport;
      }
    }

    return Result.ok<ProductSearchResponseDTO>(response);
  }
}
