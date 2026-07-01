// backend/src/domain/allergen-engine/repositories/IProductRepository.ts
import { ProductSnapshot } from '../ProductSnapshot';

export interface IProductRepository {
  findById(id: string): Promise<ProductSnapshot | null>;
}
