// backend/src/application/catalog/UpdateProductUseCase.ts
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Product, AnalysisStatus } from '../../domain/catalog/Product';
import { Result } from '../../domain/Result';
import { ProductResponseDTO } from './CreateProductUseCase';
import { VerifyPartnerPublicationCapability } from '../../domain/partner/services/VerifyPartnerPublicationCapability';

export interface UpdateProductDTO {
  id:                 string;
  partnerUserId:      string; // ID do usuário que solicita a alteração
  name:               string;
  brand:              string;
  ingredients:        string;
  hasGluten:          boolean;
  crossContamination: string;
  price:              number;
  category:           string;
  imageUrl?:          string;
  isActive?:          boolean;
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

    // 4. Criar a nova entidade com os novos dados preservando o ID original
    const updatedProductResult = Product.create(
      {
        name:               dto.name,
        brand:              dto.brand,
        ingredients:        dto.ingredients,
        hasGluten:          dto.hasGluten,
        crossContamination: dto.crossContamination,
        partnerId:          product.partnerId,
        price:              dto.price,
        category:           dto.category,
        imageUrl:           dto.imageUrl,
        isActive:           dto.isActive ?? product.isActive,
      },
      product.id
    );

    if (updatedProductResult.isFailure) {
      return Result.fail<ProductResponseDTO>(updatedProductResult.getError());
    }

    const updatedProduct = updatedProductResult.getValue();
    await this.productRepository.update(updatedProduct);

    return Result.ok<ProductResponseDTO>({
      id:                 updatedProduct.id,
      name:               updatedProduct.name,
      brand:              updatedProduct.brand,
      ingredients:        updatedProduct.ingredients,
      hasGluten:          updatedProduct.hasGluten,
      crossContamination: updatedProduct.crossContamination,
      analysisStatus:     updatedProduct.analysisStatus,
      partnerId:          updatedProduct.partnerId,
      price:              updatedProduct.price,
      category:           updatedProduct.category,
      imageUrl:           updatedProduct.imageUrl,
    });
  }
}
