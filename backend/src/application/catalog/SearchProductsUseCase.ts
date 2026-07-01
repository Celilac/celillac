// backend/src/application/catalog/SearchProductsUseCase.ts
import { IProductCatalogRepository, PaginatedResult } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { Result } from '../../domain/Result';
import { ProductResponseDTO } from './CreateProductUseCase';

export interface SearchProductsDTO {
  query?: string;
  page?:  number;
  limit?: number;
}

export class SearchProductsUseCase {
  constructor(private readonly productRepository: IProductCatalogRepository) {}

  async execute(dto: SearchProductsDTO): Promise<Result<PaginatedResult<ProductResponseDTO>>> {
    const term  = (dto.query || '').trim();
    const page  = Math.max(1, dto.page || 1);
    const limit = Math.min(100, Math.max(1, dto.limit || 20)); // Limita entre 1 e 100 por página

    const paginatedProducts = await this.productRepository.search({ term, page, limit });

    const data: ProductResponseDTO[] = paginatedProducts.data.map((product) => ({
      id:                 product.id,
      name:               product.name,
      brand:              product.brand,
      ingredients:        product.ingredients,
      hasGluten:          product.hasGluten,
      crossContamination: product.crossContamination,
      analysisStatus:     product.analysisStatus,
    }));

    return Result.ok<PaginatedResult<ProductResponseDTO>>({
      data,
      total: paginatedProducts.total,
      page:  paginatedProducts.page,
      limit: paginatedProducts.limit,
    });
  }
}
