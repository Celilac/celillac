import 'package:flutter/material.dart';

import '../../../core/storage/recent_checks_storage.dart';
import '../../../core/theme/app_colors.dart';
import '../home_block.dart';
import 'home_section.dart';

/// "Verificados recentemente": só nome e marca. O veredito não é guardado e só
/// aparece no detalhe do produto.
class RecentChecksSection extends StatelessWidget {
  const RecentChecksSection({super.key, required this.recents, required this.onOpen});

  final HomeBlock<List<RecentCheck>> recents;
  final ValueChanged<RecentCheck> onOpen;

  @override
  Widget build(BuildContext context) {
    final data = recents.data;
    if (data == null) return const HomeBlockLoading(key: Key('home-recents-loading'));
    if (data.isEmpty) {
      return const HomeEmptyText(
        'Os produtos que você verificar aparecem aqui.',
        key: Key('home-recents-empty'),
      );
    }
    return Column(
      children: [
        for (final item in data)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              child: ListTile(
                key: Key('home-recent-${item.productId}'),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                title: Text(
                  item.productName,
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                ),
                subtitle: item.brand.isEmpty
                    ? null
                    : Text(item.brand, style: const TextStyle(color: AppColors.textMutedLight)),
                trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                onTap: () => onOpen(item),
              ),
            ),
          ),
      ],
    );
  }
}
