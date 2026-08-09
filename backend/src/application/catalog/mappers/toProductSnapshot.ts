// backend/src/application/catalog/mappers/toProductSnapshot.ts
import { Product } from '../../../domain/catalog/Product';
import { ProductSnapshot } from '../../../domain/allergen-engine/ProductSnapshot';

/**
 * toProductSnapshot — Adapta um Product do catálogo para o ProductSnapshot
 * consumido pelo AllergenEngine. Único ponto de conversão entre os dois
 * contextos; evita reconstruir o snapshot manualmente em cada use case.
 */
export function toProductSnapshot(product: Product): ProductSnapshot {
  return {
    id:                 product.id,
    name:               product.name,
    ingredients:        product.ingredients,
    hasGluten:          product.hasGluten,
    crossContamination: product.crossContamination,
  };
}
