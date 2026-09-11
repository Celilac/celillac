// backend/src/domain/catalog/value-objects/AllergenPresence.ts

/**
 * AllergenPresence — 4 situações semânticas para declaração de alérgenos por parceiros
 * conforme recomendação do Feedback_Cadastro_Produtos_CeliLac.md (RDC 727/2022 ANVISA).
 */
export type AllergenPresence = 'FREE' | 'CONTAINS' | 'TRACES' | 'NOT_INFORMED';

export const ALLERGEN_PRESENCE_LABELS: Record<AllergenPresence, { label: string; icon: string; description: string }> = {
  FREE: {
    label: 'Não Contém',
    icon: '🟢',
    description: 'Isento na receita e livre de contaminação cruzada no preparo.',
  },
  CONTAINS: {
    label: 'Contém',
    icon: '🔴',
    description: 'Presente como ingrediente ou derivado na formulação.',
  },
  TRACES: {
    label: 'Pode Conter (Traços)',
    icon: '🟡',
    description: 'Alerta preventivo de contato cruzado em maquinário ou ambiente.',
  },
  NOT_INFORMED: {
    label: 'Não Informado',
    icon: '⚪',
    description: 'Situação não especificada pelo fabricante ou parceiro.',
  },
};
