// backend/src/domain/allergen-engine/AllergenEngine.ts
//
// ⚠️⚠️⚠️ ARQUIVO DE MÁXIMA CRITICIDADE ⚠️⚠️⚠️
// Qualquer alteração DEVE passar por aprovação humana (GUARDRAILS.md #1, ALLERGEN_ENGINE.md).
// Este motor foi implementado com aprovação em 2026-06-30.
// Lógica validada contra os 9 casos de teste críticos em AllergenEngine.spec.ts.
//
import { FoodProfile } from '../food-profile/FoodProfile';
import { AllergenType, ALLERGEN_SEARCH_TERMS } from '../food-profile/value-objects/AllergenType';
import { SeverityLevel, SEVERITY_ORDER } from '../food-profile/value-objects/SeverityLevel';
import { CompatibilityReport, ConflictDetail } from './CompatibilityReport';
import { ProductSnapshot } from './ProductSnapshot';
import { RiskLevel } from './RiskLevel';

/**
 * AllergenEngine — Serviço de Domínio Puro.
 *
 * Responsabilidade: Calcular a compatibilidade entre um FoodProfile e um produto.
 *
 * Regras implementadas (aprovadas em 2026-06-30):
 *  R1. Produto sem ingredientes declarados → BLOCKED (princípio da precaução).
 *  R2. Perfil sem restrições → SAFE (sem dados para bloquear).
 *  R3. FATAL + alérgeno presente nos ingredientes → BLOCKED.
 *  R4. FATAL + alérgeno nos traços (cross_contamination) → BLOCKED.
 *  R5. HIGH + alérgeno presente → DANGER.
 *  R6. MEDIUM ou LOW + alérgeno presente → WARNING.
 *  R7. O risco final é o MAIOR entre todos os conflitos encontrados.
 *  R8. Todos os conflitos são retornados (não apenas o mais grave).
 */
export class AllergenEngine {
  /**
   * check — Método estático puro. Sem estado, sem efeitos colaterais.
   * Agnóstico a banco de dados — recebe apenas objetos de domínio.
   */
  static check(profile: FoodProfile, product: ProductSnapshot): CompatibilityReport {
    // R2: Perfil sem restrições → SAFE
    if (!profile.isActive()) {
      return AllergenEngine.buildReport(RiskLevel.SAFE, [], 'Perfil sem restrições ativas.');
    }

    // R1: Produto sem ingredientes → BLOCKED (princípio da precaução)
    if (!product.ingredients || product.ingredients.trim().length === 0) {
      return AllergenEngine.buildReport(
        RiskLevel.BLOCKED,
        [],
        'Produto sem lista de ingredientes declarados. Bloqueado por princípio da precaução.',
      );
    }

    const ingredientsLower      = product.ingredients.toLowerCase();
    const crossContaminationLower = (product.crossContamination ?? '').toLowerCase();
    const conflicts: ConflictDetail[] = [];
    let highestRisk = RiskLevel.SAFE;

    for (const restriction of profile.restrictions) {
      const { allergen, severity } = restriction;
      const searchTerms = ALLERGEN_SEARCH_TERMS[allergen];

      // Caso especial: GLUTEN pode ser checado pelo campo has_gluten
      const foundViaHasGluten =
        allergen === AllergenType.GLUTEN && product.hasGluten === true;

      const foundInIngredients =
        foundViaHasGluten ||
        searchTerms.some((term) => ingredientsLower.includes(term));

      const foundInCrossContamination =
        searchTerms.some((term) => crossContaminationLower.includes(term));

      if (!foundInIngredients && !foundInCrossContamination) {
        continue; // Alérgeno não encontrado — sem conflito
      }

      // Determinar risco deste conflito
      const conflictRisk = AllergenEngine.resolveRisk(
        severity,
        foundInIngredients,
        foundInCrossContamination,
      );

      const reason = AllergenEngine.buildReason(
        allergen,
        severity,
        foundInIngredients,
        foundInCrossContamination,
      );

      conflicts.push({ allergen, severity, reason });

      // R7: manter o risco mais alto
      if (AllergenEngine.riskOrder(conflictRisk) > AllergenEngine.riskOrder(highestRisk)) {
        highestRisk = conflictRisk;
      }
    }

    const isCompatible = highestRisk === RiskLevel.SAFE;
    const reasoning = isCompatible
      ? 'Produto compatível com o perfil alimentar.'
      : `${conflicts.length} conflito(s) encontrado(s). Risco: ${highestRisk}.`;

    return AllergenEngine.buildReport(highestRisk, conflicts, reasoning);
  }

  // --- Métodos auxiliares privados ---

  private static resolveRisk(
    severity: SeverityLevel,
    foundInIngredients: boolean,
    foundInCrossContamination: boolean,
  ): RiskLevel {
    // R3 + R4: FATAL não aceita nem ingredientes nem traços
    if (severity === SeverityLevel.FATAL && (foundInIngredients || foundInCrossContamination)) {
      return RiskLevel.BLOCKED;
    }
    // R5: HIGH → DANGER
    if (severity === SeverityLevel.HIGH && foundInIngredients) {
      return RiskLevel.DANGER;
    }
    // R6: MEDIUM / LOW → WARNING
    if (foundInIngredients) {
      return RiskLevel.WARNING;
    }
    // Traços para severidades não-FATAL → WARNING
    if (foundInCrossContamination) {
      return RiskLevel.WARNING;
    }
    return RiskLevel.SAFE;
  }

  private static buildReason(
    allergen: AllergenType,
    severity: SeverityLevel,
    inIngredients: boolean,
    inCrossContamination: boolean,
  ): string {
    const parts: string[] = [`[${severity}] ${allergen}`];
    if (inIngredients)          parts.push('detectado nos ingredientes');
    if (inCrossContamination)   parts.push('detectado em contaminação cruzada (traços)');
    return parts.join(' — ');
  }

  private static buildReport(
    riskLevel: RiskLevel,
    conflicts: ConflictDetail[],
    reasoning: string,
  ): CompatibilityReport {
    return {
      isCompatible: riskLevel === RiskLevel.SAFE,
      riskLevel,
      conflicts,
      reasoning,
    };
  }

  private static riskOrder(risk: RiskLevel): number {
    const order: Record<RiskLevel, number> = {
      [RiskLevel.SAFE]:    0,
      [RiskLevel.WARNING]: 1,
      [RiskLevel.DANGER]:  2,
      [RiskLevel.BLOCKED]: 3,
    };
    return order[risk];
  }
}
