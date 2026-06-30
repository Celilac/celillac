// backend/src/domain/allergen-engine/CompatibilityReport.ts
import { AllergenType } from '../food-profile/value-objects/AllergenType';
import { SeverityLevel } from '../food-profile/value-objects/SeverityLevel';
import { RiskLevel } from './RiskLevel';

/**
 * ConflictDetail — Detalhe de um conflito encontrado pelo motor.
 * ⚠️ ARQUIVO CRÍTICO
 */
export interface ConflictDetail {
  allergen:  AllergenType;
  severity:  SeverityLevel;
  reason:    string;
}

/**
 * CompatibilityReport — Saída do AllergenEngine.
 * ⚠️ ARQUIVO CRÍTICO — Qualquer alteração exige aprovação humana (GUARDRAILS.md #1)
 *
 * Retorna TODOS os conflitos encontrados (não apenas o mais grave),
 * para que o usuário tenha informação completa.
 */
export interface CompatibilityReport {
  isCompatible: boolean;
  riskLevel:    RiskLevel;
  conflicts:    ConflictDetail[];
  reasoning:    string;
}
