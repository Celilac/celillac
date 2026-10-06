// frontend/web-app/src/utils/productFilters.ts

export interface ProductSummaryItem {
  id: string;
  name: string;
  brand?: string;
  ingredients?: string;
  hasGluten?: boolean;
  crossContamination?: string;
  analysisStatus?: string;
  partnerId?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  declaredAllergens?: Record<string, string>;
  dietaryFeatures?: string[];
  compatibilityReport?: {
    riskLevel?: string;
    confidenceLevel?: string;
    hasDivergence?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export type ProductSortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export interface ProductFilterState {
  sortBy: ProductSortOption;
  freeOfGluten: boolean;
  freeOfMilk: boolean;
  freeOfSoy: boolean;
  freeOfNuts: boolean;
  freeOfEggs: boolean;
  onlySafeCompatibility: boolean;
  minPrice: string;
  maxPrice: string;
  onlyWithPrice: boolean;
  category: string;
  veganOnly: boolean;
}

export const INITIAL_PRODUCT_FILTER_STATE: ProductFilterState = {
  sortBy: 'featured',
  freeOfGluten: false,
  freeOfMilk: false,
  freeOfSoy: false,
  freeOfNuts: false,
  freeOfEggs: false,
  onlySafeCompatibility: false,
  minPrice: '',
  maxPrice: '',
  onlyWithPrice: false,
  category: 'ALL',
  veganOnly: false,
};

const GLUTEN_TERMS = ['glúten', 'gluten', 'trigo', 'centeio', 'cevada', 'aveia', 'malte'];
const MILK_TERMS = ['leite', 'lactose', 'queijo', 'manteiga', 'creme', 'whey', 'soro', 'caseína', 'iogurte'];
const SOY_TERMS = ['soja', 'lecitina de soja'];
const NUT_TERMS = ['amendoim', 'castanha', 'nozes', 'amêndoa', 'pistache', 'avelã', 'macadâmia', 'noiz'];
const EGG_TERMS = ['ovo', 'ovos', 'clara de ovo', 'gema', 'albumina'];

export function containsAllergenRisk(text: string | undefined, terms: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  // Se o texto declara expressamente ausência ou ambiente livre total
  if (
    lower.includes('ambiente livre') ||
    lower.includes('livre de contaminação') ||
    lower.includes('isento de alérgenos') ||
    lower.includes('100% seguro')
  ) {
    // Só verifica se houver menção explícita de "pode conter" ou "alérgicos: contém"
    if (!lower.includes('pode conter') && !lower.includes('contém') && !lower.includes('traços')) {
      return false;
    }
  }

  for (const term of terms) {
    if (!lower.includes(term)) continue;

    // Se estiver negado diretamente (ex: "livre de glúten", "sem lactose", "não contém leite")
    const safePatterns = [
      `livre de ${term}`,
      `isento de ${term}`,
      `não contém ${term}`,
      `sem ${term}`,
      `zero ${term}`,
    ];

    const isSafe = safePatterns.some((pattern) => lower.includes(pattern));
    if (!isSafe) {
      return true;
    }
  }

  return false;
}

export function isProductGlutenFree(prod: ProductSummaryItem): boolean {
  if (prod.hasGluten) return false;
  if (prod.declaredAllergens?.['GLUTEN'] === 'CONTAINS' || prod.declaredAllergens?.['GLUTEN'] === 'TRACES') {
    return false;
  }
  if (containsAllergenRisk(prod.ingredients, GLUTEN_TERMS)) return false;
  if (containsAllergenRisk(prod.crossContamination, GLUTEN_TERMS)) return false;
  return true;
}

export function isProductMilkFree(prod: ProductSummaryItem): boolean {
  if (prod.declaredAllergens?.['MILK'] === 'CONTAINS' || prod.declaredAllergens?.['MILK'] === 'TRACES') {
    return false;
  }
  if (prod.declaredAllergens?.['LACTOSE'] === 'CONTAINS' || prod.declaredAllergens?.['LACTOSE'] === 'TRACES') {
    return false;
  }
  if (containsAllergenRisk(prod.ingredients, MILK_TERMS)) return false;
  if (containsAllergenRisk(prod.crossContamination, MILK_TERMS)) return false;
  return true;
}

export function isProductSoyFree(prod: ProductSummaryItem): boolean {
  if (prod.declaredAllergens?.['SOY'] === 'CONTAINS' || prod.declaredAllergens?.['SOY'] === 'TRACES') {
    return false;
  }
  if (containsAllergenRisk(prod.ingredients, SOY_TERMS)) return false;
  if (containsAllergenRisk(prod.crossContamination, SOY_TERMS)) return false;
  return true;
}

export function isProductNutsFree(prod: ProductSummaryItem): boolean {
  if (prod.declaredAllergens?.['PEANUT'] === 'CONTAINS' || prod.declaredAllergens?.['PEANUT'] === 'TRACES') {
    return false;
  }
  if (prod.declaredAllergens?.['NUTS'] === 'CONTAINS' || prod.declaredAllergens?.['NUTS'] === 'TRACES') {
    return false;
  }
  if (containsAllergenRisk(prod.ingredients, NUT_TERMS)) return false;
  if (containsAllergenRisk(prod.crossContamination, NUT_TERMS)) return false;
  return true;
}

export function isProductEggFree(prod: ProductSummaryItem): boolean {
  if (prod.declaredAllergens?.['EGG'] === 'CONTAINS' || prod.declaredAllergens?.['EGG'] === 'TRACES') {
    return false;
  }
  if (containsAllergenRisk(prod.ingredients, EGG_TERMS)) return false;
  if (containsAllergenRisk(prod.crossContamination, EGG_TERMS)) return false;
  return true;
}

export function isProductVegan(prod: ProductSummaryItem): boolean {
  if (prod.dietaryFeatures && prod.dietaryFeatures.includes('VEGAN')) {
    return true;
  }
  const milkFree = isProductMilkFree(prod);
  const eggFree = isProductEggFree(prod);
  const ing = (prod.ingredients || '').toLowerCase();
  const animalTerms = ['carne', 'frango', 'peixe', 'gelatina', 'mel', 'colágeno', 'bacon', 'banha'];
  if (!milkFree || !eggFree || animalTerms.some((t) => ing.includes(t))) {
    return false;
  }
  return true;
}


export function countActiveFilters(filters: ProductFilterState): number {
  let count = 0;
  if (filters.sortBy !== 'featured') count++;
  if (filters.freeOfGluten) count++;
  if (filters.freeOfMilk) count++;
  if (filters.freeOfSoy) count++;
  if (filters.freeOfNuts) count++;
  if (filters.freeOfEggs) count++;
  if (filters.onlySafeCompatibility) count++;
  if (filters.minPrice !== '') count++;
  if (filters.maxPrice !== '') count++;
  if (filters.onlyWithPrice) count++;
  if (filters.category !== 'ALL') count++;
  if (filters.veganOnly) count++;
  return count;
}

export function getProductUnitPrice(product: ProductSummaryItem): number {
  const rawPrice = (product as any).price;
  if (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice))) {
    return Number(rawPrice);
  }
  return 0;
}

