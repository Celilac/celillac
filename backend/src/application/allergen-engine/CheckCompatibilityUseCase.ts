// backend/src/application/allergen-engine/CheckCompatibilityUseCase.ts
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { IProductRepository } from '../../domain/allergen-engine/repositories/IProductRepository';
import { AllergenEngine } from '../../domain/allergen-engine/AllergenEngine';
import { CompatibilityReport } from '../../domain/allergen-engine/CompatibilityReport';
import { Result } from '../../domain/Result';

export interface CheckCompatibilityDTO {
  userId:    string;
  productId: string;
}

/**
 * CheckCompatibilityUseCase
 * 
 * Orquestra a verificação de compatibilidade:
 * 1. Busca o FoodProfile do usuário
 * 2. Busca o ProductSnapshot do produto
 * 3. Delega ao AllergenEngine
 * 4. Retorna o CompatibilityReport
 */
export class CheckCompatibilityUseCase {
  constructor(
    private readonly profileRepository: IFoodProfileRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(dto: CheckCompatibilityDTO): Promise<Result<CompatibilityReport>> {
    // 1. Busca perfil
    const profile = await this.profileRepository.findByUserId(dto.userId);
    if (!profile) {
      return Result.fail<CompatibilityReport>('Perfil alimentar não encontrado para o usuário.');
    }

    // 2. Busca produto
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      return Result.fail<CompatibilityReport>('Produto não encontrado.');
    }

    // 3. Verifica compatibilidade no motor puro de domínio
    const report = AllergenEngine.check(profile, product);

    // 4. Retorna relatório
    return Result.ok<CompatibilityReport>(report);
  }
}
