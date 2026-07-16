import 'package:flutter/material.dart';

import '../../api/models/enums.dart';
import '../../core/theme/app_colors.dart';

const _severityColors = <SeverityLevel, Color>{
  SeverityLevel.lifestyle: AppColors.severityLifestyle,
  SeverityLevel.low: AppColors.severityLow,
  SeverityLevel.medium: AppColors.severityMedium,
  SeverityLevel.high: AppColors.severityHigh,
  SeverityLevel.fatal: AppColors.severityFatal,
};

/// Pill de alérgeno + badge de severidade colorido. Widget puramente
/// de exibição — apenas allergen/severity, nada bruto do catálogo.
class RestrictionChip extends StatelessWidget {
  const RestrictionChip({super.key, required this.allergen, required this.severity});

  final AllergenType allergen;
  final SeverityLevel severity;

  @override
  Widget build(BuildContext context) {
    final color = _severityColors[severity]!;
    return Container(
      margin: const EdgeInsets.only(right: 8, bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            allergen.label,
            style: const TextStyle(
              color: Color(0xFFE2E8F0),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
            child: Text(
              severity.label,
              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
