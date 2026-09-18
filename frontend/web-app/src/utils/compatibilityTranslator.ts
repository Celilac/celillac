// frontend/web-app/src/utils/compatibilityTranslator.ts

export const ALLERGEN_LABELS: Record<string, string> = {
  GLUTEN:    'Glúten',
  LACTOSE:   'Lactose',
  NUTS:      'Castanhas / Nozes',
  SOY:       'Soja',
  EGGS:      'Ovos',
  SHELLFISH: 'Frutos do Mar',
  FISH:      'Peixes',
  WHEAT:     'Trigo',
  SESAME:    'Gergelim',
  OTHER:     'Outro',
};

export const RESTRICTION_TYPE_LABELS: Record<string, string> = {
  ALLERGY:             'Alergia',
  INTOLERANCE:         'Intolerância',
  MEDICAL_RESTRICTION: 'Restrição Médica',
  DIETARY_PREFERENCE:  'Preferência Alimentar',
  LIFESTYLE:           'Estilo de Vida',
};

export const SEVERITY_LABELS: Record<string, string> = {
  FATAL:     'Severidade Fatal',
  HIGH:      'Severidade Alta',
  MEDIUM:    'Severidade Média',
  LOW:       'Severidade Baixa',
  LIFESTYLE: 'Estilo de Vida',
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  BLOCKED:     'Incompatível (Bloqueado)',
  DANGER:      'Alto Risco',
  WARNING:     'Atenção',
  SAFE:        'Compatível (Seguro)',
  UNEVALUATED: 'Não Avaliado',
};

/**
 * Traduz o nome de um alérgeno de código enum para português.
 * Exemplo: 'GLUTEN' -> 'Glúten'
 */
export function translateAllergen(allergen: string): string {
  if (!allergen) return '';
  const key = allergen.trim().toUpperCase();
  return ALLERGEN_LABELS[key] || allergen;
}

/**
 * Traduz a frase de resumo do veredito (reasoning).
 * Exemplo: '1 conflito(s) encontrado(s). Risco: BLOCKED.'
 *       -> '1 conflito(s) encontrado(s). Risco: Incompatível (Bloqueado).'
 */
export function translateReasoning(reasoning: string): string {
  if (!reasoning) return '';

  let text = reasoning;

  // Substitui os níveis de risco que vierem em inglês no reasoning
  Object.entries(RISK_LEVEL_LABELS).forEach(([riskKey, label]) => {
    const regex = new RegExp(`\\b${riskKey}\\b`, 'g');
    text = text.replace(regex, label);
  });

  return text;
}

/**
 * Traduz a explicação de cada conflito detectado.
 * Exemplo: '[ALLERGY/FATAL] GLUTEN — detectado em contaminação cruzada (traços)'
 *       -> '[Alergia / Severidade Fatal] Glúten — detectado em contaminação cruzada (traços)'
 */
export function translateConflictReason(reason: string): string {
  if (!reason) return '';

  let text = reason;

  // 1. Traduz o prefixo [TIPO/SEVERIDADE], ex: [ALLERGY/FATAL] -> [Alergia / Severidade Fatal]
  text = text.replace(/\[([A-Z_]+)\/([A-Z_]+)\]/g, (_, type, severity) => {
    const typeLabel = RESTRICTION_TYPE_LABELS[type] || type;
    const severityLabel = SEVERITY_LABELS[severity] || severity;
    return `[${typeLabel} / ${severityLabel}]`;
  });

  // 2. Traduz nomes de alérgenos que aparecem no texto em caixa alta
  Object.entries(ALLERGEN_LABELS).forEach(([allergenKey, label]) => {
    const regex = new RegExp(`\\b${allergenKey}\\b`, 'g');
    text = text.replace(regex, label);
  });

  // 3. Traduz menções a níveis de risco no meio de frases técnicas
  // Ex: "elevado para DANGER por não aceitar traços" -> "elevado para Alto Risco por não aceitar traços"
  Object.entries(RISK_LEVEL_LABELS).forEach(([riskKey, label]) => {
    const regex = new RegExp(`\\b${riskKey}\\b`, 'g');
    text = text.replace(regex, label);
  });

  return text;
}
