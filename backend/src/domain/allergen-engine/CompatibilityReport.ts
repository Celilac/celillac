// backend/src/domain/allergen-engine/CompatibilityReport.ts
import { AllergenType } from '../food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../food-profile/value-objects/SeverityLevel';
import { RestrictionType } from '../food-profile/value-objects/RestrictionType';
import { RiskLevel } from './RiskLevel';

/**
 * ConflictDetail — Detalhe de um conflito encontrado pelo motor.
 * ⚠️ ARQUIVO CRÍTICO
 *
 * `type` foi adicionado em 2026-08-01 (Issue #34 / RN-CONSUMER-05) para
 * permitir que o frontend e o reasoning diferenciem Alergia de Intolerância.
 * Aprovação humana registrada na issue.
 */
export interface ConflictDetail {
  allergen:  AllergenType;
  severity:  SeverityLevel;
  type:      RestrictionType;
  reason:    string;
}

export type ConfidenceLevel = 'AUDITED_BY_CELILAC' | 'PARTNER_DECLARED' | 'PRECAUTIONARY';

export interface AnalysisDetails {
  ingredientsEvaluation:    string;
  declaredEvaluation:       string;
  environmentEvaluation:    string;
  certificationsEvaluation: string;
  hasDivergence:            boolean;
  divergenceNotes?:         string;
}

/**
 * CompatibilityReport — Saída do AllergenEngine.
 * ⚠️ ARQUIVO CRÍTICO — Qualquer alteração exige aprovação humana (GUARDRAILS.md #1)
 *
 * Retorna TODOS os conflitos encontrados (não apenas o mais grave),
 * para que o usuário tenha informação completa.
 */
export interface CompatibilityReport {
  isCompatible:     boolean;
  riskLevel:        RiskLevel;
  conflicts:        ConflictDetail[];
  reasoning:        string;
  confidenceLevel?: ConfidenceLevel;
  analysisDetails?: AnalysisDetails;
}

