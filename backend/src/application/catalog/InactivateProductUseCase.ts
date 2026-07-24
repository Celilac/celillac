// backend/src/application/catalog/InactivateProductUseCase.ts
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Result } from '../../domain/Result';

export interface InactivateProductDTO {
  id:            string;
  partnerUserId: string;
  isActive:      boolean;
}

export class InactivateProductUseCase {
  constructor(
    private readonly productRepository: IProductCatalogRepository,
    private readonly partnerRepository: IPartnerRepository
  ) {}

  async execute(dto: InactivateProductDTO): Promise<Result<void>> {
    // 1. Buscar o produto
    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail<void>('Produto não encontrado.');
    }

    // 2. Buscar todos os parceiros gerenciados pelo usuário solicitante
    const partners = await this.partnerRepository.findAllByUserId(dto.partnerUserId);
    const partner = partners.find(p => p.id === product.partnerId);
    if (!partner) {
      return Result.fail<void>('Acesso negado: Este produto pertence a outro parceiro comercial ou você não tem permissão sobre ele.');
    }

    // 4. Alterar status
    if (dto.isActive) {
      product.activate();
    } else {
      product.inactivate();
    }

    await this.productRepository.update(product);
    return Result.ok<void>(undefined);
  }
}
