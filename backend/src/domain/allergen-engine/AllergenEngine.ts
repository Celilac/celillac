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
import { RestrictionType } from '../food-profile/value-objects/RestrictionType';
import { CompatibilityReport, ConflictDetail, ConfidenceLevel, AnalysisDetails } from './CompatibilityReport';
import { ProductSnapshot } from './ProductSnapshot';
import { RiskLevel } from './RiskLevel';

/**
 * Mapeamento entre AllergenType do CeLiLac e as chaves da Matriz RDC 727/2022.
 */
const ALLERGEN_TO_DECLARED_KEYS: Record<AllergenType, string[]> = {
  [AllergenType.GLUTEN]:    ['GLUTEN', 'WHEAT'],
  [AllergenType.LACTOSE]:   ['MILK'],
  [AllergenType.NUTS]:      ['NUTS', 'PEANUTS'],
  [AllergenType.SOY]:       ['SOY'],
  [AllergenType.EGGS]:      ['EGGS'],
  [AllergenType.SHELLFISH]: ['CRUSTACEANS'],
  [AllergenType.FISH]:      ['FISH'],
  [AllergenType.WHEAT]:     ['GLUTEN', 'WHEAT'],
  [AllergenType.SESAME]:    ['SESAME'],
  [AllergenType.OTHER]:     [],
};

/**
 * AllergenEngine — Serviço de Domínio Puro.
 *
 * Responsabilidade: Calcular a compatibilidade entre um FoodProfile e um produto.
 *
 * Regras implementadas (aprovadas em 2026-06-30, expandidas Fase 4):
 *  R1. Produto sem ingredientes declarados → BLOCKED (princípio da precaução).
 *  R2. Perfil sem restrições → UNEVALUATED (sem dados suficientes para avaliar - RN-CONSUMER-07).
 *  R3. FATAL + alérgeno presente nos ingredientes → BLOCKED.
 *  R4. FATAL + alérgeno nos traços (cross_contamination / ambiente) → BLOCKED.
 *  R5. HIGH + alérgeno presente → DANGER.
 *  R6. MEDIUM ou LOW + alérgeno presente → WARNING.
 *  R7. Traços para severidades não-FATAL → WARNING.
 *  R8. O risco final é o MAIOR entre todos os conflitos encontrados.
 *  R9. Invariante 11.5: HIGH em traços + consumidor NÃO aceita contaminação cruzada → DANGER.
 *  R10 (Fase 4): Detecção de Divergência — declaração "FREE" não anula alérgeno detectado nos ingredientes.
 */
