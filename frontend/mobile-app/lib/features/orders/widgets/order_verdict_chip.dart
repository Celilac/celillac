import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../order_labels.dart';

/// Mostra o `allergenCheckVerdict` do pedido como o backend decidiu. Valores
/// desconhecidos não exibem nada (o app nunca infere segurança).
class OrderVerdictChip extends StatelessWidget {
  const OrderVerdictChip({super.key, required this.verdict});

  final String verdict;

  @override
  Widget build(BuildContext context) {
    final label = orderVerdictLabel(verdict);
    if (label == null) return const SizedBox.shrink();
    final isSafe = verdict == 'SAFE';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isSafe ? AppColors.riskSafeBg : AppColors.riskWarningBg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(isSafe ? Icons.verified_outlined : Icons.warning_amber_rounded, size: 16, color: Colors.white),
          const SizedBox(width: 6),
          Flexible(
            child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
