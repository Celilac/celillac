// backend/src/domain/catalog/value-objects/DietaryFeature.ts

/**
 * DietaryFeature — Características e alegações alimentares/estilos de vida.
 * Diferenciam preferências declarativas de alérgenos de risco severo à saúde.
 */
export type DietaryFeature =
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'NO_ADDED_SUGAR'
  | 'SUGAR_FREE'
  | 'ORGANIC'
  | 'KOSHER'
  | 'HALAL';

export const DIETARY_FEATURE_LABELS: Record<DietaryFeature, { label: string; icon: string }> = {
  VEGAN: { label: 'Vegano', icon: '🌱' },
  VEGETARIAN: { label: 'Vegetariano', icon: '🥚' },
  NO_ADDED_SUGAR: { label: 'Sem Açúcar Adicionado', icon: '🚫' },
  SUGAR_FREE: { label: 'Zero Açúcar', icon: '✨' },
  ORGANIC: { label: 'Orgânico', icon: '🍃' },
  KOSHER: { label: 'Kosher', icon: '✡️' },
  HALAL: { label: 'Halal', icon: '☪️' },
};
