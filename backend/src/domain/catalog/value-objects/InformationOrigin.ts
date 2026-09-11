// backend/src/domain/catalog/value-objects/InformationOrigin.ts

/**
 * InformationOrigin — Procedência e rastreabilidade dos dados do produto.
 * Permite que a interface informe ao consumidor o grau de confiança da informação.
 */
export type InformationOrigin =
  | 'PARTNER_DECLARED'
  | 'LABEL_EXTRACTED'
  | 'MANUFACTURER_PROVIDED'
  | 'VERIFIED_BY_CELILAC';

export const INFORMATION_ORIGIN_LABELS: Record<InformationOrigin, { label: string; badge: string; icon: string }> = {
  PARTNER_DECLARED: {
    label: 'Declarado pelo Estabelecimento',
    badge: 'Declarado',
    icon: '🏢',
  },
  LABEL_EXTRACTED: {
    label: 'Extraído do Rótulo Oficial',
    badge: 'Rótulo Físico',
    icon: '🏷️',
  },
  MANUFACTURER_PROVIDED: {
    label: 'Ficha Técnica do Fabricante',
    badge: 'Fabricante',
    icon: '🏭',
  },
  VERIFIED_BY_CELILAC: {
    label: 'Documentação Auditada pelo CeLiLac',
    badge: 'Auditado CeLiLac',
    icon: '🛡️',
  },
};
