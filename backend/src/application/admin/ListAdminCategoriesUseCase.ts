// backend/src/application/admin/ListAdminCategoriesUseCase.ts
import { ICategoryRepository, AdminCategoryFilter } from '../../domain/catalog/repositories/ICategoryRepository';
import { CategoryResponseDTO } from '../catalog/CreateCategoryUseCase';

export class ListAdminCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(filter?: AdminCategoryFilter): Promise<CategoryResponseDTO[]> {
    const categories = await this.categoryRepository.listAllForAdmin(filter);

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      normalizedName: cat.normalizedName,
      partnerId: cat.partnerId,
      status: cat.status,
      visibility: cat.visibility,
      rejectionReason: cat.rejectionReason,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }));
  }
}