export class AllergenEngine {
  /**
   * check — Método estático puro. Sem estado, sem efeitos colaterais.
   * Agnóstico a banco de dados — recebe apenas objetos de domínio.
   */
  static check(profile: FoodProfile, product: ProductSnapshot): CompatibilityReport {
    // R2: Perfil sem restrições → UNEVALUATED (RN-CONSUMER-07 / Invariante 11.6)
    if (!profile.isActive()) {
      return AllergenEngine.buildReport(
        RiskLevel.UNEVALUATED,
        [],
        'Perfil sem restrições ativas. Configure seu perfil para avaliar a compatibilidade do produto.',
        'PRECAUTIONARY',
      );
    }

    // R1: Produto sem ingredientes → BLOCKED (princípio da precaução)
    if (!product.ingredients || product.ingredients.trim().length === 0) {
      return AllergenEngine.buildReport(
        RiskLevel.BLOCKED,
        [],
        'Produto sem lista de ingredientes declarados. Bloqueado por princípio da precaução.',
        'PRECAUTIONARY',
      );
    }

    const ingredientsLower        = product.ingredients.toLowerCase();
    const crossContaminationLower = (product.crossContamination ?? '').toLowerCase();
    const conflicts: ConflictDetail[] = [];
    let highestRisk = RiskLevel.SAFE;
    let hasDivergence = false;
    const divergenceNotes: string[] = [];

    const facilityRisk = product.crossContaminationDetails?.riskLevel || product.crossContaminationDetails?.environmentRisk;
    const isSharedFacility = facilityRisk === 'SHARED_FACILITY' || facilityRisk === 'SHARED_ENVIRONMENT';

    for (const restriction of profile.restrictions) {
      const { allergen, severity, type } = restriction;
      const searchTerms = ALLERGEN_SEARCH_TERMS[allergen] || [];

      // 1. Matriz estruturada de alérgenos (RDC 727)
      const declaredKeys = ALLERGEN_TO_DECLARED_KEYS[allergen] || [];
      let isDeclaredContains = false;
      let isDeclaredTraces   = false;
      let isDeclaredFree     = false;

      if (product.declaredAllergens) {
        for (const key of declaredKeys) {
          const status = product.declaredAllergens[key];
          if (status === 'CONTAINS') isDeclaredContains = true;
          if (status === 'TRACES')   isDeclaredTraces   = true;
          if (status === 'FREE')     isDeclaredFree     = true;
        }
      }

      // 2. Detecção textual e legado
      const foundViaHasGluten =
        allergen === AllergenType.GLUTEN && product.hasGluten === true;

      const matchingIngredientTerms = searchTerms.filter((term) => ingredientsLower.includes(term));
      const foundInTextIngredients  = matchingIngredientTerms.length > 0;

      const matchingCrossTerms = searchTerms.filter((term) => crossContaminationLower.includes(term));
      const foundInTextCross   = matchingCrossTerms.length > 0;

      // 3. Regra R10: Detecção de Divergência Crítica (declarado "FREE" mas presente no texto)
      let divergenceForThis = false;
      if (isDeclaredFree && (foundInTextIngredients || foundViaHasGluten)) {
        divergenceForThis = true;
        hasDivergence = true;
        const termFound = matchingIngredientTerms.length > 0
          ? matchingIngredientTerms.join(', ')
          : 'Glúten indicado';
        divergenceNotes.push(
          `Divergência em ${allergen}: declarado livre, porém detectado no texto de ingredientes ("${termFound}").`
        );
      }

      // 4. Presença efetiva em ingredientes (prevalência do ingrediente real)
      const foundInIngredients =
        foundViaHasGluten ||
        foundInTextIngredients ||
        isDeclaredContains;

      // 5. Presença em traços / contaminação cruzada de ambiente
      let foundInCrossContamination =
        foundInTextCross ||
        isDeclaredTraces;

      // Ambiente compartilhado eleva risco de traços para celíacos ou quem não tolera contaminação
      if (
        isSharedFacility &&
        (!profile.acceptsCrossContamination || severity === SeverityLevel.FATAL) &&
        !isDeclaredFree
      ) {
        foundInCrossContamination = true;
      }

      if (!foundInIngredients && !foundInCrossContamination) {
        continue; // Alérgeno ausente — sem conflito
      }

      // 6. Determinar risco do conflito
      const conflictRisk = AllergenEngine.resolveRisk(
        severity,
        foundInIngredients,
        foundInCrossContamination,
        profile.acceptsCrossContamination,
      );

      const reason = AllergenEngine.buildReason(
        allergen,
        severity,
        type,
        foundInIngredients,
        foundInCrossContamination,
        profile.acceptsCrossContamination,
        divergenceForThis,
        isDeclaredContains,
        isDeclaredTraces,
        matchingIngredientTerms,
      );

      conflicts.push({ allergen, severity, type, reason });

      // R8: manter o risco mais alto
      if (AllergenEngine.riskOrder(conflictRisk) > AllergenEngine.riskOrder(highestRisk)) {
        highestRisk = conflictRisk;
      }
    }

    const isCompatible = highestRisk === RiskLevel.SAFE;

    // 7. Avaliação de certificações e nível de confiança
    const now = new Date();
    const verifiedCerts = (product.certifications || []).filter((c) =>
      c.isVerified && (!c.validUntil || new Date(c.validUntil) >= now)
    );
    const hasVerifiedCert = verifiedCerts.length > 0;

    let confidenceLevel: ConfidenceLevel = 'PARTNER_DECLARED';
    if (hasDivergence) {
      confidenceLevel = 'PRECAUTIONARY';
    } else if (hasVerifiedCert || product.informationOrigin === 'VERIFIED_BY_CELILAC') {
      confidenceLevel = 'AUDITED_BY_CELILAC';
    }

    // 8. Síntese detalhada da análise
    const analysisDetails: AnalysisDetails = {
      ingredientsEvaluation: conflicts.some((c) => c.reason.includes('ingredientes'))
        ? 'Ingredientes contêm substâncias restritas ao seu perfil alimentar.'
        : 'Ingredientes compatíveis com seu perfil alimentar.',
      declaredEvaluation: product.declaredAllergens && Object.keys(product.declaredAllergens).length > 0
        ? `Matriz RDC 727 analisada (${Object.values(product.declaredAllergens).filter((s) => s === 'FREE').length} livres, ${Object.values(product.declaredAllergens).filter((s) => s === 'CONTAINS').length} presentes, ${Object.values(product.declaredAllergens).filter((s) => s === 'TRACES').length} traços).`
        : 'Declaração padrão do fornecedor.',
      environmentEvaluation: (facilityRisk === 'NONE' || facilityRisk === 'EXCLUSIVE_ENVIRONMENT')
        ? 'Produção exclusiva (ambiente dedicado sem contaminação cruzada).'
        : isSharedFacility
        ? 'Ambiente compartilhado (manipula alérgenos no mesmo maquinário/espaço).'
        : (facilityRisk === 'POSSIBLE' || facilityRisk === 'SHARED_WITH_PROTOCOL')
        ? 'Ambiente compartilhado com protocolo de controle e higienização.'
        : 'Risco de contaminação cruzada não informado.',
      certificationsEvaluation: verifiedCerts.length > 0
        ? `${verifiedCerts.length} selo(s)/laudo(s) auditado(s) e verificado(s) pelo CeLiLac (${verifiedCerts.map((c) => c.certificationType).join(', ')}).`
        : 'Nenhum laudo ou selo técnico verificado pelo CeLiLac.',
      hasDivergence,
      divergenceNotes: divergenceNotes.length > 0 ? divergenceNotes.join('; ') : undefined,
    };

    let reasoning = isCompatible
      ? 'Produto compatível com o perfil alimentar.'
      : `${conflicts.length} conflito(s) encontrado(s). Risco: ${highestRisk}.`;

    if (hasDivergence) {
      reasoning += ' ⚠️ Atenção: divergência detectada entre os ingredientes do rótulo e a declaração do parceiro.';
    } else if (isCompatible && confidenceLevel === 'AUDITED_BY_CELILAC') {
      reasoning += ' 🛡️ Segurança comprovada por laudo/selo verificado pelo CeLiLac.';
    }

    return AllergenEngine.buildReport(highestRisk, conflicts, reasoning, confidenceLevel, analysisDetails);
  }

