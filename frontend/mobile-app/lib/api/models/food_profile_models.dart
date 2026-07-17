import 'enums.dart';

class Restriction {
  const Restriction({this.id, required this.allergen, required this.severity});

  factory Restriction.fromJson(Map<String, dynamic> json) => Restriction(
        id: json['id'] as String?,
        allergen: AllergenType.fromWire(json['allergen'] as String),
        severity: SeverityLevel.fromWire(json['severity'] as String),
      );

  final String? id;
  final AllergenType allergen;
  final SeverityLevel severity;

  Map<String, dynamic> toJson() => {
        'allergen': allergen.wireValue,
        'severity': severity.wireValue,
      };
}

class FoodProfile {
  const FoodProfile({
    required this.id,
    required this.userId,
    required this.isActive,
    required this.requiresHistoryRevalidation,
    required this.restrictions,
  });

  factory FoodProfile.fromJson(Map<String, dynamic> json) => FoodProfile(
        id: json['id'] as String,
        userId: json['userId'] as String,
        isActive: json['isActive'] as bool,
        requiresHistoryRevalidation: json['requiresHistoryRevalidation'] as bool,
        restrictions: (json['restrictions'] as List<dynamic>)
            .map((e) => Restriction.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  final String id;
  final String userId;
  final bool isActive;
  final bool requiresHistoryRevalidation;
  final List<Restriction> restrictions;
}

class FoodProfilePayload {
  const FoodProfilePayload({required this.userId, required this.restrictions});

  final String userId;
  final List<Restriction> restrictions;

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'restrictions': restrictions.map((r) => r.toJson()).toList(),
      };
}
