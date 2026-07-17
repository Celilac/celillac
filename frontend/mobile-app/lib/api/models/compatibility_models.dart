import 'enums.dart';

/// Modelo puramente de exibição — o backend (AllergenEngine) é a única
/// fonte de verdade para riskLevel/reasoning/conflicts. Nunca recalcular
/// compatibilidade a partir de campos brutos do produto/perfil.
class CompatibilityConflict {
  const CompatibilityConflict({
    required this.allergen,
    required this.severity,
    required this.reason,
  });

  factory CompatibilityConflict.fromJson(Map<String, dynamic> json) => CompatibilityConflict(
        allergen: json['allergen'] as String,
        severity: json['severity'] as String,
        reason: json['reason'] as String,
      );

  final String allergen;
  final String severity;
  final String reason;
}

class CompatibilityReport {
  const CompatibilityReport({
    required this.isCompatible,
    required this.riskLevel,
    required this.reasoning,
    required this.conflicts,
  });

  factory CompatibilityReport.fromJson(Map<String, dynamic> json) => CompatibilityReport(
        isCompatible: json['isCompatible'] as bool,
        riskLevel: RiskLevel.fromWire(json['riskLevel'] as String),
        reasoning: (json['reasoning'] as String?) ?? '',
        conflicts: (json['conflicts'] as List<dynamic>? ?? [])
            .map((e) => CompatibilityConflict.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  final bool isCompatible;
  final RiskLevel riskLevel;
  final String reasoning;
  final List<CompatibilityConflict> conflicts;
}
