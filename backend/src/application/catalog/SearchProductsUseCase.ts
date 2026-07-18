// backend/src/application/catalog/SearchProductsUseCase.ts
import { IProductCatalogRepository, PaginatedResult } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { AllergenEngine } from '../../domain/allergen-engine/AllergenEngine';
import { CompatibilityReport } from '../../domain/allergen-engine/CompatibilityReport';
import { Result } from '../../domain/Result';
import { AnalysisStatus } from '../../domain/catalog/Product';

export interface SearchProductsDTO {
  query?:                  string;
  page?:                   number;
  limit?:                  number;
  avoidAllergens?:         string[];
  partnerId?:              string;
  userIdForCompatibility?: string;
  onlyCompatible?:         boolean;
}

export interface ProductSearchResponseDTO {
  id:                  string;
  name:                string;
  brand:               string;
  ingredients:         string;
  hasGluten:           boolean;
  crossContamination:  string;
  analysisStatus:      AnalysisStatus;
  partnerId?:          string;
  price:               number;
  category:            string;
  imageUrl?:           string;
  compatibilityReport?: CompatibilityReport;
}

export class SearchProductsUseCase {
  constructor(
    private readonly productRepository: IProductCatalogRepository,
    private readonly foodProfileRepository?: IFoodProfileRepository
  ) {}

  async execute(dto: SearchProductsDTO): Promise<Result<PaginatedResult<ProductSearchResponseDTO>>> {
    const term = (dto.query || '').trim();
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(100, Math.max(1, dto.limit || 20));
    
    let avoidAllergens = dto.avoidAllergens ? [...dto.avoidAllergens] : [];
    let userProfile: any = null;

    // Se fornecido o usuário para compatibilidade, carregamos o perfil
    if (dto.userIdForCompatibility && this.foodProfileRepository) {
      userProfile = await this.foodProfileRepository.findByUserId(dto.userIdForCompatibility);
      
      // Se for solicitado retornar apenas produtos compatíveis (SAFE) e o usuário tiver restrições,
      // nós adicionamos todos os alérgenos do perfil aos alérgenos a evitar no banco de dados.
      if (dto.onlyCompatible && userProfile && userProfile.isActive()) {
        const profileAllergens = userProfile.restrictions.map((r: any) => r.allergen);
        avoidAllergens = Array.from(new Set([...avoidAllergens, ...profileAllergens]));
      }
    }

    const paginatedProducts = await this.productRepository.search({
      term,
      page,
      limit,
      avoidAllergens,
      partnerId: dto.partnerId,
    });

    const data: ProductSearchResponseDTO[] = paginatedProducts.data.map((product) => {
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

      // Se o perfil do usuário foi carregado, calcula o relatório de compatibilidade dinâmico
      if (userProfile) {
        // Adaptador de Product para ProductSnapshot do AllergenEngine
        const productSnapshot = {
          id:                 product.id,
          name:               product.name,
          ingredients:        product.ingredients,
          hasGluten:          product.hasGluten,
          crossContamination: product.crossContamination,
        };
        response.compatibilityReport = AllergenEngine.check(userProfile, productSnapshot);
      }

      return response;
    });

    return Result.ok<PaginatedResult<ProductSearchResponseDTO>>({
      data,
      total: paginatedProducts.total,
      page:  paginatedProducts.page,
      limit: paginatedProducts.limit,
    });
  }
}
