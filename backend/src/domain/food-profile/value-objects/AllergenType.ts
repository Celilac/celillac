// backend/src/domain/food-profile/value-objects/AllergenType.ts

/**
 * AllergenType — Tipos de alérgenos suportados pelo sistema.
 * Zero dependências externas — pure domain.
 *
 * Cada tipo tem um conjunto de termos de busca associados
 * para detecção em ingredientes e cross_contamination.
 */
export enum AllergenType {
  GLUTEN    = 'GLUTEN',
  LACTOSE   = 'LACTOSE',
  NUTS      = 'NUTS',
  SOY       = 'SOY',
  EGGS      = 'EGGS',
  SHELLFISH = 'SHELLFISH',
  FISH      = 'FISH',
  WHEAT     = 'WHEAT',
  SESAME    = 'SESAME',
  OTHER     = 'OTHER',
}

/**
 * ALLERGEN_SEARCH_TERMS — Termos de busca por alérgeno.
 * Usado pelo AllergenEngine para detectar presença em texto livre.
 * ⚠️ Alterações aqui afetam diretamente a segurança alimentar.
 */
export const ALLERGEN_SEARCH_TERMS: Record<AllergenType, string[]> = {
  [AllergenType.GLUTEN]:    ['glúten', 'gluten', 'trigo', 'wheat', 'cevada', 'barley', 'centeio', 'rye', 'aveia', 'oats'],
  [AllergenType.LACTOSE]:   ['lactose', 'leite', 'milk', 'creme', 'cream', 'manteiga', 'butter', 'queijo', 'cheese', 'whey'],
  [AllergenType.NUTS]:      ['castanha', 'nozes', 'amêndoa', 'almond', 'amendoim', 'peanut', 'nuts', 'pistache', 'pistachio', 'macadâmia'],
  [AllergenType.SOY]:       ['soja', 'soy', 'soybean'],
  [AllergenType.EGGS]:      ['ovo', 'ovos', 'egg', 'eggs', 'albumina', 'albumin'],
  [AllergenType.SHELLFISH]: ['camarão', 'shrimp', 'lagosta', 'lobster', 'caranguejo', 'crab', 'shellfish', 'mariscos'],
  [AllergenType.FISH]:      ['peixe', 'fish', 'atum', 'tuna', 'salmão', 'salmon', 'bacalhau', 'anchova'],
  [AllergenType.WHEAT]:     ['trigo', 'wheat', 'farinha de trigo', 'glúten de trigo'],
  [AllergenType.SESAME]:    ['gergelim', 'sesame', 'tahine', 'tahini'],
  [AllergenType.OTHER]:     [],
};
