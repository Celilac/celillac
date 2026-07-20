import 'package:flutter/material.dart';

import '../../../api/models/enums.dart';
import '../../../core/theme/app_colors.dart';
import 'severity_selector.dart';

class AllergenToggleTile extends StatelessWidget {
  const AllergenToggleTile({
    super.key,
    required this.allergen,
    required this.selectedSeverity,
    required this.onToggle,
    required this.onSeveritySelected,
  });

  final AllergenType allergen;
  final SeverityLevel? selectedSeverity;
  final VoidCallback onToggle;
  final ValueChanged<SeverityLevel> onSeveritySelected;

  @override
  Widget build(BuildContext context) {
    final isSelected = selectedSeverity != null;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          InkWell(
            onTap: onToggle,
            child: Container(
              padding: const EdgeInsets.all(16),
              color: isSelected ? const Color(0xFF1D3A5E) : Colors.transparent,
              child: Row(
                children: [
                  Text(allergen.emoji, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      allergen.label,
                      style: const TextStyle(
                        color: Color(0xFFE2E8F0),
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Text(
                    isSelected ? '✓' : '+',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isSelected)
            SeveritySelector(selected: selectedSeverity, onSelect: onSeveritySelected),
        ],
      ),
    );
  }
}
