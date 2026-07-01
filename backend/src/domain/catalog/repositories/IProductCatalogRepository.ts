// backend/src/domain/catalog/repositories/IProductCatalogRepository.ts
import { Product } from '../Product';

export interface PaginatedResult<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

export interface SearchProductQuery {
  term:  string;
  page:  number;
  limit: number;
}

export interface IProductCatalogRepository {
  create(product: Product): Promise<void>;
  search(query: SearchProductQuery): Promise<PaginatedResult<Product>>;
}
