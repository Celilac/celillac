/// Enums de domínio — ver docs/API_CONTRACTS.md seção 7.
/// NUNCA usados para calcular compatibilidade localmente — apenas para exibição.
enum AllergenType {
  gluten('GLUTEN', 'Glúten', '🌾'),
  lactose('LACTOSE', 'Lactose', '🥛'),
  nuts('NUTS', 'Castanhas', '🥜'),
  soy('SOY', 'Soja', '🫘'),
  eggs('EGGS', 'Ovos', '🥚'),
  shellfish('SHELLFISH', 'Frutos do Mar', '🦐'),
  fish('FISH', 'Peixe', '🐟'),
  sesame('SESAME', 'Gergelim', '🌰'),
  other('OTHER', 'Outro', '❓');

  const AllergenType(this.wireValue, this.label, this.emoji);

  final String wireValue;
  final String label;
  final String emoji;

  static AllergenType fromWire(String value) {
    return AllergenType.values.firstWhere(
      (e) => e.wireValue == value,
      orElse: () => AllergenType.other,
    );
  }
}

enum SeverityLevel {
  lifestyle('LIFESTYLE', 'Estilo de vida'),
  low('LOW', 'Baixa'),
  medium('MEDIUM', 'Média'),
  high('HIGH', 'Alta'),
  fatal('FATAL', 'FATAL');

  const SeverityLevel(this.wireValue, this.label);

  final String wireValue;
  final String label;

  static SeverityLevel fromWire(String value) {
    return SeverityLevel.values.firstWhere(
      (e) => e.wireValue == value,
      orElse: () => SeverityLevel.medium,
    );
  }
}

enum RiskLevel {
  safe('SAFE'),
  warning('WARNING'),
  danger('DANGER'),
  blocked('BLOCKED'),
  unevaluated('UNEVALUATED');

  const RiskLevel(this.wireValue);

  final String wireValue;

  static RiskLevel fromWire(String value) {
    return RiskLevel.values.firstWhere(
      (e) => e.wireValue == value,
      orElse: () => RiskLevel.unevaluated,
    );
  }
}

enum UserRole {
  celiaco('CELIACO'),
  parceiro('PARCEIRO'),
  admin('ADMIN');

  const UserRole(this.wireValue);

  final String wireValue;

  static UserRole fromWire(String value) {
    return UserRole.values.firstWhere(
      (e) => e.wireValue == value,
      orElse: () => UserRole.celiaco,
    );
  }
}
