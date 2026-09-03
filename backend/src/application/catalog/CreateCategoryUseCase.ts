// backend/src/application/catalog/CreateCategoryUseCase.ts
import { ICategoryRepository } from '../../domain/catalog/repositories/ICategoryRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Category } from '../../domain/catalog/Category';
import { Result } from '../../domain/Result';

export interface CreateCategoryDTO {
  name: string;
  partnerId: string;
  userId: string;
  userRole: string;
}

export interface CategoryResponseDTO {
  id: string;
  name: string;
  normalizedName: string;
  partnerId?: string;
  status: string;
  visibility: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export class CreateCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly partnerRepository: IPartnerRepository
  ) {}

  async execute(dto: CreateCategoryDTO): Promise<Result<CategoryResponseDTO>> {
    if (!dto.name || dto.name.trim().length === 0) {
      return Result.fail<CategoryResponseDTO>('O nome da categoria é obrigatório.');
    }

    if (!dto.partnerId || dto.partnerId.trim().length === 0) {
      return Result.fail<CategoryResponseDTO>('O estabelecimento parceiro é obrigatório.');
    }

    // Valida que o parceiro existe
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<CategoryResponseDTO>('Estabelecimento comercial não encontrado.');
    }

    // Valida permissão do parceiro
    if (dto.userRole !== 'ADMIN' && partner.userId !== dto.userId) {
      return Result.fail<CategoryResponseDTO>('Você não tem permissão para cadastrar categorias para este estabelecimento.');
    }

    const normalizedName = Category.normalizeName(dto.name);

    // Verifica se já existe com o mesmo nome normalizado
    const existing = await this.categoryRepository.findByNormalizedName(normalizedName, dto.partnerId);
    if (existing) {
      // Se já existe e é aprovada/global ou já é desse parceiro, retorna ela para reuso
      return Result.ok<CategoryResponseDTO>({
        id: existing.id,
        name: existing.name,
        normalizedName: existing.normalizedName,
        partnerId: existing.partnerId,
        status: existing.status,
        visibility: existing.visibility,
        rejectionReason: existing.rejectionReason,
        createdAt: existing.createdAt.toISOString(),
        updatedAt: existing.updatedAt.toISOString(),
      });
    }

    const categoryResult = Category.create({
      name: dto.name,
      partnerId: dto.partnerId,
      createdByUserId: dto.userId,
      status: 'PENDING_APPROVAL',
      visibility: 'RESTRICTED',
    });

    if (categoryResult.isFailure) {
      return Result.fail<CategoryResponseDTO>(categoryResult.getError());
    }

    const category = categoryResult.getValue();
    await this.categoryRepository.create(category);

    return Result.ok<CategoryResponseDTO>({
      id: category.id,
      name: category.name,
      normalizedName: category.normalizedName,
      partnerId: category.partnerId,
      status: category.status,
      visibility: category.visibility,
      rejectionReason: category.rejectionReason,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    });
  }
}
