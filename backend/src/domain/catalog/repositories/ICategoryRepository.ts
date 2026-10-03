// backend/src/domain/catalog/repositories/ICategoryRepository.ts
import { Category } from '../Category';

export interface AdminCategoryFilter {
  status?: string;
  visibility?: string;
  partnerId?: string;
}

export interface ICategoryRepository {
  create(category: Category): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findByNormalizedName(normalizedName: string, partnerId?: string): Promise<Category | null>;
  update(category: Category): Promise<void>;
  listAvailableForPartner(partnerId?: string): Promise<Category[]>;
  listPublicCategories(): Promise<Category[]>;
  listAllForAdmin(filter?: AdminCategoryFilter): Promise<Category[]>;
}
