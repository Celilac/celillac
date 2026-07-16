import 'package:flutter/material.dart';

import '../../../api/models/enums.dart';
import '../../../core/theme/app_colors.dart';
import '../allergen_catalog.dart';

const Map<SeverityLevel, Color> _severityColors = {
  SeverityLevel.lifestyle: AppColors.severityLifestyle,
  SeverityLevel.low: AppColors.severityLow,
  SeverityLevel.medium: AppColors.severityMedium,
  SeverityLevel.high: AppColors.severityHigh,
  SeverityLevel.fatal: AppColors.severityFatal,
};

class SeveritySelector extends StatelessWidget {
  const SeveritySelector({super.key, required this.selected, required this.onSelect});

  final SeverityLevel? selected;
  final ValueChanged<SeverityLevel> onSelect;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: onboardingSeverities.map((severity) {
          final color = _severityColors[severity]!;
          final isActive = selected == severity;
          return GestureDetector(
            onTap: () => onSelect(severity),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
              decoration: BoxDecoration(
                border: Border.all(color: color, width: 1.5),
                borderRadius: BorderRadius.circular(8),
                color: isActive ? color : Colors.transparent,
              ),
              child: Text(
                severity.label,
                style: TextStyle(
                  color: isActive ? Colors.white : AppColors.textMutedLight,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
