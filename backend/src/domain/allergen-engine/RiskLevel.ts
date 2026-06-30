// backend/src/domain/allergen-engine/RiskLevel.ts

/**
 * RiskLevel — Nível de risco de compatibilidade entre perfil e produto.
 * ⚠️ ARQUIVO CRÍTICO — Qualquer alteração exige aprovação humana (GUARDRAILS.md #1)
 *
 * SAFE    → Produto compatível. Nenhum alérgeno do perfil encontrado.
 * WARNING → Alérgeno de severidade LOW ou MEDIUM encontrado.
 * DANGER  → Alérgeno de severidade HIGH encontrado.
 * BLOCKED → Alérgeno de severidade FATAL ou produto sem ingredientes.
 */
export enum RiskLevel {
  SAFE    = 'SAFE',
  WARNING = 'WARNING',
  DANGER  = 'DANGER',
  BLOCKED = 'BLOCKED',
}