export function filterAndSortProducts<T extends ProductSummaryItem = ProductSummaryItem>(
  products: T[],
  filters: ProductFilterState,
  searchQuery: string = ''
): T[] {
  const query = searchQuery.trim().toLowerCase();

  // 1. Filtragem
  const filtered = products.filter((prod) => {
    // Busca por texto
    if (query) {
      const matchName = prod.name.toLowerCase().includes(query);
      const matchBrand = (prod.brand || '').toLowerCase().includes(query);
      const matchIng = (prod.ingredients || '').toLowerCase().includes(query);
      const matchCat = (prod.category || '').toLowerCase().includes(query);
      if (!matchName && !matchBrand && !matchIng && !matchCat) {
        return false;
      }
    }

    // Categoria
    if (filters.category !== 'ALL') {
      const prodCategory = (prod.category || 'Alimentos e Bebidas').toLowerCase();
      if (prodCategory !== filters.category.toLowerCase()) {
        return false;
      }
    }

    // Preço
    const unitPrice = getProductUnitPrice(prod);
    if (filters.onlyWithPrice && unitPrice <= 0) {
      return false;
    }
    if (filters.minPrice !== '') {
      const min = Number(filters.minPrice);
      if (!isNaN(min) && unitPrice < min) {
        return false;
      }
    }
    if (filters.maxPrice !== '') {
      const max = Number(filters.maxPrice);
      if (!isNaN(max) && (unitPrice <= 0 || unitPrice > max)) {
        return false;
      }
    }

    // Alérgenos e Segurança Biológica
    if (filters.freeOfGluten && !isProductGlutenFree(prod)) {
      return false;
    }
    if (filters.freeOfMilk && !isProductMilkFree(prod)) {
      return false;
    }
    if (filters.freeOfSoy && !isProductSoyFree(prod)) {
      return false;
    }
    if (filters.freeOfNuts && !isProductNutsFree(prod)) {
      return false;
    }
    if (filters.freeOfEggs && !isProductEggFree(prod)) {
      return false;
    }

    // Vegano
    if (filters.veganOnly && !isProductVegan(prod)) {
      return false;
    }

    // Compatibilidade personalizada (perfil seguro)
    if (filters.onlySafeCompatibility) {
      if (!prod.compatibilityReport || prod.compatibilityReport.riskLevel !== 'SAFE') {
        return false;
      }
    }

    return true;
  });

  // 2. Ordenação
  const sorted = [...filtered].sort((a, b) => {
    if (filters.sortBy === 'price-asc') {
      const priceA = getProductUnitPrice(a);
      const priceB = getProductUnitPrice(b);
      // Itens com preço zero/sob consulta vão pro fim
      if (priceA === 0 && priceB > 0) return 1;
      if (priceB === 0 && priceA > 0) return -1;
      return priceA - priceB;
    }

    if (filters.sortBy === 'price-desc') {
      const priceA = getProductUnitPrice(a);
      const priceB = getProductUnitPrice(b);
      if (priceA === 0 && priceB > 0) return 1;
      if (priceB === 0 && priceA > 0) return -1;
      return priceB - priceA;
    }

    if (filters.sortBy === 'name-asc') {
      return a.name.localeCompare(b.name, 'pt-BR');
    }

    // 'featured' / padrão: mantém a ordem original da lista
    return 0;
  });

  return sorted;
}
