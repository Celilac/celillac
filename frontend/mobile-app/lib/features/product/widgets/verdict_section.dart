import 'package:flutter/material.dart';

import '../../../api/models/compatibility_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/alert_banner.dart';

/// Veredito de compatibilidade. Exibe **apenas** o que veio de
/// `POST /compatibility/check` (riskLevel, reasoning, conflicts). Em falha mostra
/// erro com "Tentar novamente" — nunca um estado que pareça seguro.
class VerdictSection extends StatelessWidget {
  const VerdictSection({
    super.key,
    required this.isLoading,
    required this.report,
    required this.errorMessage,
    required this.onRetry,
  });

  final bool isLoading;
  final CompatibilityReport? report;
  final String? errorMessage;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Padding(
        key: Key('verdict-loading'),
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Row(
          children: [
            SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
            SizedBox(width: 12),
            Text('Verificando compatibilidade...', style: TextStyle(color: AppColors.textMutedLight)),
          ],
        ),
      );
    }
    if (errorMessage != null) {
      return Container(
        key: const Key('verdict-error'),
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Compatibilidade não verificada',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(errorMessage!, style: const TextStyle(color: AppColors.textMutedLight)),
            const SizedBox(height: 8),
            OutlinedButton(
              key: const Key('verdict-retry'),
              onPressed: onRetry,
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      );
    }
    final r = report;
    if (r == null) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AlertBanner(
          status: r.riskLevel,
          message: r.reasoning.isNotEmpty ? r.reasoning : 'Sem detalhes adicionais informados pelo servidor.',
        ),
        if (r.conflicts.isNotEmpty)
          Container(
            key: const Key('verdict-conflicts'),
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final c in r.conflicts)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${c.allergen} · ${c.severity}',
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                        ),
                        Text(c.reason, style: const TextStyle(color: AppColors.textMutedLight, fontSize: 13)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}
