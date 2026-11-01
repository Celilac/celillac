import 'enums.dart';

/// Models de `/consumer/*` (docs/API_CONTRACTS.md §11). Apenas exibição:
/// nenhum campo aqui é usado para decidir compatibilidade alimentar.

enum ConsumerStatusAction {
  activate('ACTIVATE'),
  deactivate('DEACTIVATE');

  const ConsumerStatusAction(this.wireValue);

  final String wireValue;
}

class ConsumerInfo {
  const ConsumerInfo({
    required this.id,
    required this.userId,
    required this.status,
  });

  factory ConsumerInfo.fromJson(Map<String, dynamic> json) => ConsumerInfo(
    id: json['id'] as String,
    userId: json['userId'] as String,
    status: json['status'] as String? ?? '',
  );

  final String id;
  final String userId;

  /// Valor cru da API (ex.: `CONTA_CRIADA`, `ATIVO`, `INATIVO`).
  final String status;

  /// O web trata como inativo somente `INATIVO`; qualquer outro valor é ativo.
  bool get isInactive => status == 'INATIVO';
}

class ConsumerRestriction {
  const ConsumerRestriction({
    this.id,
    required this.allergen,
    required this.severity,
    this.type,
    this.notes,
  });

  factory ConsumerRestriction.fromJson(Map<String, dynamic> json) =>
      ConsumerRestriction(
        id: json['id'] as String?,
        allergen: AllergenType.fromWire(json['allergen'] as String),
        severity: SeverityLevel.fromWire(json['severity'] as String),
        type: json['type'] as String?,
        notes: json['notes'] as String?,
      );

  final String? id;
  final AllergenType allergen;
  final SeverityLevel severity;
  final String? type;
  final String? notes;
}

/// Perfil alimentar como devolvido por `/consumer/*` (sem `isActive` nem
/// `requiresHistoryRevalidation`, que só existem em `/food-profile`).
class ConsumerFoodProfile {
  const ConsumerFoodProfile({
    required this.acceptsCrossContamination,
    required this.restrictions,
  });

  factory ConsumerFoodProfile.fromJson(Map<String, dynamic> json) =>
      ConsumerFoodProfile(
        acceptsCrossContamination:
            json['acceptsCrossContamination'] as bool? ?? false,
        restrictions: (json['restrictions'] as List<dynamic>? ?? [])
            .map((e) => ConsumerRestriction.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  final bool acceptsCrossContamination;
  final List<ConsumerRestriction> restrictions;
}

class ConsumerMe {
  const ConsumerMe({
    required this.consumer,
    required this.foodProfile,
    required this.hasIncompleteProfileWarning,
  });

  factory ConsumerMe.fromJson(Map<String, dynamic> json) => ConsumerMe(
    consumer: ConsumerInfo.fromJson(json['consumer'] as Map<String, dynamic>),
    foodProfile: json['foodProfile'] == null
        ? null
        : ConsumerFoodProfile.fromJson(
            json['foodProfile'] as Map<String, dynamic>,
          ),
    hasIncompleteProfileWarning:
        json['hasIncompleteProfileWarning'] as bool? ?? false,
  );

  final ConsumerInfo consumer;
  final ConsumerFoodProfile? foodProfile;

  /// Repassado exatamente como vem da API.
  final bool hasIncompleteProfileWarning;
}

class ConsumerStatusResult {
  const ConsumerStatusResult({
    required this.id,
    required this.userId,
    required this.status,
  });

  factory ConsumerStatusResult.fromJson(Map<String, dynamic> json) =>
      ConsumerStatusResult(
        id: json['id'] as String,
        userId: json['userId'] as String,
        status: json['status'] as String? ?? '',
      );

  final String id;
  final String userId;
  final String status;

  bool get isInactive => status == 'INATIVO';
}
