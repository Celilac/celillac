import 'package:flutter/material.dart';

import '../../api/models/enums.dart';
import '../../core/theme/app_colors.dart';

class _RiskConfig {
  const _RiskConfig(this.background, this.icon, this.label);

  final Color background;
  final String icon;
  final String label;
}

const _riskConfig = <RiskLevel, _RiskConfig>{
  RiskLevel.safe: _RiskConfig(AppColors.riskSafeBg, '✅', 'COMPATÍVEL'),
  RiskLevel.warning: _RiskConfig(AppColors.riskWarningBg, '🟡', 'ATENÇÃO'),
  RiskLevel.danger: _RiskConfig(AppColors.riskDangerBg, '⚠️', 'PERIGO'),
  RiskLevel.blocked: _RiskConfig(AppColors.riskBlockedBg, '⛔', 'BLOQUEADO'),
  RiskLevel.unevaluated: _RiskConfig(AppColors.riskUnevaluatedBg, '⚪', 'PERFIL INCOMPLETO'),
};

/// Banner de resultado de compatibilidade.
/// Recebe apenas campos já decididos pelo backend (riskLevel, message,
/// reasoning) — nunca um Product/FoodProfile bruto. Ver docs/FRONTEND_STRATEGY.md.
class AlertBanner extends StatelessWidget {
  const AlertBanner({
    super.key,
    required this.status,
    required this.message,
    this.reasoning,
  });

  final RiskLevel status;
  final String message;
  final String? reasoning;

  @override
  Widget build(BuildContext context) {
    final config = _riskConfig[status]!;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: config.background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(config.icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text(
                config.label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            message,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (reasoning != null && reasoning!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              reasoning!,
              style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13, height: 1.3),
            ),
          ],
        ],
      ),
    );
  }
}
