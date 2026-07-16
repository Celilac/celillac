// backend/src/domain/food-profile/value-objects/SeverityLevel.ts

/**
 * SeverityLevel — Nível de severidade de uma restrição alimentar.
 * Definido em DOMAIN_MODEL.md: LIFESTYLE | LOW | MEDIUM | HIGH | FATAL
 * FATAL = Celíaco. Zero tolerância, incluindo traços.
 * LIFESTYLE = preferência pessoal (ex.: vegano), sem risco médico associado.
 */
export enum SeverityLevel {
  LIFESTYLE = 'LIFESTYLE',
  LOW       = 'LOW',
  MEDIUM    = 'MEDIUM',
  HIGH      = 'HIGH',
  FATAL     = 'FATAL',
}

/**
 * SEVERITY_ORDER — Mapeamento numérico para comparação de risco.
 * Usado pelo AllergenEngine para determinar o nível final do relatório.
 */
export const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  [SeverityLevel.LIFESTYLE]: 0,
  [SeverityLevel.LOW]:       1,
  [SeverityLevel.MEDIUM]:    2,
  [SeverityLevel.HIGH]:      3,
  [SeverityLevel.FATAL]:     4,
};
