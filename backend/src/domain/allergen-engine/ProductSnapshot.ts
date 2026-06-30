// backend/src/domain/allergen-engine/ProductSnapshot.ts

/**
 * ProductSnapshot — Representação do produto para análise do motor.
 * ⚠️ ARQUIVO CRÍTICO — Qualquer alteração exige aprovação humana (GUARDRAILS.md #1)
 *
 * Interface pura, sem dependência de ORM ou banco.
 * Derivada dos campos da tabela `products` (DATABASE.md).
 */
export interface ProductSnapshot {
  id:                string;
  name:              string;
  /** Lista de ingredientes em texto livre (PT ou EN). Vazio = sem informação. */
  ingredients:       string;
  /** Campo declarado pelo fabricante: true = produto contém glúten. */
  hasGluten:         boolean;
  /** Texto de contaminação cruzada (ex: "Pode conter traços de glúten"). */
  crossContamination: string;
}
