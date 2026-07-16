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

const Map<SeverityLevel, String> severityDescriptions = {
  SeverityLevel.lifestyle: 'Preferência pessoal, sem risco médico',
  SeverityLevel.low: 'Sensibilidade leve',
  SeverityLevel.medium: 'Intolerância moderada',
  SeverityLevel.high: 'Alergia severa',
  SeverityLevel.fatal: 'Doença celíaca / grave',
};
