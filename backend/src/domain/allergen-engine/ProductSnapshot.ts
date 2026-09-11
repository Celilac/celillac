// backend/src/domain/allergen-engine/ProductSnapshot.ts

/**
 * ProductSnapshot — Representação do produto para análise do motor.
 * ⚠️ ARQUIVO CRÍTICO — Qualquer alteração exige aprovação humana (GUARDRAILS.md #1)
 *
 * Interface pura, sem dependência de ORM ou banco.
 * Derivada dos campos da tabela `products` (DATABASE.md).
 */
export interface ProductCertificationSnapshot {
  certificationType:   string;
  certifyingEntity?:   string;
  certificateCode?:    string;
  validUntil?:         string;
  isVerified?:         boolean;
  verificationStatus?: string;
}

export interface CrossContaminationDetailsSnapshot {
  environmentRisk?:       'EXCLUSIVE_ENVIRONMENT' | 'SHARED_WITH_PROTOCOL' | 'SHARED_ENVIRONMENT' | 'UNKNOWN_RISK';
  allergenRisks?:         Record<string, 'EXCLUSIVE_ENVIRONMENT' | 'SHARED_WITH_PROTOCOL' | 'SHARED_ENVIRONMENT' | 'UNKNOWN_RISK'>;
  cleaningProtocolNotes?: string;
  riskLevel?:             string; // 'NONE' | 'POSSIBLE' | 'SHARED_FACILITY' | 'NOT_APPLICABLE'
  isolationProtocols?:    string;
  sanitizationProtocol?:  string;
}

export interface ProductSnapshot {
  id:                         string;
  name:                       string;
  /** Lista de ingredientes em texto livre (PT ou EN). Vazio = sem informação. */
  ingredients:                string;
  /** Campo declarado pelo fabricante: true = produto contém glúten. */
  hasGluten:                  boolean;
  /** Texto de contaminação cruzada (ex: "Pode conter traços de glúten"). */
  crossContamination:         string;
  /** Matriz de 10 alérgenos RDC 727 (FREE, CONTAINS, TRACES, NOT_INFORMED). */
  declaredAllergens?:         Record<string, string>;
  /** Detalhes de isolamento fabril e higienização. */
  crossContaminationDetails?: CrossContaminationDetailsSnapshot;
  /** Selos oficiais e laudos laboratoriais do produto. */
  certifications?:            ProductCertificationSnapshot[];
  /** Procedência dos dados (PARTNER_DECLARED, VERIFIED_BY_CELILAC). */
  informationOrigin?:         string;
}

