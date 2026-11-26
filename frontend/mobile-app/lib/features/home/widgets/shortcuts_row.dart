import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../home_tab.dart';

/// Atalhos para as abas de uso mais frequente.
class ShortcutsRow extends StatelessWidget {
  const ShortcutsRow({super.key, required this.onSelectTab});

  final ValueChanged<HomeTab> onSelectTab;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _shortcut(HomeTab.scanner, Icons.qr_code_scanner, 'Scanner'),
        const SizedBox(width: 12),
        _shortcut(HomeTab.search, Icons.search, 'Buscar'),
        const SizedBox(width: 12),
        _shortcut(HomeTab.partners, Icons.storefront, 'Parceiros'),
      ],
    );
  }

  Widget _shortcut(HomeTab tab, IconData icon, String label) {
    return Expanded(
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          key: Key('home-shortcut-${tab.name}'),
          onTap: () => onSelectTab(tab),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 4),
            child: Column(
              children: [
                Icon(icon, color: AppColors.primary, size: 28),
                const SizedBox(height: 8),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
