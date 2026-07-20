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

    // 2. Buscar o parceiro dono
    const partner = await this.partnerRepository.findByUserId(dto.partnerUserId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado para este usuário.');
    }

    // 3. Validar se o parceiro é dono
    if (product.partnerId !== partner.id) {
      return Result.fail<void>('Acesso negado: Este produto pertence a outro parceiro comercial.');
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