  // --- Métodos auxiliares privados ---

  private static resolveRisk(
    severity: SeverityLevel,
    foundInIngredients: boolean,
    foundInCrossContamination: boolean,
    acceptsCrossContamination: boolean,
  ): RiskLevel {
    // R3 + R4: FATAL não aceita nem ingredientes nem traços (invariante biológica inviolável)
    if (severity === SeverityLevel.FATAL && (foundInIngredients || foundInCrossContamination)) {
      return RiskLevel.BLOCKED;
    }

    // R5: HIGH em ingredientes → DANGER
    if (severity === SeverityLevel.HIGH && foundInIngredients) {
      return RiskLevel.DANGER;
    }

    // R9 (Invariante 11.5): HIGH em traços + consumidor NÃO aceita contaminação cruzada → DANGER
    if (severity === SeverityLevel.HIGH && foundInCrossContamination && !acceptsCrossContamination) {
      return RiskLevel.DANGER;
    }

    // R6: MEDIUM / LOW em ingredientes → WARNING
    if (foundInIngredients) {
      return RiskLevel.WARNING;
    }

    // R7: Traços para severidades não-FATAL → WARNING
    if (foundInCrossContamination) {
      return RiskLevel.WARNING;
    }

    return RiskLevel.SAFE;
  }

  private static buildReason(
    allergen: AllergenType,
    severity: SeverityLevel,
    type: RestrictionType,
    inIngredients: boolean,
    inCrossContamination: boolean,
    acceptsCrossContamination: boolean,
    hasDivergence: boolean,
    isDeclaredContains: boolean,
    isDeclaredTraces: boolean,
    matchingIngredientTerms: string[],
  ): string {
    const parts: string[] = [`[${type}/${severity}] ${allergen}`];

    if (hasDivergence) {
      parts.push(
        `DIVERGÊNCIA CRÍTICA: Declarado livre, porém detectado nos ingredientes ("${matchingIngredientTerms.join(', ') || 'glúten indicado'}")`
      );
    } else {
      if (inIngredients) {
        if (isDeclaredContains) {
          parts.push('declarado pelo parceiro: CONTÉM');
        } else {
          parts.push('detectado nos ingredientes');
        }
      }
      if (inCrossContamination) {
        if (isDeclaredTraces) {
          parts.push('declarado pelo parceiro: PODE CONTER (traços)');
        } else if (!acceptsCrossContamination && severity === SeverityLevel.HIGH) {
          parts.push('detectado em contaminação cruzada (traços) — elevado para DANGER por não aceitar traços');
        } else {
          parts.push('detectado em contaminação cruzada (traços)');
        }
      }
    }

    return parts.join(' — ');
  }

  private static buildReport(
    riskLevel: RiskLevel,
    conflicts: ConflictDetail[],
    reasoning: string,
    confidenceLevel?: ConfidenceLevel,
    analysisDetails?: AnalysisDetails,
  ): CompatibilityReport {
    return {
      isCompatible: riskLevel === RiskLevel.SAFE,
      riskLevel,
      conflicts,
      reasoning,
      confidenceLevel,
      analysisDetails,
    };
  }

  private static riskOrder(risk: RiskLevel): number {
    const order: Record<RiskLevel, number> = {
      [RiskLevel.UNEVALUATED]: -1,
      [RiskLevel.SAFE]:        0,
      [RiskLevel.WARNING]:     1,
      [RiskLevel.DANGER]:      2,
      [RiskLevel.BLOCKED]:     3,
    };
    return order[risk];
  }
}

