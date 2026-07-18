// backend/src/application/catalog/CreateProductUseCase.ts
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Product, AnalysisStatus } from '../../domain/catalog/Product';
import { Result } from '../../domain/Result';

export interface CreateProductDTO {
  name:               string;
  brand:              string;
  ingredients:        string;
  hasGluten:          boolean;
  crossContamination: string;
  partnerId?:         string;
  price?:             number;
  category?:          string;
  imageUrl?:          string;
}

export interface ProductResponseDTO {
  id:                 string;
  name:               string;
  brand:              string;
  ingredients:        string;
  hasGluten:          boolean;
  crossContamination: string;
  analysisStatus:     AnalysisStatus;
  partnerId?:         string;
  price:              number;
  category:           string;
  imageUrl?:          string;
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
      if (!partner.isActive) {
        return Result.fail<ProductResponseDTO>('O cadastro do parceiro comercial está inativo ou suspenso.');
      }
    }

    const productResult = Product.create({
      name: dto.name,
      brand: dto.brand,
      ingredients: dto.ingredients,
      hasGluten: dto.hasGluten,
      crossContamination: dto.crossContamination,
      partnerId: dto.partnerId,
      price: dto.price,
      category: dto.category,
      imageUrl: dto.imageUrl,
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
      partnerId:          product.partnerId,
      price:              product.price,
      category:           product.category,
      imageUrl:           product.imageUrl,
    });
  }
}
