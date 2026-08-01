import '../../api/models/enums.dart';

/// Ordem de exibição dos alérgenos na tela de onboarding.
const List<AllergenType> onboardingAllergens = [
  AllergenType.gluten,
  AllergenType.lactose,
  AllergenType.nuts,
  AllergenType.soy,
  AllergenType.eggs,
  AllergenType.shellfish,
  AllergenType.fish,
  AllergenType.sesame,
];

/// Ordem de exibição das severidades no seletor.
const List<SeverityLevel> onboardingSeverities = [
  SeverityLevel.lifestyle,
  SeverityLevel.low,
  SeverityLevel.medium,
  SeverityLevel.high,
  SeverityLevel.fatal,
];

// Descreve o grau de risco/tolerância (severidade), não o diagnóstico.
// O tipo de condição (alergia, intolerância, restrição médica etc.) é
// informado separadamente pelo usuário e não deve ser inferido daqui.
const Map<SeverityLevel, String> severityDescriptions = {
  SeverityLevel.lifestyle: 'Preferência pessoal, sem risco médico',
  SeverityLevel.low: 'Risco leve — traços geralmente tolerados',
  SeverityLevel.medium: 'Risco moderado — traços geralmente tolerados',
  SeverityLevel.high: 'Risco alto ao ingerir o alérgeno',
  SeverityLevel.fatal: 'Risco crítico — zero tolerância, incluindo traços',
};
