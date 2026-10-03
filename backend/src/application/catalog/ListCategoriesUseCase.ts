// backend/src/application/catalog/ListCategoriesUseCase.ts
import { ICategoryRepository } from '../../domain/catalog/repositories/ICategoryRepository';
import { CategoryResponseDTO } from './CreateCategoryUseCase';

export interface ListCategoriesQuery {
  partnerId?: string;
  isPublicOnly?: boolean;
}

export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(query: ListCategoriesQuery = {}): Promise<CategoryResponseDTO[]> {
    let categories;

    if (query.isPublicOnly || !query.partnerId) {
      categories = await this.categoryRepository.listPublicCategories();
    } else {
      categories = await this.categoryRepository.listAvailableForPartner(query.partnerId);
    }

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
