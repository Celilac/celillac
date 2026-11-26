import 'package:flutter/material.dart';

import '../../../api/models/consumer_models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/restriction_chip.dart';
import '../home_block.dart';
import 'home_section.dart';

/// Resumo do perfil alimentar como devolvido por `GET /consumer/me`. Falha nunca
/// é exibida como ausência de restrições.
class ProfileSummaryCard extends StatelessWidget {
  const ProfileSummaryCard({super.key, required this.consumer, required this.onViewProfile});

  final HomeBlock<ConsumerMe> consumer;
  final VoidCallback onViewProfile;

  @override
  Widget build(BuildContext context) {
    final me = consumer.data;
    if (me == null) {
      return consumer.error != null
          ? HomeBlockError(id: 'profile', message: consumer.error!, onRetry: consumer.load)
          : const HomeBlockLoading(key: Key('home-profile-loading'));
    }
    final profile = me.foodProfile;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (me.consumer.isInactive)
            const Padding(
              key: Key('home-profile-inactive'),
              padding: EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Icon(Icons.pause_circle_outline, color: AppColors.error, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Perfil inativo. Reative-o na aba Perfil.',
                      style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          if (profile == null || profile.restrictions.isEmpty)
            const HomeEmptyText('Nenhuma restrição cadastrada.')
          else
            Wrap(
              children: [
                for (final r in profile.restrictions) RestrictionChip(allergen: r.allergen, severity: r.severity),
              ],
            ),
          if (profile != null) ...[
            const SizedBox(height: 8),
            Text(
              profile.acceptsCrossContamination
                  ? 'Contaminação cruzada: aceita risco de traços.'
                  : 'Contaminação cruzada: não aceita traços.',
              style: const TextStyle(color: AppColors.textMutedLight, fontSize: 13),
            ),
          ],
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              key: const Key('home-view-profile'),
              onPressed: onViewProfile,
              child: const Text('Ver perfil'),
            ),
          ),
        ],
      ),
    );
  }
}
