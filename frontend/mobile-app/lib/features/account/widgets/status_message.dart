import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Mensagem inline de erro/sucesso dos formulários de conta.
class StatusMessage extends StatelessWidget {
  const StatusMessage({super.key, required this.text, this.isError = false});

  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final color = isError ? AppColors.error : AppColors.success;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 13, height: 1.4)),
    );
  }
}
