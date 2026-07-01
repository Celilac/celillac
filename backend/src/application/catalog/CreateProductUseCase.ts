// backend/src/application/catalog/CreateProductUseCase.ts
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { Product, AnalysisStatus } from '../../domain/catalog/Product';
import { Result } from '../../domain/Result';

export interface CreateProductDTO {
  name:               string;
  brand:              string;
  ingredients:        string;
  hasGluten:          boolean;
  crossContamination: string;
}

export interface ProductResponseDTO {
  id:                 string;
  name:               string;
  brand:              string;
  ingredients:        string;
  hasGluten:          boolean;
  crossContamination: string;
  analysisStatus:     AnalysisStatus;
}

export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductCatalogRepository) {}

  async execute(dto: CreateProductDTO): Promise<Result<ProductResponseDTO>> {
    const productResult = Product.create({
      name: dto.name,
      brand: dto.brand,
      ingredients: dto.ingredients,
      hasGluten: dto.hasGluten,
      crossContamination: dto.crossContamination,
    });

    if (productResult.isFailure) {
      return Result.fail<ProductResponseDTO>(productResult.getError());
    }

    const product = productResult.getValue();
    await this.productRepository.create(product);

    return Result.ok<ProductResponseDTO>({
      id:                 product.id,
      name:               product.name,
      brand:              product.brand,
      ingredients:        product.ingredients,
      hasGluten:          product.hasGluten,
      crossContamination: product.crossContamination,
      analysisStatus:     product.analysisStatus,
    });
  }
}
